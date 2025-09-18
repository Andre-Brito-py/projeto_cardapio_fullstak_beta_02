import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { validateStoreActive } from '../middleware/storeContext.js';
import Customer from '../models/customerModel.js';
import TelegramClient from '../models/telegramClientModel.js';
import TelegramConversation from '../models/telegramConversationModel.js';
import SystemSettings from '../models/systemSettingsModel.js';
import axios from 'axios';

const router = express.Router();

/**
 * Middleware para validar configuração do Telegram
 */
const validateTelegramConfig = async (req, res, next) => {
    try {
        const settings = await SystemSettings.getInstance();
        
        if (!settings.telegramEnabled) {
            return res.status(400).json({
                success: false,
                message: 'Telegram não está habilitado no sistema'
            });
        }
        
        if (!settings.telegramBotToken) {
            return res.status(400).json({
                success: false,
                message: 'Token do bot Telegram não configurado'
            });
        }
        
        req.telegramSettings = settings;
        next();
    } catch (error) {
        console.error('Erro ao validar configuração Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Função auxiliar para enviar mensagem via API do Telegram
 */
const sendTelegramMessage = async (botToken, chatId, text, parseMode = 'HTML') => {
    try {
        const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
        const response = await axios.post(url, {
            chat_id: chatId,
            text: text,
            parse_mode: parseMode,
            disable_web_page_preview: true
        });
        
        return response.data.ok;
    } catch (error) {
        console.error('Erro ao enviar mensagem Telegram:', error);
        return false;
    }
};

/**
 * Função para formatar templates de mensagem
 */
const formatMessageTemplate = (template, data) => {
    let formatted = template;
    
    Object.keys(data).forEach(key => {
        const regex = new RegExp(`{${key}}`, 'g');
        formatted = formatted.replace(regex, data[key] || '');
    });
    
    return formatted;
};

/**
 * Templates de mensagens padrão
 */
const messageTemplates = {
    welcome: `🤖 <b>Olá {name}!</b>

Eu sou a <b>Liza</b>, sua assistente virtual de delivery! 🍕

Estou aqui para tornar seus pedidos mais fáceis e rápidos.

<b>🎯 O que posso fazer por você:</b>
• 📋 Receber seus pedidos
• 🍽️ Mostrar nosso cardápio
• 💰 Informar preços e promoções
• 📦 Acompanhar status do pedido
• ❓ Responder suas dúvidas

Digite sua mensagem ou use os botões abaixo! 👇`,

    order_update: `📦 <b>Atualização do seu pedido #{order_id}</b>

👋 Olá {name}!

🔄 <b>Status:</b> {status}
⏰ <b>Tempo estimado:</b> {estimated_time}

{additional_info}

Qualquer dúvida, estou aqui para ajudar! 😊`,

    promotion: `🎉 <b>Promoção Especial para Você!</b>

👋 Olá {name}!

{promotion_content}

⏰ <b>Válido até:</b> {valid_until}

Não perca essa oportunidade! Faça já seu pedido! 🚀`,

    feedback_request: `⭐ <b>Como foi sua experiência?</b>

👋 Olá {name}!

Esperamos que tenha gostado do seu pedido! 😊

Sua opinião é muito importante para nós. Que tal nos contar como foi?

<b>🌟 Avalie nosso atendimento:</b>
• Qualidade dos produtos
• Tempo de entrega
• Atendimento

Sua avaliação nos ajuda a melhorar sempre! 💪`
};

/**
 * POST /api/liza/telegram/send-message
 * Enviar mensagem individual via Telegram
 */
router.post('/send-message', authMiddleware, validateStoreActive, validateTelegramConfig, async (req, res) => {
    try {
        const { customerPhone, messageText, messageType = 'custom', templateData = {} } = req.body;
        const storeId = req.headers['x-store-id'];
        
        if (!customerPhone || !messageText) {
            return res.status(400).json({
                success: false,
                message: 'Telefone do cliente e texto da mensagem são obrigatórios'
            });
        }
        
        // Buscar cliente
        const customer = await Customer.findOne({
            phone: customerPhone,
            storeId: storeId,
            isActive: true
        });
        
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }
        
        // Verificar se cliente tem Telegram configurado
        if (!customer.telegramChatId && !customer.telegramUsername) {
            return res.status(400).json({
                success: false,
                message: 'Cliente não possui Telegram configurado'
            });
        }
        
        // Verificar se permite contato via Telegram
        if (!customer.allowTelegramContact) {
            return res.status(400).json({
                success: false,
                message: 'Cliente não permite contato via Telegram'
            });
        }
        
        // Preparar mensagem
        let finalMessage = messageText;
        
        if (messageType !== 'custom' && messageTemplates[messageType]) {
            const template = messageTemplates[messageType];
            const data = {
                name: customer.name,
                ...templateData
            };
            finalMessage = formatMessageTemplate(template, data);
        }
        
        // Determinar chat ID
        const chatId = customer.telegramChatId || `@${customer.telegramUsername}`;
        
        // Enviar mensagem
        const success = await sendTelegramMessage(
            req.telegramSettings.telegramBotToken,
            chatId,
            finalMessage
        );
        
        if (success) {
            // Registrar conversa
            await TelegramConversation.create({
                chatId: customer.telegramChatId,
                customerId: customer._id,
                storeId: storeId,
                messageText: finalMessage,
                messageType: 'outgoing',
                isFromBot: true,
                metadata: {
                    messageType: messageType,
                    templateData: templateData
                }
            });
            
            res.json({
                success: true,
                message: 'Mensagem enviada com sucesso',
                data: {
                    customerName: customer.name,
                    customerPhone: customerPhone,
                    messageType: messageType,
                    sentAt: new Date()
                }
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Falha ao enviar mensagem via Telegram'
            });
        }
        
    } catch (error) {
        console.error('Erro ao enviar mensagem Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /api/liza/telegram/send-bulk
 * Enviar mensagens em massa via Telegram
 */
router.post('/send-bulk', authMiddleware, validateStoreActive, validateTelegramConfig, async (req, res) => {
    try {
        const { 
            messageText, 
            customerSegment = 'all', 
            messageType = 'custom', 
            templateData = {},
            maxRecipients = 100 
        } = req.body;
        const storeId = req.headers['x-store-id'];
        
        if (!messageText) {
            return res.status(400).json({
                success: false,
                message: 'Texto da mensagem é obrigatório'
            });
        }
        
        // Construir filtro de clientes
        let customerFilter = {
            storeId: storeId,
            isActive: true,
            allowTelegramContact: true,
            $or: [
                { telegramChatId: { $exists: true, $ne: null } },
                { telegramUsername: { $exists: true, $ne: null } }
            ]
        };
        
        // Aplicar segmentação
        if (customerSegment !== 'all') {
            customerFilter.customerSegment = customerSegment;
        }
        
        // Buscar clientes
        const customers = await Customer.find(customerFilter)
            .limit(maxRecipients)
            .select('name phone telegramChatId telegramUsername');
        
        if (customers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Nenhum cliente contactável via Telegram encontrado'
            });
        }
        
        // Preparar template se necessário
        let messageTemplate = messageText;
        if (messageType !== 'custom' && messageTemplates[messageType]) {
            messageTemplate = messageTemplates[messageType];
        }
        
        // Enviar mensagens
        let sentCount = 0;
        let failedCount = 0;
        const errors = [];
        
        for (const customer of customers) {
            try {
                // Aplicar rate limiting (100ms entre mensagens)
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Preparar mensagem personalizada
                const data = {
                    name: customer.name,
                    ...templateData
                };
                
                const finalMessage = messageType !== 'custom' 
                    ? formatMessageTemplate(messageTemplate, data)
                    : messageText;
                
                // Determinar chat ID
                const chatId = customer.telegramChatId || `@${customer.telegramUsername}`;
                
                // Enviar mensagem
                const success = await sendTelegramMessage(
                    req.telegramSettings.telegramBotToken,
                    chatId,
                    finalMessage
                );
                
                if (success) {
                    sentCount++;
                    
                    // Registrar conversa
                    await TelegramConversation.create({
                        chatId: customer.telegramChatId,
                        customerId: customer._id,
                        storeId: storeId,
                        messageText: finalMessage,
                        messageType: 'outgoing',
                        isFromBot: true,
                        metadata: {
                            messageType: messageType,
                            templateData: templateData,
                            bulkCampaign: true
                        }
                    });
                } else {
                    failedCount++;
                    errors.push(`Falha ao enviar para ${customer.name} (${customer.phone})`);
                }
                
            } catch (error) {
                failedCount++;
                const errorMsg = `Erro ao processar ${customer.name} (${customer.phone}): ${error.message}`;
                errors.push(errorMsg);
                console.error(errorMsg);
            }
        }
        
        res.json({
            success: true,
            message: `Envio concluído: ${sentCount} enviadas, ${failedCount} falharam`,
            data: {
                totalCustomers: customers.length,
                sent: sentCount,
                failed: failedCount,
                errors: errors.slice(0, 10), // Limitar erros no retorno
                messageType: messageType,
                customerSegment: customerSegment,
                sentAt: new Date()
            }
        });
        
    } catch (error) {
        console.error('Erro no envio em massa Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /api/liza/telegram/order-notification
 * Enviar notificação de pedido via Telegram
 */
router.post('/order-notification', authMiddleware, validateStoreActive, validateTelegramConfig, async (req, res) => {
    try {
        const { customerPhone, orderData } = req.body;
        const storeId = req.headers['x-store-id'];
        
        if (!customerPhone || !orderData) {
            return res.status(400).json({
                success: false,
                message: 'Telefone do cliente e dados do pedido são obrigatórios'
            });
        }
        
        const templateData = {
            order_id: orderData.id || 'N/A',
            status: orderData.status || 'Confirmado',
            estimated_time: orderData.estimatedTime || '30-45 minutos',
            additional_info: orderData.additionalInfo || 'Seu pedido está sendo preparado com carinho!'
        };
        
        // Reutilizar lógica de envio de mensagem
        req.body = {
            customerPhone,
            messageText: '', // Será usado o template
            messageType: 'order_update',
            templateData
        };
        
        // Chamar o handler de envio de mensagem
        return router.stack.find(layer => layer.route?.path === '/send-message')
            .route.stack.find(layer => layer.method === 'post')
            .handle(req, res);
        
    } catch (error) {
        console.error('Erro ao enviar notificação de pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /api/liza/telegram/bot-info
 * Obter informações do bot Telegram
 */
router.get('/bot-info', authMiddleware, validateTelegramConfig, async (req, res) => {
    try {
        const url = `https://api.telegram.org/bot${req.telegramSettings.telegramBotToken}/getMe`;
        const response = await axios.get(url);
        
        if (response.data.ok) {
            res.json({
                success: true,
                data: response.data.result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Erro ao obter informações do bot'
            });
        }
        
    } catch (error) {
        console.error('Erro ao obter informações do bot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /api/liza/telegram/stats
 * Obter estatísticas do Telegram
 */
router.get('/stats', authMiddleware, validateStoreActive, async (req, res) => {
    try {
        const storeId = req.headers['x-store-id'];
        
        // Contar clientes por método de contato
        const totalCustomers = await Customer.countDocuments({
            storeId: storeId,
            isActive: true
        });
        
        const telegramCustomers = await Customer.countDocuments({
            storeId: storeId,
            isActive: true,
            allowTelegramContact: true,
            $or: [
                { telegramChatId: { $exists: true, $ne: null } },
                { telegramUsername: { $exists: true, $ne: null } }
            ]
        });
        
        // Contar mensagens enviadas hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const messagestoday = await TelegramConversation.countDocuments({
            storeId: storeId,
            messageType: 'outgoing',
            isFromBot: true,
            createdAt: { $gte: today }
        });
        
        // Contar conversas ativas (últimos 7 dias)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const activeConversations = await TelegramConversation.distinct('customerId', {
            storeId: storeId,
            createdAt: { $gte: weekAgo }
        });
        
        res.json({
            success: true,
            data: {
                totalCustomers,
                telegramCustomers,
                messagesToday: messagestoday,
                activeConversations: activeConversations.length,
                telegramEnabled: req.telegramSettings?.telegramEnabled || false,
                botConfigured: !!req.telegramSettings?.telegramBotToken
            }
        });
        
    } catch (error) {
        console.error('Erro ao obter estatísticas Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /api/liza/telegram/templates
 * Obter templates de mensagem disponíveis
 */
router.get('/templates', authMiddleware, (req, res) => {
    try {
        const templates = Object.keys(messageTemplates).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' '),
            template: messageTemplates[key],
            variables: (messageTemplates[key].match(/{[^}]+}/g) || [])
                .map(v => v.replace(/[{}]/g, ''))
        }));
        
        res.json({
            success: true,
            data: templates
        });
        
    } catch (error) {
        console.error('Erro ao obter templates:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

export default router;