import axios from 'axios';
import crypto from 'crypto';
import WhatsAppConfig from '../models/whatsappModel.js';
import WhatsAppMessage from '../models/whatsappMessageModel.js';
import lisaService from './lisaService.js';

class WhatsAppService {
    constructor() {
        this.baseURL = 'https://graph.facebook.com/v18.0';
    }

    /**
     * Verificar webhook do WhatsApp
     */
    verifyWebhook(mode, token, challenge, storeId) {
        return new Promise(async (resolve, reject) => {
            try {
                const config = await WhatsAppConfig.findOne({ storeId });
                
                if (!config || !config.webhookVerifyToken) {
                    return reject(new Error('Configuração do WhatsApp não encontrada'));
                }

                if (mode === 'subscribe' && token === config.webhookVerifyToken) {
                    console.log('Webhook verificado com sucesso');
                    resolve(challenge);
                } else {
                    reject(new Error('Token de verificação inválido'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Processar mensagem recebida do webhook
     */
    async processIncomingMessage(webhookData, storeId) {
        try {
            const entry = webhookData.entry?.[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;

            if (!value?.messages) {
                return { success: true, message: 'Nenhuma mensagem para processar' };
            }

            const message = value.messages[0];
            const contact = value.contacts?.[0];
            
            // Salvar mensagem no banco
            const savedMessage = await this.saveIncomingMessage({
                storeId,
                messageId: message.id,
                customerPhone: message.from,
                customerName: contact?.profile?.name || 'Cliente',
                messageType: message.type,
                content: this.extractMessageContent(message),
                timestamp: new Date(parseInt(message.timestamp) * 1000),
                webhookData
            });

            // Processar com Lisa AI se habilitado
            const config = await WhatsAppConfig.findOne({ storeId });
            if (config?.lisaEnabled && config?.autoReply) {
                await this.processWithLisa(savedMessage, config);
            }

            return { success: true, message: 'Mensagem processada com sucesso' };
        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Extrair conteúdo da mensagem baseado no tipo
     */
    extractMessageContent(message) {
        const content = {};

        switch (message.type) {
            case 'text':
                content.text = message.text?.body;
                break;
            case 'image':
            case 'audio':
            case 'video':
            case 'document':
                content.mediaUrl = message[message.type]?.id;
                content.mediaType = message[message.type]?.mime_type;
                content.caption = message[message.type]?.caption;
                break;
            case 'location':
                content.location = {
                    latitude: message.location?.latitude,
                    longitude: message.location?.longitude,
                    address: message.location?.address
                };
                break;
            case 'interactive':
                if (message.interactive?.type === 'button_reply') {
                    content.text = message.interactive.button_reply.title;
                } else if (message.interactive?.type === 'list_reply') {
                    content.text = message.interactive.list_reply.title;
                }
                break;
        }

        return content;
    }

    /**
     * Salvar mensagem recebida no banco
     */
    async saveIncomingMessage(messageData) {
        const conversationId = `${messageData.storeId}_${messageData.customerPhone}`;
        
        const message = new WhatsAppMessage({
            ...messageData,
            conversationId,
            direction: 'inbound'
        });

        return await message.save();
    }

    /**
     * Processar mensagem com Lisa AI
     */
    async processWithLisa(message, config) {
        try {
            const startTime = Date.now();
            
            // Verificar horário de funcionamento
            if (config.businessHours?.enabled && !this.isWithinBusinessHours(config.businessHours)) {
                await this.sendMessage({
                    storeId: message.storeId,
                    to: message.customerPhone,
                    message: config.businessHours.outsideHoursMessage
                });
                return;
            }

            // Obter contexto da conversa (últimas 10 mensagens)
            const conversationHistory = await WhatsAppMessage
                .find({ conversationId: message.conversationId })
                .sort({ timestamp: -1 })
                .limit(10)
                .lean();

            // Preparar contexto para a Lisa
            const context = this.prepareContextForLisa(message, conversationHistory, config);
            
            // Aqui você integraria com a Lisa AI
            // Por enquanto, vamos simular uma resposta
            const lisaResponse = await this.getLisaResponse(context);
            
            const processingTime = Date.now() - startTime;

            // Atualizar mensagem com resposta da Lisa
            await WhatsAppMessage.findByIdAndUpdate(message._id, {
                processedByLisa: true,
                lisaResponse,
                lisaProcessingTime: processingTime
            });

            // Enviar resposta
            if (lisaResponse) {
                await this.sendMessage({
                    storeId: message.storeId,
                    to: message.customerPhone,
                    message: lisaResponse
                });
            }

        } catch (error) {
            console.error('Erro ao processar com Lisa:', error);
        }
    }

    /**
     * Preparar contexto para a Lisa AI
     */
    prepareContextForLisa(currentMessage, conversationHistory, config) {
        return {
            currentMessage: currentMessage.content.text || 'Mensagem não textual',
            customerPhone: currentMessage.customerPhone,
            customerName: currentMessage.customerName,
            conversationHistory: conversationHistory.map(msg => ({
                direction: msg.direction,
                content: msg.content.text || '[Mídia]',
                timestamp: msg.timestamp
            })),
            storeId: currentMessage.storeId,
            welcomeMessage: config.welcomeMessage
        };
    }

    /**
     * Obter resposta da Lisa AI
     */
    async getLisaResponse(context) {
        try {
            // Usar o serviço da Lisa AI integrado
            return await lisaService.processWhatsAppMessage(context);
        } catch (error) {
            console.error('Erro ao obter resposta da Lisa:', error);
            
            // Fallback para resposta padrão
            if (context.conversationHistory.length === 0) {
                return context.welcomeMessage;
            }
            
            return 'Obrigado pela mensagem! Em breve retornaremos seu contato.';
        }
    }

    /**
     * Verificar se está dentro do horário de funcionamento
     */
    isWithinBusinessHours(businessHours) {
        const now = new Date();
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const currentTime = now.toTimeString().slice(0, 5); // HH:MM
        
        const daySchedule = businessHours.schedule[dayOfWeek];
        
        if (!daySchedule?.active) {
            return false;
        }
        
        return currentTime >= daySchedule.start && currentTime <= daySchedule.end;
    }

    /**
     * Enviar mensagem via WhatsApp Business API
     */
    async sendMessage({ storeId, to, message, messageType = 'text' }) {
        try {
            const config = await WhatsAppConfig.findOne({ storeId });
            
            if (!config || !config.accessToken || !config.phoneNumberId) {
                throw new Error('Configuração do WhatsApp não encontrada ou incompleta');
            }

            const url = `${this.baseURL}/${config.phoneNumberId}/messages`;
            
            const payload = {
                messaging_product: 'whatsapp',
                to: to,
                type: messageType,
                text: {
                    body: message
                }
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'Authorization': `Bearer ${config.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            // Salvar mensagem enviada
            await this.saveOutgoingMessage({
                storeId,
                messageId: response.data.messages[0].id,
                customerPhone: to,
                content: { text: message },
                messageType
            });

            return { success: true, messageId: response.data.messages[0].id };
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            throw error;
        }
    }

    /**
     * Salvar mensagem enviada no banco
     */
    async saveOutgoingMessage(messageData) {
        const conversationId = `${messageData.storeId}_${messageData.customerPhone}`;
        
        const message = new WhatsAppMessage({
            ...messageData,
            conversationId,
            direction: 'outbound',
            timestamp: new Date()
        });

        return await message.save();
    }

    /**
     * Obter configuração do WhatsApp para uma loja
     */
    async getConfig(storeId) {
        return await WhatsAppConfig.findOne({ storeId });
    }

    /**
     * Salvar/Atualizar configuração do WhatsApp
     */
    async saveConfig(storeId, configData) {
        return await WhatsAppConfig.findOneAndUpdate(
            { storeId },
            { ...configData, storeId },
            { upsert: true, new: true }
        );
    }

    /**
     * Obter histórico de conversas
     */
    async getConversationHistory(storeId, customerPhone, limit = 50) {
        const conversationId = `${storeId}_${customerPhone}`;
        
        return await WhatsAppMessage
            .find({ conversationId })
            .sort({ timestamp: -1 })
            .limit(limit)
            .lean();
    }

    /**
     * Obter lista de conversas ativas
     */
    async getActiveConversations(storeId, limit = 20) {
        return await WhatsAppMessage.aggregate([
            { $match: { storeId: storeId } },
            { $sort: { timestamp: -1 } },
            {
                $group: {
                    _id: '$customerPhone',
                    lastMessage: { $first: '$$ROOT' },
                    messageCount: { $sum: 1 }
                }
            },
            { $sort: { 'lastMessage.timestamp': -1 } },
            { $limit: limit }
        ]);
    }
}

// Instância singleton
const whatsappService = new WhatsAppService();

export default whatsappService;