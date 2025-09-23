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
        // Remove tudo que não é dígito
        let normalized = phone.replace(/\D/g, '');
        
        // Remove código do país brasileiro (+55) se presente
        if (normalized.startsWith('55') && normalized.length > 11) {
            normalized = normalized.substring(2);
        }
        
        return normalized;
    }

    /**
     * Identificar loja baseada no número de telefone do cliente
     */
    async identifyStoreFromMessage(message) {
        try {
            const chatId = message.chat.id.toString();
            const clientPhone = message.from.phone_number || message.contact?.phone_number;
            
            // Método 1: Tentar identificar pela conversa existente primeiro
            const conversation = await TelegramConversation.findOne({
                chatId: chatId
            }).populate('storeId');

            if (conversation && conversation.storeId) {
                console.log(`Loja identificada pela conversa existente: ${conversation.storeId.name}`);
                return conversation.storeId;
            }

            // Método 2: Identificar pelo número de telefone do cliente (se disponível)
            if (clientPhone) {
                const normalizedClientPhone = this.normalizePhoneNumber(clientPhone);
                
                // Buscar cliente existente com este telefone
                const Customer = (await import('../models/customerModel.js')).default;
                const customer = await Customer.findOne({
                    phone: { $regex: normalizedClientPhone.slice(-8), $options: 'i' } // Últimos 8 dígitos
                }).populate('storeId');

                if (customer && customer.storeId) {
                    console.log(`Loja identificada pelo telefone do cliente: ${customer.storeId.name}`);
                    return customer.storeId;
                }
            }

            // Método 3: Identificar por contexto da mensagem (palavras-chave, menções)
            const messageText = message.text?.toLowerCase() || '';
            
            // Buscar por menções de nome da loja na mensagem
            for (const [phone, storeData] of this.storePhoneMap.entries()) {
                const store = await Store.findById(storeData.storeId);
                if (store && messageText.includes(store.name.toLowerCase())) {
                    console.log(`Loja identificada por menção no texto: ${store.name}`);
                    return store;
                }
            }

            // Método 4: Se o cliente está iniciando conversa, tentar identificar pela primeira loja ativa
            // Isso pode ser melhorado com um sistema de roteamento mais sofisticado
            if (messageText.includes('/start') || messageText.includes('olá') || messageText.includes('oi')) {
                // Retornar a primeira loja ativa como fallback temporário
                const firstStore = Array.from(this.storePhoneMap.values())[0];
                if (firstStore) {
                    const store = await Store.findById(firstStore.storeId);
                    console.log(`Loja identificada como fallback: ${store.name}`);
                    return store;
                }
            }

            console.log('Não foi possível identificar a loja para esta mensagem');
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
     * Processar mensagem de texto com Liza
     */
    async processTextMessage(message, store) {
        try {
            const chatId = message.chat.id.toString();
            const userId = message.from.id;
            const userName = message.from.first_name || 'Cliente';
            const messageText = message.text;

            // Verificar horário de funcionamento se habilitado
            if (store.telegram.businessHours?.enabled && !this.isBusinessHours(store)) {
                await this.sendMessage(chatId, store.telegram.businessHours.message);
                return;
            }

            // Processar com Liza
            const lizaResponse = await this.getLizaResponse({
                message: messageText,
                userName,
                userId,
                chatId,
                store,
                platform: 'telegram'
            });

            if (lizaResponse) {
                // Verificar se a resposta deve incluir link da loja
                if (this.shouldIncludeStoreLink(messageText)) {
                    const storeLink = this.generateStoreLink(store);
                    const responseWithLink = `${lizaResponse}\n\n🔗 **Acesse nosso cardápio completo:**\n${storeLink}`;
                    await this.sendMessage(chatId, responseWithLink);
                } else {
                    await this.sendMessage(chatId, lizaResponse);
                }

                // Salvar conversa
                await this.saveConversation(chatId, userId, messageText, lizaResponse, store._id);
            } else {
                // Resposta de fallback
                await this.sendMessage(chatId, 
                    '🤖 Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.'
                );
            }

        } catch (error) {
            console.error('Erro ao processar mensagem de texto:', error);
            await this.sendMessage(message.chat.id, 
                '❌ Ocorreu um erro interno. Tente novamente em alguns instantes.'
            );
        }
    }

    /**
     * Verificar se deve incluir link da loja na resposta
     */
    shouldIncludeStoreLink(messageText) {
        const linkKeywords = [
            'cardápio', 'menu', 'link', 'site', 'página', 'pedido', 'pedir',
            'delivery', 'entrega', 'fazer pedido', 'ver cardápio', 'opções'
        ];
        
        const text = messageText.toLowerCase();
        return linkKeywords.some(keyword => text.includes(keyword));
    }

    /**
     * Gerar link específico da loja
     */
    generateStoreLink(store) {
        // Usar subdomain se disponível, senão usar slug
        if (store.domain?.subdomain) {
            return `https://${store.domain.subdomain}.pedai.com`;
        } else if (store.slug) {
            return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/${store.slug}`;
        } else {
            return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/store/${store._id}`;
        }
    }

    /**
     * Obter resposta da Liza via OpenRouter
     */
    async getLizaResponse(context) {
        try {
            const { message, userName, store, platform } = context;
            
            // Construir prompt personalizado para a loja
            const systemPrompt = this.buildStoreSystemPrompt(store);
            const userPrompt = `Cliente: ${userName}\nMensagem: ${message}`;

            // Fazer requisição para OpenRouter
            const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.settings.liza?.openRouterApiKey || this.settings.lisaOpenRouterApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'mistralai/mistral-7b-instruct',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || null;
            
        } catch (error) {
            console.error('Erro ao obter resposta da Liza:', error);
            return null;
        }
    }

    /**
     * Construir prompt do sistema personalizado para a loja
     */
    buildStoreSystemPrompt(store) {
        const storeInfo = {
            name: store.name,
            address: store.settings?.restaurantAddress || 'Endereço não informado',
            phone: store.telegram?.phoneNumber || 'Telefone não informado',
            hours: this.getBusinessHoursText(store)
        };

        return `Você é a Liza, assistente inteligente do restaurante "${storeInfo.name}" via Telegram.

INFORMAÇÕES DA LOJA:
- Nome: ${storeInfo.name}
- Endereço: ${storeInfo.address}
- Telefone: ${storeInfo.phone}
- Horário: ${storeInfo.hours}

SUAS FUNÇÕES:
- Atender clientes via Telegram de forma personalizada
- Responder perguntas sobre cardápio e produtos
- Ajudar com pedidos e informações de entrega
- Fornecer informações específicas desta loja
- Ser amigável, prestativa e profissional

REGRAS IMPORTANTES:
- Você é a LIZA do restaurante ${storeInfo.name}
- Trate o cliente pelo nome quando possível
- Respostas SEMPRE curtas e diretas (máximo 3 frases)
- Use emojis para deixar mais amigável
- Seja proativa em oferecer ajuda
- Quando perguntarem sobre cardápio, mencione que pode enviar o link
- Para dúvidas sobre entrega, informe nossa área de cobertura
- Se não souber algo específico, seja honesta e ofereça contato direto

EXEMPLOS DE RESPOSTAS:
- "Olá! 😊 Sou a Liza do ${storeInfo.name}. Como posso ajudar você hoje?"
- "Temos várias opções deliciosas! 🍕 Quer que eu envie o link do nosso cardápio?"
- "Entregamos na sua região sim! 🚚 O tempo estimado é de 30-45 minutos."`;
    }

    /**
     * Obter texto do horário de funcionamento
     */
    getBusinessHoursText(store) {
        if (!store.telegram?.businessHours?.enabled) {
            return 'Consulte nossos horários';
        }

        const hours = store.telegram.businessHours;
        if (hours.schedule) {
            return `${hours.schedule}`;
        }

        return 'Segunda a Domingo - Consulte horários';
    }

    /**
     * Verificar se está no horário de funcionamento
     */
    isBusinessHours(store) {
        if (!store.telegram?.businessHours?.enabled) {
            return true; // Se não configurado, sempre disponível
        }

        const now = new Date();
        const currentHour = now.getHours();
        const currentDay = now.getDay(); // 0 = domingo, 1 = segunda, etc.

        // Lógica básica - pode ser expandida conforme necessário
        const businessHours = store.telegram.businessHours;
        
        // Se tem horário específico configurado, usar lógica mais complexa
        if (businessHours.startTime && businessHours.endTime) {
            const startHour = parseInt(businessHours.startTime.split(':')[0]);
            const endHour = parseInt(businessHours.endTime.split(':')[0]);
            
            return currentHour >= startHour && currentHour < endHour;
        }

        // Fallback: horário comercial padrão (8h às 22h)
        return currentHour >= 8 && currentHour < 22;
    }
    async saveConversation(chatId, userId, userMessage, botResponse, storeId) {
        try {
            let conversation = await TelegramConversation.findOne({
                chatId: chatId,
                storeId: storeId
            });

            if (!conversation) {
                conversation = new TelegramConversation({
                    storeId: storeId,
                    chatId: chatId,
                    userId: userId,
                    messages: []
                });
            }

            conversation.messages.push({
                type: 'user',
                content: userMessage,
                timestamp: new Date()
            });

            conversation.messages.push({
                type: 'bot',
                content: botResponse,
                timestamp: new Date()
            });

            conversation.lastMessage = new Date();
            await conversation.save();

        } catch (error) {
            console.error('Erro ao salvar conversa:', error);
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