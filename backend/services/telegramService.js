/**
 * Serviço de Integração com Telegram Bot
 * 
 * Este serviço gerencia a comunicação com a API do Telegram,
 * incluindo envio de cardápios, mensagens promocionais e
 * integração com o sistema de contatos.
 * 
 * Autor: Sistema IA Liza
 * Data: Janeiro 2025
 */

import fetch from 'node-fetch';
import logger from '../utils/logger.js';
import SystemSettings from '../models/systemSettingsModel.js';
import Store from '../models/storeModel.js';
import foodModel from '../models/foodModel.js';
import categoryModel from '../models/categoryModel.js';
import customerModel from '../models/customerModel.js';

class TelegramService {
    constructor() {
        this.botToken = null;
        this.adminChatId = null;
        this.allowedUsers = [];
        this.webhookUrl = null;
        this.isInitialized = false;
    }

    /**
     * Inicializar serviço com configurações do sistema
     */
    async initialize() {
        try {
            const settings = await SystemSettings.getInstance();
            
            if (!settings.telegramEnabled) {
                logger.info('Telegram Bot está desabilitado');
                return false;
            }

            this.botToken = settings.telegramBotToken;
            this.adminChatId = settings.telegramAdminChatId;
            this.webhookUrl = settings.telegramWebhookUrl;
            
            // Parse allowed users (comma separated)
            if (settings.telegramAllowedUsers) {
                this.allowedUsers = settings.telegramAllowedUsers
                    .split(',')
                    .map(id => id.trim())
                    .filter(id => id);
            }

            if (!this.botToken) {
                throw new Error('Token do bot Telegram não configurado');
            }

            this.isInitialized = true;
            logger.info('Telegram Service inicializado com sucesso');
            return true;

        } catch (error) {
            logger.error('Erro ao inicializar Telegram Service:', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Verificar se o usuário tem permissão
     */
    isUserAllowed(chatId) {
        if (!this.allowedUsers.length) {
            return true; // Se não há restrições, permite todos
        }
        return this.allowedUsers.includes(chatId.toString());
    }

    /**
     * Enviar mensagem via Telegram
     */
    async sendMessage(chatId, text, options = {}) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (!this.botToken) {
                throw new Error('Bot não configurado');
            }

            const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
            const payload = {
                chat_id: chatId,
                text: text,
                parse_mode: options.parseMode || 'HTML',
                disable_web_page_preview: options.disablePreview || false,
                reply_markup: options.replyMarkup || null
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (!result.ok) {
                throw new Error(`Telegram API Error: ${result.description}`);
            }

            logger.info(`Mensagem enviada via Telegram para ${chatId}`);
            return result;

        } catch (error) {
            logger.error('Erro ao enviar mensagem via Telegram:', error);
            throw error;
        }
    }

    /**
     * Gerar cardápio formatado para Telegram
     */
    async generateMenuMessage(storeId) {
        try {
            const store = await Store.findById(storeId).populate('owner');
            if (!store) {
                throw new Error('Loja não encontrada');
            }

            // Buscar categorias e produtos
            const categories = await categoryModel.find({ store: storeId, isActive: true })
                .sort({ order: 1, name: 1 });

            let menuText = `🍽️ <b>${store.name}</b>\n`;
            menuText += `📍 ${store.address}\n`;
            
            if (store.phone) {
                menuText += `📞 ${store.phone}\n`;
            }
            
            menuText += `\n🔗 <b>Link do Cardápio:</b>\n`;
            menuText += `${store.customUrl || `https://seu-dominio.com/${store.slug}`}\n\n`;

            // Adicionar categorias e produtos
            for (const category of categories) {
                const products = await foodModel.find({ 
                    category: category._id, 
                    isActive: true 
                }).sort({ order: 1, name: 1 }).limit(5); // Limitar para não ficar muito longo

                if (products.length > 0) {
                    menuText += `🏷️ <b>${category.name}</b>\n`;
                    
                    for (const product of products) {
                        menuText += `• ${product.name}`;
                        if (product.price) {
                            menuText += ` - R$ ${product.price.toFixed(2)}`;
                        }
                        menuText += `\n`;
                    }
                    menuText += `\n`;
                }
            }

            menuText += `🛒 <b>Para fazer seu pedido, acesse o link acima!</b>\n`;
            menuText += `\n💬 <i>Mensagem enviada pelo Bot Liza</i>`;

            return menuText;

        } catch (error) {
            logger.error('Erro ao gerar cardápio para Telegram:', error);
            throw error;
        }
    }

    /**
     * Enviar cardápio para lista de contatos
     */
    async sendMenuToContacts(storeId, contactIds = null) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const store = await Store.findById(storeId);
            if (!store) {
                throw new Error('Loja não encontrada');
            }

            // Buscar contatos
            let query = { store: storeId, isActive: true };
            if (contactIds && contactIds.length > 0) {
                query._id = { $in: contactIds };
            }

            const contacts = await customerModel.find(query);
            
            if (contacts.length === 0) {
                return {
                    success: false,
                    message: 'Nenhum contato encontrado para envio'
                };
            }

            // Gerar mensagem do cardápio
            const menuMessage = await this.generateMenuMessage(storeId);

            const results = {
                total: contacts.length,
                sent: 0,
                failed: 0,
                errors: []
            };

            // Enviar para cada contato que tem Telegram
            for (const contact of contacts) {
                if (contact.telegramId) {
                    try {
                        // Verificar se o usuário tem permissão
                        if (!this.isUserAllowed(contact.telegramId)) {
                            logger.warn(`Usuário ${contact.telegramId} não tem permissão para receber mensagens`);
                            results.failed++;
                            results.errors.push({
                                contact: contact.name,
                                error: 'Usuário não autorizado'
                            });
                            continue;
                        }

                        await this.sendMessage(contact.telegramId, menuMessage);
                        results.sent++;
                        
                        // Delay entre envios para evitar rate limiting
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (error) {
                        logger.error(`Erro ao enviar cardápio para ${contact.name}:`, error);
                        results.failed++;
                        results.errors.push({
                            contact: contact.name,
                            error: error.message
                        });
                    }
                } else {
                    logger.warn(`Contato ${contact.name} não possui Telegram ID`);
                    results.failed++;
                    results.errors.push({
                        contact: contact.name,
                        error: 'Telegram ID não configurado'
                    });
                }
            }

            // Enviar relatório para admin se configurado
            if (this.adminChatId && results.sent > 0) {
                const reportMessage = `📊 <b>Relatório de Envio - ${store.name}</b>\n\n` +
                    `✅ Enviados: ${results.sent}\n` +
                    `❌ Falhas: ${results.failed}\n` +
                    `📱 Total de contatos: ${results.total}\n\n` +
                    `🕐 ${new Date().toLocaleString('pt-BR')}`;
                
                try {
                    await this.sendMessage(this.adminChatId, reportMessage);
                } catch (error) {
                    logger.error('Erro ao enviar relatório para admin:', error);
                }
            }

            return {
                success: true,
                results
            };

        } catch (error) {
            logger.error('Erro ao enviar cardápio via Telegram:', error);
            throw error;
        }
    }

    /**
     * Enviar mensagem promocional
     */
    async sendPromotionalMessage(storeId, message, contactIds = null) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const store = await Store.findById(storeId);
            if (!store) {
                throw new Error('Loja não encontrada');
            }

            // Buscar contatos
            let query = { store: storeId, isActive: true };
            if (contactIds && contactIds.length > 0) {
                query._id = { $in: contactIds };
            }

            const contacts = await customerModel.find(query);
            
            if (contacts.length === 0) {
                return {
                    success: false,
                    message: 'Nenhum contato encontrado para envio'
                };
            }

            // Formatar mensagem promocional
            const promotionalMessage = `🎉 <b>${store.name}</b>\n\n${message}\n\n` +
                `🔗 Faça seu pedido: ${store.customUrl || `https://seu-dominio.com/${store.slug}`}\n\n` +
                `💬 <i>Mensagem promocional enviada pelo Bot Liza</i>`;

            const results = {
                total: contacts.length,
                sent: 0,
                failed: 0,
                errors: []
            };

            // Enviar para cada contato que tem Telegram
            for (const contact of contacts) {
                if (contact.telegramId) {
                    try {
                        // Verificar se o usuário tem permissão
                        if (!this.isUserAllowed(contact.telegramId)) {
                            results.failed++;
                            results.errors.push({
                                contact: contact.name,
                                error: 'Usuário não autorizado'
                            });
                            continue;
                        }

                        await this.sendMessage(contact.telegramId, promotionalMessage);
                        results.sent++;
                        
                        // Delay entre envios
                        await new Promise(resolve => setTimeout(resolve, 1000));
                        
                    } catch (error) {
                        logger.error(`Erro ao enviar promoção para ${contact.name}:`, error);
                        results.failed++;
                        results.errors.push({
                            contact: contact.name,
                            error: error.message
                        });
                    }
                } else {
                    results.failed++;
                    results.errors.push({
                        contact: contact.name,
                        error: 'Telegram ID não configurado'
                    });
                }
            }

            return {
                success: true,
                results
            };

        } catch (error) {
            logger.error('Erro ao enviar mensagem promocional via Telegram:', error);
            throw error;
        }
    }

    /**
     * Registrar conversa no sistema
     */
    async logConversation(chatId, message, response, storeId = null) {
        try {
            // Aqui você pode implementar o log das conversas
            // Por exemplo, salvar em uma collection de conversas
            logger.info('Conversa registrada:', {
                chatId,
                messageLength: message?.length || 0,
                responseLength: response?.length || 0,
                storeId,
                timestamp: new Date()
            });

            // TODO: Implementar salvamento em banco de dados
            // const conversation = new Conversation({
            //     chatId,
            //     message,
            //     response,
            //     storeId,
            //     platform: 'telegram',
            //     timestamp: new Date()
            // });
            // await conversation.save();

        } catch (error) {
            logger.error('Erro ao registrar conversa:', error);
        }
    }

    /**
     * Obter estatísticas do bot
     */
    async getBotStats() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            if (!this.botToken) {
                throw new Error('Bot não configurado');
            }

            // Obter informações do bot
            const url = `https://api.telegram.org/bot${this.botToken}/getMe`;
            const response = await fetch(url);
            const result = await response.json();

            if (!result.ok) {
                throw new Error(`Telegram API Error: ${result.description}`);
            }

            return {
                success: true,
                botInfo: result.result,
                isConfigured: this.isInitialized,
                adminChatConfigured: !!this.adminChatId,
                allowedUsersCount: this.allowedUsers.length
            };

        } catch (error) {
            logger.error('Erro ao obter estatísticas do bot:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

// Instância singleton
const telegramService = new TelegramService();

export default telegramService;
export { TelegramService };