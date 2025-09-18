import axios from 'axios';
import SystemSettings from '../models/systemSettingsModel.js';
import Store from '../models/storeModel.js';
import TelegramClient from '../models/telegramClientModel.js';
import TelegramConversation from '../models/telegramConversationModel.js';
import TelegramCampaign from '../models/telegramCampaignModel.js';

class MultiStoreTelegramService {
    constructor() {
        this.settings = null;
        this.baseUrl = null;
        this.conversations = new Map(); // Armazenar contexto das conversas
        this.storePhoneMap = new Map(); // Mapear números de telefone para lojas
    }

    /**
     * Inicializar o serviço do Telegram multi-loja
     */
    async initialize() {
        try {
            this.settings = await SystemSettings.getInstance();
            
            if (!this.settings.telegramEnabled) {
                console.log('Telegram Bot está desabilitado');
                return false;
            }

            if (!this.settings.telegramBotToken) {
                console.log('Token do Telegram Bot não configurado no super admin');
                return false;
            }

            this.baseUrl = `https://api.telegram.org/bot${this.settings.telegramBotToken}`;
            
            // Carregar mapeamento de números de telefone para lojas
            await this.loadStorePhoneMapping();
            
            // Configurar webhook se URL estiver definida
            if (this.settings.telegramWebhookUrl) {
                await this.setWebhook();
            }

            console.log('Multi-Store Telegram Service inicializado com sucesso');
            console.log(`Lojas ativas no Telegram: ${this.storePhoneMap.size}`);
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Multi-Store Telegram Service:', error);
            return false;
        }
    }

    /**
     * Carregar mapeamento de números de telefone para lojas
     */
    async loadStorePhoneMapping() {
        try {
            const stores = await Store.find({
                'telegram.isActive': true,
                'telegram.phoneNumber': { $ne: '' }
            }).select('_id name telegram');

            this.storePhoneMap.clear();
            
            stores.forEach(store => {
                if (store.telegram.phoneNumber) {
                    // Normalizar número de telefone (remover caracteres especiais)
                    const normalizedPhone = this.normalizePhoneNumber(store.telegram.phoneNumber);
                    this.storePhoneMap.set(normalizedPhone, {
                        storeId: store._id,
                        storeName: store.name,
                        config: store.telegram
                    });
                }
            });

            console.log(`Carregadas ${this.storePhoneMap.size} lojas com Telegram ativo`);
        } catch (error) {
            console.error('Erro ao carregar mapeamento de lojas:', error);
        }
    }

    /**
     * Normalizar número de telefone
     */
    normalizePhoneNumber(phone) {
        return phone.replace(/\D/g, ''); // Remove tudo que não é dígito
    }

    /**
     * Identificar loja baseada no número de telefone da mensagem
     */
    async identifyStoreFromMessage(message) {
        try {
            // Tentar identificar pela conversa existente primeiro
            const conversation = await TelegramConversation.findOne({
                chatId: message.chat.id.toString()
            }).populate('storeId');

            if (conversation && conversation.storeId) {
                return conversation.storeId;
            }

            // Se não há conversa, tentar identificar pelo contexto da mensagem
            // Por enquanto, retornar a primeira loja ativa como fallback
            const firstStore = Array.from(this.storePhoneMap.values())[0];
            if (firstStore) {
                const store = await Store.findById(firstStore.storeId);
                return store;
            }

            return null;
        } catch (error) {
            console.error('Erro ao identificar loja:', error);
            return null;
        }
    }

    /**
     * Processar mensagem recebida
     */
    async processMessage(message) {
        try {
            const chatId = message.chat.id.toString();
            
            // Identificar a loja responsável por esta conversa
            const store = await this.identifyStoreFromMessage(message);
            
            if (!store) {
                await this.sendMessage(chatId, 
                    '❌ Desculpe, não consegui identificar a loja. Entre em contato com o suporte.'
                );
                return;
            }

            // Registrar/atualizar cliente
            await this.registerClient(message, store._id);

            // Processar comando ou mensagem
            if (message.text && message.text.startsWith('/')) {
                await this.processCommand(message, store);
            } else {
                await this.processTextMessage(message, store);
            }

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
            await this.sendMessage(message.chat.id, 
                '❌ Ocorreu um erro interno. Tente novamente em alguns instantes.'
            );
        }
    }

    /**
     * Processar comandos
     */
    async processCommand(message, store) {
        const command = message.text.split(' ')[0].toLowerCase();
        const chatId = message.chat.id.toString();

        switch (command) {
            case '/start':
                await this.sendWelcomeMessage(chatId, store);
                break;
            case '/menu':
                await this.sendMenu(chatId, store);
                break;
            case '/help':
                await this.sendHelp(chatId, store);
                break;
            case '/status':
                await this.sendOrderStatus(chatId, store);
                break;
            default:
                await this.sendMessage(chatId, 
                    `❓ Comando não reconhecido. Digite /help para ver os comandos disponíveis.`
                );
        }
    }

    /**
     * Processar mensagem de texto
     */
    async processTextMessage(message, store) {
        const chatId = message.chat.id.toString();
        
        // Verificar horário de funcionamento se habilitado
        if (store.telegram.businessHours.enabled && !this.isBusinessHours(store)) {
            await this.sendMessage(chatId, store.telegram.businessHours.message);
            return;
        }

        // Aqui você pode integrar com IA ou sistema de processamento de pedidos
        // Por enquanto, enviar resposta automática se habilitada
        if (store.telegram.autoReply) {
            await this.sendMessage(chatId, 
                `Obrigado pela sua mensagem! Em breve um de nossos atendentes entrará em contato. 
                
📱 Para ver nosso cardápio, digite /menu
📞 Para falar com atendente, aguarde que entraremos em contato.`
            );
        }
    }

