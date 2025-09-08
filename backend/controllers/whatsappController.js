import whatsappService from '../services/whatsappService.js';
import WhatsAppConfig from '../models/whatsappModel.js';
import WhatsAppMessage from '../models/whatsappMessageModel.js';
import mongoose from 'mongoose';

/**
 * Webhook para verificação do WhatsApp
 */
const verifyWebhook = async (req, res) => {
    try {
        const mode = req.query['hub.mode'];
        const token = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];
        const storeId = req.query.storeId || req.headers['x-store-id'];

        if (!storeId) {
            return res.status(400).json({ error: 'Store ID é obrigatório' });
        }

        const result = await whatsappService.verifyWebhook(mode, token, challenge, storeId);
        res.status(200).send(result);
    } catch (error) {
        console.error('Erro na verificação do webhook:', error);
        res.status(403).json({ error: error.message });
    }
};

/**
 * Webhook para receber mensagens do WhatsApp
 */
const receiveMessage = async (req, res) => {
    try {
        const storeId = req.query.storeId || req.headers['x-store-id'];
        
        if (!storeId) {
            return res.status(400).json({ error: 'Store ID é obrigatório' });
        }

        const result = await whatsappService.processIncomingMessage(req.body, storeId);
        
        if (result.success) {
            res.status(200).json({ message: 'Mensagem processada com sucesso' });
        } else {
            res.status(500).json({ error: result.error });
        }
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obter configuração do WhatsApp
 */
const getConfig = async (req, res) => {
    try {
        const storeId = req.storeId;
        const config = await whatsappService.getConfig(storeId);
        
        if (!config) {
            return res.status(404).json({ error: 'Configuração não encontrada' });
        }

        // Remover dados sensíveis da resposta
        const safeConfig = {
            ...config.toObject(),
            accessToken: config.accessToken ? '***' : null,
            webhookVerifyToken: config.webhookVerifyToken ? '***' : null
        };

        res.json(safeConfig);
    } catch (error) {
        console.error('Erro ao obter configuração:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Salvar configuração do WhatsApp
 */
const saveConfig = async (req, res) => {
    try {
        const storeId = req.storeId;
        const configData = req.body;

        // Validar dados obrigatórios
        if (configData.accessToken && !configData.phoneNumberId) {
            return res.status(400).json({ error: 'Phone Number ID é obrigatório quando Access Token é fornecido' });
        }

        const config = await whatsappService.saveConfig(storeId, configData);
        
        // Remover dados sensíveis da resposta
        const safeConfig = {
            ...config.toObject(),
            accessToken: config.accessToken ? '***' : null,
            webhookVerifyToken: config.webhookVerifyToken ? '***' : null
        };

        res.json({
            message: 'Configuração salva com sucesso',
            config: safeConfig
        });
    } catch (error) {
        console.error('Erro ao salvar configuração:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Enviar mensagem manual
 */
const sendMessage = async (req, res) => {
    try {
        const storeId = req.storeId;
        const { to, message, messageType = 'text' } = req.body;

        if (!to || !message) {
            return res.status(400).json({ error: 'Destinatário e mensagem são obrigatórios' });
        }

        const result = await whatsappService.sendMessage({
            storeId,
            to,
            message,
            messageType
        });

        res.json({
            message: 'Mensagem enviada com sucesso',
            messageId: result.messageId
        });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obter histórico de conversa
 */
const getConversationHistory = async (req, res) => {
    try {
        const storeId = req.storeId;
        const { customerPhone } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        if (!customerPhone) {
            return res.status(400).json({ error: 'Telefone do cliente é obrigatório' });
        }

        const history = await whatsappService.getConversationHistory(storeId, customerPhone, limit);
        
        res.json({
            customerPhone,
            messages: history.reverse(), // Ordem cronológica
            total: history.length
        });
    } catch (error) {
        console.error('Erro ao obter histórico:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Obter lista de conversas ativas
 */
const getActiveConversations = async (req, res) => {
    try {
        const storeId = new mongoose.Types.ObjectId(req.storeId);
        const limit = parseInt(req.query.limit) || 20;

        const conversations = await whatsappService.getActiveConversations(storeId, limit);
        
        res.json({
            conversations: conversations.map(conv => ({
                customerPhone: conv._id,
                customerName: conv.lastMessage.customerName,
                lastMessage: {
                    content: conv.lastMessage.content.text || '[Mídia]',
                    timestamp: conv.lastMessage.timestamp,
                    direction: conv.lastMessage.direction
                },
                messageCount: conv.messageCount,
                unreadCount: 0 // Implementar lógica de não lidas se necessário
            }))
        });
    } catch (error) {
        console.error('Erro ao obter conversas:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * Testar conexão com WhatsApp
 */
const testConnection = async (req, res) => {
    try {
        const storeId = req.storeId;
        const config = await whatsappService.getConfig(storeId);
        
        if (!config || !config.accessToken || !config.phoneNumberId) {
            return res.status(400).json({ 
                error: 'Configuração incompleta. Verifique Access Token e Phone Number ID' 
            });
        }

        // Tentar enviar uma mensagem de teste para o próprio número (se configurado)
        const testPhone = req.body.testPhone;
        
        if (!testPhone) {
            return res.status(400).json({ 
                error: 'Número de teste é obrigatório para verificar a conexão' 
            });
        }

        await whatsappService.sendMessage({
            storeId,
            to: testPhone,
            message: '🤖 Teste de conexão WhatsApp Business API - Conexão estabelecida com sucesso!'
        });

        // Atualizar status da conexão
        await WhatsAppConfig.findOneAndUpdate(
            { storeId },
            { 
                isConnected: true, 
                connectionStatus: 'connected',
                lastConnectionAt: new Date()
            }
        );

        res.json({ 
            message: 'Conexão testada com sucesso! Mensagem de teste enviada.',
            status: 'connected'
        });
    } catch (error) {
        console.error('Erro ao testar conexão:', error);
        
        // Atualizar status de erro
        await WhatsAppConfig.findOneAndUpdate(
            { storeId: req.storeId },
            { 
                isConnected: false, 
                connectionStatus: 'error'
            }
        );

        res.status(500).json({ 
            error: 'Falha na conexão: ' + error.message,
            status: 'error'
        });
    }
};

/**
 * Obter estatísticas das mensagens
 */
const getMessageStats = async (req, res) => {
    try {
        const storeId = new mongoose.Types.ObjectId(req.storeId);
        const { period = '7d' } = req.query;
        
        let startDate = new Date();
        switch (period) {
            case '1d':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 7);
        }

        const stats = await WhatsAppMessage.aggregate([
            {
                $match: {
                    storeId: storeId,
                    timestamp: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalMessages: { $sum: 1 },
                    inboundMessages: {
                        $sum: { $cond: [{ $eq: ['$direction', 'inbound'] }, 1, 0] }
                    },
                    outboundMessages: {
                        $sum: { $cond: [{ $eq: ['$direction', 'outbound'] }, 1, 0] }
                    },
                    processedByLisa: {
                        $sum: { $cond: ['$processedByLisa', 1, 0] }
                    },
                    uniqueCustomers: { $addToSet: '$customerPhone' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalMessages: 1,
                    inboundMessages: 1,
                    outboundMessages: 1,
                    processedByLisa: 1,
                    uniqueCustomers: { $size: '$uniqueCustomers' }
                }
            }
        ]);

        const result = stats[0] || {
            totalMessages: 0,
            inboundMessages: 0,
            outboundMessages: 0,
            processedByLisa: 0,
            uniqueCustomers: 0
        };

        res.json({
            period,
            stats: result
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        res.status(500).json({ error: error.message });
    }
};

export {
    verifyWebhook,
    receiveMessage,
    getConfig,
    saveConfig,
    sendMessage,
    getConversationHistory,
    getActiveConversations,
    testConnection,
    getMessageStats
};