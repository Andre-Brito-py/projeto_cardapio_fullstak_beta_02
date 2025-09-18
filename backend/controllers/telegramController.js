import MultiStoreTelegramService from '../services/multiStoreTelegramService.js';
import TelegramClient from '../models/telegramClientModel.js';
import TelegramConversation from '../models/telegramConversationModel.js';
import TelegramCampaign from '../models/telegramCampaignModel.js';
import SystemSettings from '../models/systemSettingsModel.js';
import logger from '../utils/logger.js';

// Instância do serviço multi-loja
const multiStoreTelegramService = new MultiStoreTelegramService();

class TelegramController {
    /**
     * Receber webhook do Telegram
     */
    async receiveWebhook(req, res) {
        try {
            const update = req.body;
            
            // Log da mensagem recebida
            if (update.message) {
                const { chat, from, text } = update.message;
                logger.info('Webhook Telegram recebido:', {
                    chatId: chat.id,
                    userId: from.id,
                    userName: from.first_name,
                    message: text?.substring(0, 100) + (text?.length > 100 ? '...' : ''),
                    timestamp: new Date()
                });
            }

            // Processar mensagem de forma assíncrona usando o serviço multi-loja
            setImmediate(async () => {
                try {
                    // Inicializar serviço multi-loja se necessário
                    await multiStoreTelegramService.initialize();
                    
                    // Processar mensagem
                    if (update.message) {
                        await multiStoreTelegramService.processMessage(update.message);
                    } else if (update.callback_query) {
                        // Processar callback query (botões inline)
                        await multiStoreTelegramService.processCallbackQuery(update.callback_query);
                    }
                } catch (error) {
                    logger.error('Erro ao processar mensagem do Telegram:', error);
                }
            });

            // Responder imediatamente ao Telegram (obrigatório)
            res.status(200).json({ ok: true });

        } catch (error) {
            logger.error('Erro no webhook do Telegram:', error);
            res.status(500).json({ 
                ok: false, 
                error: 'Erro interno do servidor' 
            });
        }
    }

