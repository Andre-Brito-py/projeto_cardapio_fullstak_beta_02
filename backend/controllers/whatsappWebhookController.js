import WhatsAppService from '../services/whatsappService.js';
// import { WhatsAppIntegrationService } from '../../ai-assistant/whatsapp_integration/index.js';
import lizaService from '../services/lizaIntegrationService.js';
import logger from '../utils/logger.js';

class WhatsAppWebhookController {
    constructor() {
        this.integrationServices = new Map(); // Cache de serviços por loja
    }

    /**
     * Verifica webhook do WhatsApp (GET)
     */
    async verifyWebhook(req, res) {
        try {
            const mode = req.query['hub.mode'];
            const token = req.query['hub.verify_token'];
            const challenge = req.query['hub.challenge'];

            // Verificar se é uma requisição de verificação
            if (mode && token) {
                // Verificar se o token está correto
                const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || 'liza_delivery_webhook';
                
                if (mode === 'subscribe' && token === expectedToken) {
                    logger.info('Webhook do WhatsApp verificado com sucesso');
                    res.status(200).send(challenge);
                } else {
                    logger.error('Token de verificação inválido');
                    res.sendStatus(403);
                }
            } else {
                logger.error('Parâmetros de verificação faltando');
                res.sendStatus(400);
            }
        } catch (error) {
            logger.error('Erro na verificação do webhook:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Recebe mensagens do WhatsApp (POST)
     */
    async receiveMessage(req, res) {
        try {
            const storeId = req.headers['x-store-id'] || req.body.storeId;
            
            if (!storeId) {
                return res.status(400).json({ 
                    error: 'Store ID é obrigatório' 
                });
            }

            // Responder imediatamente para o WhatsApp
            res.status(200).json({ received: true });

            // Processar mensagem de forma assíncrona
            this.processMessageAsync(req.body, storeId);

        } catch (error) {
            logger.error('Erro ao receber mensagem:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Processa mensagem de forma assíncrona
     */
    async processMessageAsync(webhookData, storeId) {
        try {
            logger.info('Processando mensagem assíncrona:', {
                storeId,
                hasEntry: !!webhookData.entry
            });

            const entry = webhookData.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages) {
                logger.info('Webhook sem mensagens, ignorando');
                return;
            }

            // Inicializar IA Liza se necessário
            if (!lizaService.isInitialized) {
                await lizaService.initialize();
            }

            // Obter ou criar serviço de integração para a loja
            const integrationService = await this.getIntegrationService(storeId);
            
            if (!integrationService) {
                logger.error(`Serviço de integração não disponível para loja ${storeId}`);
                return;
            }

            // Processar cada mensagem
            for (const message of value.messages) {
                try {
                    await this.processIndividualMessage(message, value, storeId, integrationService);
                } catch (error) {
                    logger.error('Erro ao processar mensagem individual:', error);
                }
            }

        } catch (error) {
            logger.error('Erro no processamento assíncrono:', error);
        }
    }

    /**
     * Processar mensagem individual
     */
    async processIndividualMessage(message, webhookValue, storeId, integrationService) {
        const messageId = message.id;
        const from = message.from;
        const messageType = message.type;

        logger.info('Processando mensagem:', {
            messageId,
            from,
            type: messageType,
            storeId
        });

        // Salvar mensagem no histórico
        await this.saveMessageHistory({
            messageId,
            from,
            storeId,
            type: messageType,
            content: message,
            timestamp: new Date(),
            direction: 'inbound'
        });

        // Marcar mensagem como lida
        try {
            await integrationService.markMessageAsRead(messageId);
        } catch (error) {
            logger.warn('Erro ao marcar mensagem como lida:', error);
        }

        // Processar com IA Liza primeiro
        let response;
        try {
            const lizaResponse = await lizaService.processMessage({
                message: this.extractMessageText(message),
                from,
                storeId,
                messageType,
                messageId
            });

            if (lizaResponse.success) {
                response = {
                    text: lizaResponse.response,
                    actions: lizaResponse.actions || []
                };
                
                // Log da classificação de intenção
                logger.info('IA Liza classificou mensagem:', {
                    intent: lizaResponse.intent,
                    confidence: lizaResponse.confidence,
                    from,
                    storeId
                });
            } else {
                // Fallback para processamento tradicional
                response = await this.processWithFallback(message, storeId, integrationService);
            }
        } catch (error) {
            logger.error('Erro na IA Liza, usando fallback:', error);
            response = await this.processWithFallback(message, storeId, integrationService);
        }

        // Enviar resposta se houver
        if (response) {
            await this.sendResponse(from, response, storeId, integrationService);
        }
    }

    /**
     * Extrair texto da mensagem baseado no tipo
     */
    extractMessageText(message) {
        switch (message.type) {
            case 'text':
                return message.text?.body || '';
            case 'interactive':
                return message.interactive?.button_reply?.title || 
                       message.interactive?.list_reply?.title || '';
            case 'image':
                return message.image?.caption || '[Imagem enviada]';
            case 'document':
                return message.document?.caption || '[Documento enviado]';
            case 'audio':
                return '[Áudio enviado]';
            default:
                return '[Mensagem não suportada]';
        }
    }

    /**
     * Processar com fallback tradicional
     */
    async processWithFallback(message, storeId, integrationService) {
        const messageType = message.type;
        
        switch (messageType) {
            case 'text':
                return await this.processTextMessage(message, storeId, integrationService);
            case 'interactive':
                return await this.processInteractiveMessage(message, storeId, integrationService);
            case 'image':
            case 'document':
            case 'audio':
                return await this.processMediaMessage(message, storeId, integrationService);
            default:
                return {
                    text: 'Desculpe, não consigo processar esse tipo de mensagem ainda. 😅'
                };
        }
    }

    /**
     * Processar mensagem de texto (fallback)
     */
    async processTextMessage(message, storeId, integrationService) {
        const text = message.text?.body;
        
        if (!text) {
            return null;
        }

        logger.info('Processando mensagem de texto (fallback):', { text, storeId });

        // Resposta simples de fallback
        return {
            text: `Olá! Recebemos sua mensagem. Nossa IA está sendo configurada. Em breve teremos respostas mais inteligentes! 🤖\n\nSua mensagem: "${text}"`
        };
    }

    /**
     * Processar mensagem interativa (fallback)
     */
    async processInteractiveMessage(message, storeId, integrationService) {
        logger.info('Processando mensagem interativa (fallback):', { storeId });
        
        return {
            text: 'Obrigada pela sua escolha! Nossa IA está sendo configurada para processar melhor suas seleções. 🤖'
        };
    }

    /**
     * Processar mensagem de mídia (fallback)
     */
    async processMediaMessage(message, storeId, integrationService) {
        logger.info('Processando mensagem de mídia (fallback):', { type: message.type, storeId });
        
        return {
            text: 'Recebemos sua mídia! Em breve nossa IA será capaz de processar imagens, documentos e áudios. 📎'
        };
    }

    /**
     * Enviar resposta para o cliente
     */
    async sendResponse(to, response, storeId, integrationService) {
        try {
            logger.info('Enviando resposta:', {
                to,
                storeId,
                responseType: typeof response,
                hasActions: !!(response.actions && response.actions.length > 0)
            });

            // Enviar mensagem de texto
            if (response.text) {
                await integrationService.sendTextMessage(to, response.text);
                
                // Salvar resposta no histórico
                await this.saveMessageHistory({
                    messageId: `response_${Date.now()}`,
                    from: 'system',
                    to,
                    storeId,
                    type: 'text',
                    content: { text: response.text },
                    timestamp: new Date(),
                    direction: 'outbound'
                });
            }

            // Processar ações adicionais se houver
            if (response.actions && response.actions.length > 0) {
                for (const action of response.actions) {
                    await this.processResponseAction(action, to, storeId, integrationService);
                }
            }

        } catch (error) {
            logger.error('Erro ao enviar resposta:', error);
        }
    }

    /**
     * Processar ações de resposta (botões, listas, etc.)
     */
    async processResponseAction(action, to, storeId, integrationService) {
        try {
            switch (action.type) {
                case 'quick_reply':
                    if (action.options && action.options.length > 0) {
                        // Enviar como botões interativos
                        const buttons = action.options.slice(0, 3).map((option, index) => ({
                            type: 'reply',
                            reply: {
                                id: `quick_${index}`,
                                title: option
                            }
                        }));
                        
                        await integrationService.sendInteractiveMessage(to, {
                            type: 'button',
                            body: { text: 'Escolha uma opção:' },
                            action: { buttons }
                        });
                    }
                    break;
                
                case 'product_selection':
                    if (action.products && action.products.length > 0) {
                        // Enviar lista de produtos
                        const rows = action.products.slice(0, 10).map((product, index) => ({
                            id: `product_${product.id || index}`,
                            title: product.name,
                            description: `R$ ${product.price.toFixed(2)}`
                        }));
                        
                        await integrationService.sendInteractiveMessage(to, {
                            type: 'list',
                            body: { text: 'Produtos encontrados:' },
                            action: {
                                button: 'Ver produtos',
                                sections: [{
                                    title: 'Produtos',
                                    rows
                                }]
                            }
                        });
                    }
                    break;
                
                case 'escalate_to_human':
                    // Notificar equipe sobre escalação
                    logger.info('Escalação para atendente humano:', {
                        customer: to,
                        storeId,
                        priority: action.priority,
                        reason: action.reason
                    });
                    
                    await integrationService.sendTextMessage(to, 
                        '👨‍💼 Um atendente será notificado e entrará em contato em breve. Obrigada pela paciência!');
                    break;
                
                case 'order_tracking':
                    // Implementar rastreamento de pedido
                    logger.info('Rastreamento de pedido solicitado:', {
                        orderId: action.orderId,
                        customer: to
                    });
                    break;
                
                default:
                    logger.warn(`Ação não suportada: ${action.type}`);
            }
        } catch (error) {
            logger.error('Erro ao processar ação:', error);
        }
    }

    /**
     * Obtém ou cria serviço de integração para uma loja
     */
    async getIntegrationService(storeId) {
        try {
            // Verificar se já existe no cache
            if (this.integrationServices.has(storeId)) {
                return this.integrationServices.get(storeId);
            }

            // Verificar se a loja tem WhatsApp configurado
            const Store = require('../models/Store');
            const store = await Store.findById(storeId);
            
            if (!store || !store.whatsappConfig || !store.whatsappConfig.enabled) {
                logger.warn(`Loja ${storeId} não tem WhatsApp configurado`);
                return null;
            }

            // Criar novo serviço de integração
            const { spawn } = require('child_process');
            const path = require('path');
            
            // Configurar variáveis de ambiente para o processo Python
            const env = {
                ...process.env,
                WHATSAPP_TOKEN: store.whatsappConfig.accessToken,
                WHATSAPP_PHONE_NUMBER_ID: store.whatsappConfig.phoneNumberId,
                STORE_ID: storeId,
                BACKEND_API_URL: process.env.BACKEND_URL || 'http://localhost:3000'
            };

            // Por enquanto, vamos usar uma abordagem simplificada
            // Em produção, você pode usar um processo Python separado ou uma API
            const integrationService = {
                process_webhook_message: async (data) => {
                    // Implementação simplificada que chama o serviço WhatsApp existente
                    const whatsappService = new WhatsAppService();
                    return await whatsappService.processIncomingMessage(data, storeId);
                }
            };

            // Adicionar ao cache
            this.integrationServices.set(storeId, integrationService);
            
            logger.info(`Serviço de integração criado para loja: ${storeId}`);
            return integrationService;

        } catch (error) {
            logger.error(`Erro ao criar serviço de integração para loja ${storeId}:`, error);
            return null;
        }
    }

    /**
     * Salva histórico da mensagem no banco
     */
    async saveMessageHistory(webhookData, storeId, processResult) {
        try {
            const WhatsAppMessage = require('../models/WhatsAppMessage');
            
            // Extrair dados da mensagem
            const entry = webhookData.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            const messages = value?.messages || [];

            for (const message of messages) {
                const messageData = {
                    storeId: storeId,
                    messageId: message.id,
                    from: message.from,
                    type: message.type,
                    content: this.extractMessageContent(message),
                    timestamp: new Date(parseInt(message.timestamp) * 1000),
                    processed: processResult.success || false,
                    processingError: processResult.error || null,
                    metadata: {
                        webhook_data: webhookData,
                        processing_result: processResult
                    }
                };

                await WhatsAppMessage.create(messageData);
            }

        } catch (error) {
            logger.error('Erro ao salvar histórico da mensagem:', error);
        }
    }

    /**
     * Extrai conteúdo da mensagem baseado no tipo
     */
    extractMessageContent(message) {
        switch (message.type) {
            case 'text':
                return message.text?.body || '';
            case 'image':
                return `[Imagem] ${message.image?.caption || ''}`;
            case 'document':
                return `[Documento] ${message.document?.filename || ''}`;
            case 'audio':
                return '[Áudio]';
            case 'video':
                return `[Vídeo] ${message.video?.caption || ''}`;
            case 'location':
                return `[Localização] ${message.location?.name || ''}`;
            case 'interactive':
                if (message.interactive?.type === 'button_reply') {
                    return `[Botão] ${message.interactive.button_reply.title}`;
                } else if (message.interactive?.type === 'list_reply') {
                    return `[Lista] ${message.interactive.list_reply.title}`;
                }
                return '[Interativo]';
            default:
                return `[${message.type}]`;
        }
    }

    /**
     * Envia mensagem proativa via WhatsApp
     */
    async sendProactiveMessage(req, res) {
        try {
            const { storeId, phoneNumber, message, messageType = 'text' } = req.body;

            if (!storeId || !phoneNumber || !message) {
                return res.status(400).json({
                    error: 'storeId, phoneNumber e message são obrigatórios'
                });
            }

            // Obter serviço de integração
            const integrationService = await this.getIntegrationService(storeId);
            
            if (!integrationService) {
                return res.status(400).json({
                    error: 'Loja não tem WhatsApp configurado'
                });
            }

            // Enviar mensagem
            const result = await integrationService.send_proactive_message(
                phoneNumber, 
                message, 
                messageType
            );

            if (result.success) {
                res.json({ success: true, result: result.result });
            } else {
                res.status(400).json({ error: result.error });
            }

        } catch (error) {
            logger.error('Erro ao enviar mensagem proativa:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Obtém status do serviço de integração
     */
    async getIntegrationStatus(req, res) {
        try {
            const storeId = req.params.storeId;
            
            if (!storeId) {
                return res.status(400).json({ error: 'Store ID é obrigatório' });
            }

            const integrationService = this.integrationServices.get(storeId);
            
            if (!integrationService) {
                return res.json({
                    initialized: false,
                    store_id: storeId,
                    message: 'Serviço não inicializado'
                });
            }

            // Se tiver método get_service_status, usar
            if (integrationService.get_service_status) {
                const status = integrationService.get_service_status();
                res.json(status);
            } else {
                res.json({
                    initialized: true,
                    store_id: storeId,
                    cached: true
                });
            }

        } catch (error) {
            logger.error('Erro ao obter status:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }

    /**
     * Limpa cache de serviços (útil para desenvolvimento)
     */
    async clearCache(req, res) {
        try {
            const storeId = req.params.storeId;
            
            if (storeId) {
                this.integrationServices.delete(storeId);
                res.json({ message: `Cache limpo para loja ${storeId}` });
            } else {
                this.integrationServices.clear();
                res.json({ message: 'Cache limpo para todas as lojas' });
            }

        } catch (error) {
            logger.error('Erro ao limpar cache:', error);
            res.status(500).json({ error: 'Erro interno do servidor' });
        }
    }
}

export default new WhatsAppWebhookController();