    /**
     * Enviar mensagem de boas-vindas personalizada da loja
     */
    async sendWelcomeMessage(chatId, store) {
        const welcomeText = `🍕 *${store.name}*

${store.telegram.welcomeMessage}

🍽️ *Comandos disponíveis:*
/menu - Ver cardápio
/help - Ajuda
/status - Status do pedido

📍 *Endereço:* ${store.settings.restaurantAddress}
⏰ *Horário:* ${this.getBusinessHoursText(store)}`;

        await this.sendMessage(chatId, welcomeText, {
            reply_markup: {
                inline_keyboard: [
                    [
                        { text: '🍽️ Ver Cardápio', callback_data: `menu_${store._id}` },
                        { text: '📞 Falar com Atendente', callback_data: `contact_${store._id}` }
                    ]
                ]
            }
        });
    }

    /**
     * Verificar se está no horário de funcionamento
     */
    isBusinessHours(store) {
        const now = new Date();
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
        const currentTime = now.getHours() * 100 + now.getMinutes();
        
        const daySchedule = store.settings.operatingHours[dayOfWeek];
        if (!daySchedule || daySchedule.closed) {
            return false;
        }

        const openTime = parseInt(daySchedule.open.replace(':', ''));
        const closeTime = parseInt(daySchedule.close.replace(':', ''));
        
        return currentTime >= openTime && currentTime <= closeTime;
    }

    /**
     * Obter texto do horário de funcionamento
     */
    getBusinessHoursText(store) {
        const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
        const dayNames = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
        
        let hoursText = '';
        days.forEach((day, index) => {
            const schedule = store.settings.operatingHours[day];
            if (schedule && !schedule.closed) {
                hoursText += `${dayNames[index]}: ${schedule.open} - ${schedule.close}\n`;
            }
        });
        
        return hoursText || 'Consulte nossos horários';
    }

    /**
     * Registrar cliente no sistema
     */
    async registerClient(message, storeId) {
        try {
            const chatId = message.chat.id.toString();
            
            let client = await TelegramClient.findOne({ 
                chatId: chatId,
                storeId: storeId 
            });

            if (!client) {
                client = new TelegramClient({
                    storeId: storeId,
                    chatId: chatId,
                    userId: message.from.id,
                    firstName: message.from.first_name || '',
                    lastName: message.from.last_name || '',
                    username: message.from.username || '',
                    languageCode: message.from.language_code || 'pt'
                });
                await client.save();
                console.log(`Novo cliente registrado: ${client.firstName} (${chatId})`);
            } else {
                // Atualizar informações se necessário
                client.firstName = message.from.first_name || client.firstName;
                client.lastName = message.from.last_name || client.lastName;
                client.username = message.from.username || client.username;
                client.lastInteraction = new Date();
                await client.save();
            }

            return client;
        } catch (error) {
            console.error('Erro ao registrar cliente:', error);
            return null;
        }
    }

    /**
     * Configurar webhook do Telegram
     */
    async setWebhook() {
        try {
            const response = await axios.post(`${this.baseUrl}/setWebhook`, {
                url: this.settings.telegramWebhookUrl,
                allowed_updates: ['message', 'callback_query']
            });

            if (response.data.ok) {
                console.log('Webhook configurado com sucesso:', this.settings.telegramWebhookUrl);
                return true;
            } else {
                console.error('Erro ao configurar webhook:', response.data.description);
                return false;
            }
        } catch (error) {
            console.error('Erro ao configurar webhook:', error);
            return false;
        }
    }

    /**
     * Enviar mensagem
     */
    async sendMessage(chatId, text, options = {}) {
        try {
            if (!this.baseUrl) {
                await this.initialize();
            }

            const payload = {
                chat_id: chatId,
                text: text,
                parse_mode: 'Markdown',
                ...options
            };

            const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
            return response.data;
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return null;
        }
    }

    /**
     * Enviar mensagem para uma loja específica
     */
    async sendMessageToStore(storeId, text, options = {}) {
        try {
            const store = await Store.findById(storeId);
            if (!store || !store.telegram.isActive || !store.telegram.adminChatId) {
                throw new Error('Loja não configurada para Telegram');
            }

            return await this.sendMessage(store.telegram.adminChatId, text, options);
        } catch (error) {
            console.error('Erro ao enviar mensagem para loja:', error);
            return null;
        }
    }

    /**
     * Recarregar configurações das lojas
     */
    async reloadStoreConfigurations() {
        await this.loadStorePhoneMapping();
        console.log('Configurações das lojas recarregadas');
    }

    // Métodos placeholder para implementação futura
    async sendMenu(chatId, store) {
        await this.sendMessage(chatId, '🍽️ Cardápio em desenvolvimento...');
    }

    async sendHelp(chatId, store) {
        const helpText = `🤖 *Ajuda - ${store.name}*

*Comandos disponíveis:*
/start - Iniciar conversa
/menu - Ver cardápio
/help - Esta ajuda
/status - Status do pedido

*Como fazer um pedido:*
1. Digite /menu para ver o cardápio
2. Envie uma mensagem com o que deseja
3. Aguarde nosso atendente

📞 *Contato:* ${store.settings.restaurantAddress}`;

        await this.sendMessage(chatId, helpText);
    }

    async sendOrderStatus(chatId, store) {
        await this.sendMessage(chatId, '📦 Sistema de status de pedidos em desenvolvimento...');
    }
}

export default MultiStoreTelegramService;