    /**
     * Configurar webhook do Telegram
     */
    async setWebhook(req, res) {
        try {
            const { webhookUrl } = req.body;

            if (!webhookUrl) {
                return res.status(400).json({
                    success: false,
                    message: 'URL do webhook é obrigatória'
                });
            }

            // Inicializar serviço multi-loja
            const initialized = await multiStoreTelegramService.initialize();
            if (!initialized) {
                return res.status(500).json({
                    success: false,
                    message: 'Erro ao inicializar serviço do Telegram'
                });
            }

            // Configurar webhook
            const result = await multiStoreTelegramService.setWebhook();

            if (result) {
                logger.info('Webhook configurado com sucesso:', webhookUrl);
                res.json({
                    success: true,
                    message: 'Webhook configurado com sucesso',
                    webhookUrl
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao configurar webhook'
                });
            }

        } catch (error) {
            logger.error('Erro ao configurar webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Remover webhook do Telegram
     */
    async removeWebhook(req, res) {
        try {
            const result = await multiStoreTelegramService.removeWebhook();

            if (result) {
                logger.info('Webhook removido com sucesso');
                res.json({
                    success: true,
                    message: 'Webhook removido com sucesso'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao remover webhook'
                });
            }

        } catch (error) {
            logger.error('Erro ao remover webhook:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Enviar mensagem individual
     */
    async sendMessage(req, res) {
        try {
            const { chatId, message, type = 'text' } = req.body;

            if (!chatId || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Chat ID e mensagem são obrigatórios'
                });
            }

            await multiStoreTelegramService.initialize();
            
            let result;
            let messageContent = message;
            
            switch (type) {
                case 'text':
                    result = await multiStoreTelegramService.sendMessage(chatId, message);
                    break;
                case 'photo':
                    result = await multiStoreTelegramService.sendPhoto(chatId, message.photo, message.caption);
                    messageContent = message.caption || 'Foto enviada';
                    break;
                case 'document':
                    result = await multiStoreTelegramService.sendDocument(chatId, message.document, message.caption);
                    messageContent = message.caption || 'Documento enviado';
                    break;
                default:
                    return res.status(400).json({
                        success: false,
                        message: 'Tipo de mensagem inválido'
                    });
            }

            // Salvar mensagem enviada no histórico
            try {
                await TelegramConversation.create({
                    telegramId: chatId,
                    messageType: 'outgoing',
                    content: messageContent,
                    messageData: {
                        type,
                        sentBy: 'admin',
                        adminId: req.user?.id
                    },
                    status: 'sent',
                    aiResponse: null,
                    isFromAdmin: true
                });
            } catch (saveError) {
                console.error('Erro ao salvar mensagem enviada:', saveError);
            }

            if (result) {
                logger.info(`Mensagem enviada para ${chatId}`);
                res.json({
                    success: true,
                    message: 'Mensagem enviada com sucesso',
                    result
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao enviar mensagem'
                });
            }

        } catch (error) {
            logger.error('Erro ao enviar mensagem:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Enviar disparo em massa
     */
    async sendBroadcast(req, res) {
        try {
            const { message } = req.body;
            const adminChatId = req.user?.telegramId; // Assumindo que o usuário está autenticado

            if (!message) {
                return res.status(400).json({
                    success: false,
                    message: 'Mensagem é obrigatória'
                });
            }

            if (!adminChatId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autorizado ou Telegram ID não configurado'
                });
            }

            // Executar disparo de forma assíncrona
            setImmediate(async () => {
                try {
                    await multiStoreTelegramService.sendBroadcast(message, adminChatId);
                } catch (error) {
                    logger.error('Erro no disparo em massa:', error);
                }
            });

            res.json({
                success: true,
                message: 'Disparo em massa iniciado'
            });

        } catch (error) {
            logger.error('Erro ao iniciar disparo em massa:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Obter estatísticas
     */
    async getStats(req, res) {
        try {
            const { startDate, endDate } = req.query;
            
            // Filtros de data
            const dateFilter = {};
            if (startDate && endDate) {
                dateFilter.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate)
                };
            }
            
            // Estatísticas de clientes
            const totalClients = await TelegramClient.countDocuments();
            const activeClients = await TelegramClient.countDocuments({
                isActive: true,
                isBlocked: false
            });
            const newClients = await TelegramClient.countDocuments(dateFilter);
            
            // Estatísticas de mensagens
            const messageStats = await TelegramConversation.getStats(
                startDate ? new Date(startDate) : null,
                endDate ? new Date(endDate) : null
            );
            
            const totalMessages = await TelegramConversation.countDocuments(dateFilter);
            
            // Estatísticas de campanhas
            const totalCampaigns = await TelegramCampaign.countDocuments(dateFilter);
            const campaignStats = await TelegramCampaign.getGeneralStats(
                startDate ? new Date(startDate) : null,
                endDate ? new Date(endDate) : null
            );
            
            // Clientes inativos (30 dias)
            const inactiveDate = new Date();
            inactiveDate.setDate(inactiveDate.getDate() - 30);
            const inactiveClients = await TelegramClient.countDocuments({
                lastInteraction: { $lt: inactiveDate },
                isActive: true
            });
            
            const stats = {
                clients: {
                    total: totalClients,
                    active: activeClients,
                    inactive: inactiveClients,
                    new: newClients
                },
                messages: {
                    total: totalMessages,
                    byType: messageStats
                },
                campaigns: {
                    total: totalCampaigns,
                    byStatus: campaignStats
                }
            };
            
            res.json({
                success: true,
                stats
            });
        } catch (error) {
            console.error('Erro ao obter estatísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter estatísticas'
            });
        }
    }

    /**
     * Obter lista de clientes
     */
    async getClients(req, res) {
        try {
            const { page = 1, limit = 50, search = '', status = 'all' } = req.query;
            
            // Construir filtros
            const filters = {};
            
            if (search) {
                filters.$or = [
                    { firstName: { $regex: search, $options: 'i' } },
                    { lastName: { $regex: search, $options: 'i' } },
                    { username: { $regex: search, $options: 'i' } }
                ];
            }
            
            if (status === 'active') {
                filters.isActive = true;
                filters.isBlocked = false;
            } else if (status === 'blocked') {
                filters.isBlocked = true;
            } else if (status === 'inactive') {
                filters.isActive = false;
            }
            
            // Buscar clientes com paginação
            const clients = await TelegramClient.find(filters)
                .sort({ lastInteraction: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean();
            
            // Contar total
            const total = await TelegramClient.countDocuments(filters);
            
            res.json({
                success: true,
                clients,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Erro ao obter clientes:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao obter lista de clientes'
            });
        }
    }

    /**
     * Obter status do bot
     */
    async getBotStatus(req, res) {
        try {
            const adminChatId = req.user?.telegramId;

            if (!adminChatId) {
                return res.status(401).json({
                    success: false,
                    message: 'Usuário não autorizado'
                });
            }

            // Enviar status via Telegram
            await multiStoreTelegramService.sendBotStatus(adminChatId);

            res.json({
                success: true,
                message: 'Status do bot enviado via Telegram'
            });

        } catch (error) {
            logger.error('Erro ao obter status do bot:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Testar conexão com Telegram
     */
    async testConnection(req, res) {
        try {
            const initialized = await multiStoreTelegramService.initialize();

            if (initialized) {
                res.json({
                    success: true,
                    message: 'Conexão com Telegram estabelecida com sucesso'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Erro ao conectar com Telegram'
                });
            }

        } catch (error) {
            logger.error('Erro ao testar conexão:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Criar campanha
     */
    async createCampaign(req, res) {
        try {
            const {
                name,
                description,
                type,
                content,
                scheduledDate,
                segmentation,
                settings
            } = req.body;

            if (!name || !content) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e conteúdo são obrigatórios'
                });
            }

            const campaign = await TelegramCampaign.create({
                name,
                description,
                type: type || 'broadcast',
                content,
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                segmentation: segmentation || {},
                settings: settings || {},
                createdBy: req.user.id,
                status: scheduledDate ? 'scheduled' : 'draft'
            });

            res.json({
                success: true,
                message: 'Campanha criada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao criar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar campanha'
            });
        }
    }

    /**
     * Listar campanhas
     */
    async getCampaigns(req, res) {
        try {
            const { page = 1, limit = 20, status = 'all' } = req.query;
            
            const filters = {};
            if (status !== 'all') {
                filters.status = status;
            }
            
            const campaigns = await TelegramCampaign.find(filters)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .populate('createdBy', 'name email')
                .lean();
            
            const total = await TelegramCampaign.countDocuments(filters);
            
            res.json({
                success: true,
                campaigns,
                total,
                page: parseInt(page),
                totalPages: Math.ceil(total / limit)
            });
        } catch (error) {
            console.error('Erro ao listar campanhas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao listar campanhas'
            });
        }
    }

    /**
     * Executar campanha
     */
    async executeCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            
            const campaign = await TelegramCampaign.findById(campaignId);
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }
            
            if (campaign.status === 'running') {
                return res.status(400).json({
                    success: false,
                    message: 'Campanha já está em execução'
                });
            }
            
            // Atualizar status para executando
            campaign.status = 'running';
            campaign.executedAt = new Date();
            await campaign.save();
            
            // Executar campanha em background
            this.executeCampaignInBackground(campaign);
            
            res.json({
                success: true,
                message: 'Campanha iniciada com sucesso'
            });
        } catch (error) {
            console.error('Erro ao executar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao executar campanha'
            });
        }
    }

    /**
     * Executar campanha em background
     */
    async executeCampaignInBackground(campaign) {
        try {
            await multiStoreTelegramService.initialize();
            
            // Buscar clientes baseado na segmentação
            const filters = this.buildSegmentationFilters(campaign.segmentation);
            const clients = await TelegramClient.find(filters).lean();
            
            let sent = 0;
            let failed = 0;
            
            for (const client of clients) {
                try {
                    await multiStoreTelegramService.sendMessage(client.telegramId, campaign.content.message);
                    sent++;
                    
                    // Salvar no histórico
                    await TelegramConversation.create({
                        telegramId: client.telegramId,
                        messageType: 'outgoing',
                        content: campaign.content.message,
                        messageData: {
                            type: 'campaign',
                            campaignId: campaign._id,
                            campaignName: campaign.name
                        },
                        status: 'sent',
                        isFromAdmin: true
                    });
                    
                    // Delay entre mensagens para evitar spam
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    failed++;
                    console.error(`Erro ao enviar para ${client.telegramId}:`, error);
                }
            }
            
            // Atualizar estatísticas da campanha
            await campaign.updateStats({ sent, failed, total: clients.length });
            campaign.status = 'completed';
            await campaign.save();
            
        } catch (error) {
            console.error('Erro na execução da campanha:', error);
            campaign.status = 'failed';
            await campaign.save();
        }
    }

    /**
     * Construir filtros de segmentação
     */
    buildSegmentationFilters(segmentation) {
        const filters = { isActive: true, isBlocked: false };
        
        if (segmentation.lastInteractionDays) {
            const date = new Date();
            date.setDate(date.getDate() - segmentation.lastInteractionDays);
            filters.lastInteraction = { $gte: date };
        }
        
        if (segmentation.hasInteracted !== undefined) {
            if (segmentation.hasInteracted) {
                filters.totalMessages = { $gt: 0 };
            } else {
                filters.totalMessages = { $eq: 0 };
            }
        }
        
        return filters;
    }

    /**
     * Adicionar cliente manualmente
     */
    async addClient(req, res) {
        try {
            const { 
                firstName, 
                lastName = '', 
                phoneNumber = '', 
                username = '', 
                notes = '',
                tags = [],
                acceptsPromotions = true 
            } = req.body;

            // Validações
            if (!firstName) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome é obrigatório'
                });
            }

            // Gerar um telegramId temporário se não fornecido
            // Será atualizado quando o cliente interagir via Telegram
            const telegramId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const clientData = {
                telegramId,
                firstName,
                lastName,
                phoneNumber,
                username,
                notes,
                tags: Array.isArray(tags) ? tags : [],
                acceptsPromotions,
                isActive: true,
                isBlocked: false
            };

            const client = await TelegramClient.create(clientData);

            logger.info('Cliente adicionado manualmente:', {
                clientId: client._id,
                name: `${firstName} ${lastName}`,
                phone: phoneNumber
            });

            res.status(201).json({
                success: true,
                message: 'Cliente adicionado com sucesso',
                client
            });
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Atualizar cliente
     */
    async updateClient(req, res) {
        try {
            const { clientId } = req.params;
            const updateData = req.body;

            // Remover campos que não devem ser atualizados diretamente
            delete updateData.telegramId;
            delete updateData._id;
            delete updateData.createdAt;
            delete updateData.updatedAt;

            const client = await TelegramClient.findByIdAndUpdate(
                clientId,
                updateData,
                { new: true, runValidators: true }
            );

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente não encontrado'
                });
            }

            logger.info('Cliente atualizado:', {
                clientId: client._id,
                name: `${client.firstName} ${client.lastName}`
            });

            res.json({
                success: true,
                message: 'Cliente atualizado com sucesso',
                client
            });
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Remover cliente
     */
    async removeClient(req, res) {
        try {
            const { clientId } = req.params;

            const client = await TelegramClient.findByIdAndDelete(clientId);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente não encontrado'
                });
            }

            // Remover conversas relacionadas
            await TelegramConversation.deleteMany({ clientId: client._id });

            logger.info('Cliente removido:', {
                clientId: client._id,
                name: `${client.firstName} ${client.lastName}`
            });

            res.json({
                success: true,
                message: 'Cliente removido com sucesso'
            });
        } catch (error) {
            console.error('Erro ao remover cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Obter cliente específico
     */
    async getClient(req, res) {
        try {
            const { clientId } = req.params;

            const client = await TelegramClient.findById(clientId);

            if (!client) {
                return res.status(404).json({
                    success: false,
                    message: 'Cliente não encontrado'
                });
            }

            // Buscar conversas recentes
            const conversations = await TelegramConversation.find({ clientId })
                .sort({ createdAt: -1 })
                .limit(10)
                .lean();

            res.json({
                success: true,
                client,
                conversations
            });
        } catch (error) {
            console.error('Erro ao obter cliente:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Criar campanha de disparo em massa
     */
    async createCampaign(req, res) {
        try {
            const { name, description, type, message, targetCriteria, scheduledDate } = req.body;

            if (!name || !message) {
                return res.status(400).json({
                    success: false,
                    message: 'Nome e mensagem são obrigatórios'
                });
            }

            const campaign = new TelegramCampaign({
                name,
                description,
                type: type || 'broadcast',
                message,
                targetCriteria: targetCriteria || { allActive: true },
                scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
                createdBy: req.user._id,
                status: scheduledDate ? 'scheduled' : 'draft'
            });

            await campaign.save();
            await campaign.addExecutionLog('created', 'Campanha criada');

            res.json({
                success: true,
                message: 'Campanha criada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao criar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Listar campanhas
     */
    async getCampaigns(req, res) {
        try {
            const { page = 1, limit = 20, status, type } = req.query;
            
            const query = { createdBy: req.user._id };
            if (status) query.status = status;
            if (type) query.type = type;

            const campaigns = await TelegramCampaign.find(query)
                .sort({ createdAt: -1 })
                .limit(limit * 1)
                .skip((page - 1) * limit)
                .lean();

            const total = await TelegramCampaign.countDocuments(query);

            res.json({
                success: true,
                campaigns,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        } catch (error) {
            console.error('Erro ao listar campanhas:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Executar campanha
     */
    async executeCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            if (campaign.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Sem permissão para executar esta campanha'
                });
            }

            if (campaign.status === 'sending' || campaign.status === 'completed') {
                return res.status(400).json({
                    success: false,
                    message: 'Campanha já está sendo executada ou foi concluída'
                });
            }

            // Atualizar status para enviando
            campaign.status = 'sending';
            campaign.executionStartedAt = new Date();
            await campaign.save();
            await campaign.addExecutionLog('started', 'Execução iniciada');

            // Processar envio em background
            setImmediate(() => this.processCampaignExecution(campaignId));

            res.json({
                success: true,
                message: 'Campanha iniciada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao executar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Processar execução da campanha em background
     */
    async processCampaignExecution(campaignId) {
        try {
            const campaign = await TelegramCampaign.findById(campaignId);
            if (!campaign) return;

            // Buscar clientes baseado nos critérios
            let clientsQuery = {};
            
            if (campaign.targetCriteria.allActive) {
                clientsQuery.isActive = true;
            }
            
            if (campaign.targetCriteria.inactiveDays) {
                const inactiveDate = new Date();
                inactiveDate.setDate(inactiveDate.getDate() - campaign.targetCriteria.inactiveDays);
                clientsQuery.lastInteraction = { $lt: inactiveDate };
            }

            const clients = await TelegramClient.find(clientsQuery);
            
            campaign.stats.totalTargets = clients.length;
            await campaign.save();

            // Enviar mensagens
            for (const client of clients) {
                try {
                    // Verificar se campanha ainda está ativa
                    const currentCampaign = await TelegramCampaign.findById(campaignId);
                    if (currentCampaign.status !== 'sending') {
                        break;
                    }

                    await multiStoreTelegramService.sendMessage(client.chatId, campaign.message);
                    
                    campaign.stats.sent += 1;
                    campaign.stats.delivered += 1;
                    
                    // Atualizar cliente
                    client.lastInteraction = new Date();
                    client.totalOrders += 1;
                    await client.save();
                    
                    await campaign.save();
                    
                    // Delay entre envios
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    
                } catch (error) {
                    console.error(`Erro ao enviar para cliente ${client.chatId}:`, error);
                    campaign.stats.failed += 1;
                    await campaign.save();
                }
            }

            // Finalizar campanha
            campaign.status = 'completed';
            campaign.executionCompletedAt = new Date();
            await campaign.save();
            await campaign.addExecutionLog('completed', `Campanha finalizada. Enviadas: ${campaign.stats.sent}, Falhas: ${campaign.stats.failed}`);

        } catch (error) {
            console.error('Erro no processamento da campanha:', error);
            
            // Marcar campanha como com erro
            const campaign = await TelegramCampaign.findById(campaignId);
            if (campaign) {
                campaign.status = 'error';
                await campaign.save();
                await campaign.addExecutionLog('error', `Erro na execução: ${error.message}`);
            }
        }
    }

    /**
     * Pausar campanha
     */
    async pauseCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            if (campaign.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Sem permissão para pausar esta campanha'
                });
            }

            if (campaign.status !== 'sending') {
                return res.status(400).json({
                    success: false,
                    message: 'Apenas campanhas em execução podem ser pausadas'
                });
            }

            campaign.status = 'paused';
            await campaign.save();
            await campaign.addExecutionLog('paused', 'Campanha pausada manualmente');

            res.json({
                success: true,
                message: 'Campanha pausada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao pausar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Cancelar campanha
     */
    async cancelCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            if (campaign.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Sem permissão para cancelar esta campanha'
                });
            }

            if (!['scheduled', 'sending', 'paused'].includes(campaign.status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Campanha não pode ser cancelada no status atual'
                });
            }

            campaign.status = 'cancelled';
            await campaign.save();
            await campaign.addExecutionLog('cancelled', 'Campanha cancelada manualmente');

            res.json({
                success: true,
                message: 'Campanha cancelada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao cancelar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }

    /**
     * Retomar campanha pausada
     */
    async resumeCampaign(req, res) {
        try {
            const { campaignId } = req.params;
            
            const campaign = await TelegramCampaign.findById(campaignId);
            
            if (!campaign) {
                return res.status(404).json({
                    success: false,
                    message: 'Campanha não encontrada'
                });
            }

            if (campaign.createdBy.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'Sem permissão para retomar esta campanha'
                });
            }

            if (campaign.status !== 'paused') {
                return res.status(400).json({
                    success: false,
                    message: 'Apenas campanhas pausadas podem ser retomadas'
                });
            }

            campaign.status = 'sending';
            await campaign.save();
            await campaign.addExecutionLog('resumed', 'Campanha retomada manualmente');

            // Processar envio em background
            setImmediate(() => this.processCampaignExecution(campaignId));

            res.json({
                success: true,
                message: 'Campanha retomada com sucesso',
                campaign
            });
        } catch (error) {
            console.error('Erro ao retomar campanha:', error);
            res.status(500).json({
                success: false,
                message: 'Erro interno do servidor',
                error: error.message
            });
        }
    }
    /**
     * Obter configuração global do bot (Super Admin)
     */
    async getBotConfig(req, res) {
        try {
            const settings = await SystemSettings.getInstance();
            
            const config = {
                token: settings.telegramBotToken ? settings.telegramBotToken.substring(0, 10) + '...' : '',
                webhookUrl: settings.telegramWebhookUrl || '',
                enabled: settings.telegramEnabled || false
            };
            
            res.json({ success: true, config });
        } catch (error) {
            logger.error('Erro ao obter configuração do bot:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    /**
     * Configurar bot global (Super Admin)
     */
    async setBotConfig(req, res) {
        try {
            const { token, webhookUrl, isActive } = req.body;
            
            if (!token || !token.trim()) {
                return res.status(400).json({ success: false, message: 'Token é obrigatório' });
            }
            
            const settings = await SystemSettings.getInstance();
            settings.telegramBotToken = token;
            settings.telegramWebhookUrl = webhookUrl || '';
            settings.telegramEnabled = isActive !== false;
            
            await settings.save();
            
            res.json({ success: true, message: 'Configuração salva com sucesso' });
        } catch (error) {
            logger.error('Erro ao salvar configuração do bot:', error);
            res.status(500).json({ success: false, message: 'Erro interno do servidor' });
        }
    }

    /**
     * Testar conexão do bot (Super Admin)
     */
    async testBot(req, res) {
        try {
            const { token } = req.body;
            
            if (!token) {
                return res.status(400).json({ success: false, message: 'Token é obrigatório' });
            }
            
            const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
            
            if (response.data.ok) {
                res.json({ 
                    success: true, 
                    botInfo: response.data.result,
                    message: 'Bot conectado com sucesso'
                });
            } else {
                res.status(400).json({ success: false, message: 'Token inválido' });
            }
        } catch (error) {
            logger.error('Erro ao testar bot:', error);
            res.status(400).json({ success: false, message: 'Erro ao conectar com o bot' });
        }
    }
}

const telegramController = new TelegramController();

export { TelegramController };
export default telegramController;