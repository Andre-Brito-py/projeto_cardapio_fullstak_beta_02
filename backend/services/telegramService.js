import axios from 'axios';
import SystemSettings from '../models/systemSettingsModel.js';
import TelegramClient from '../models/telegramClientModel.js';
import TelegramConversation from '../models/telegramConversationModel.js';
import TelegramCampaign from '../models/telegramCampaignModel.js';

class TelegramService {
    constructor() {
        this.settings = null;
        this.baseUrl = null;
        this.conversations = new Map(); // Armazenar contexto das conversas
    }

    /**
     * Inicializar o serviço do Telegram
     */
    async initialize() {
        try {
            this.settings = await SystemSettings.getInstance();
            
            if (!this.settings.telegramEnabled) {
                console.log('Telegram Bot está desabilitado');
                return false;
            }

            if (!this.settings.telegramBotToken) {
                console.log('Token do Telegram Bot não configurado');
                return false;
            }

            this.baseUrl = `https://api.telegram.org/bot${this.settings.telegramBotToken}`;
            
            // Configurar webhook se URL estiver definida
            if (this.settings.telegramWebhookUrl) {
                await this.setWebhook();
            }

            console.log('Telegram Service inicializado com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Telegram Service:', error);
            return false;
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
     * Remover webhook (usar polling)
     */
    async removeWebhook() {
        try {
            const response = await axios.post(`${this.baseUrl}/deleteWebhook`);
            if (response.data.ok) {
                console.log('Webhook removido com sucesso');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Erro ao remover webhook:', error);
            return false;
        }
    }

    /**
     * Enviar mensagem individual
     */
    async sendMessage(chatId, text, options = {}) {
        try {
            if (!this.baseUrl) {
                await this.initialize();
            }

            const payload = {
                chat_id: chatId,
                text: text,
                parse_mode: 'HTML',
                ...options
            };

            const response = await axios.post(`${this.baseUrl}/sendMessage`, payload);
            
            if (response.data.ok) {
                console.log(`Mensagem enviada para ${chatId}:`, text.substring(0, 50) + '...');
                return response.data.result;
            } else {
                console.error('Erro ao enviar mensagem:', response.data.description);
                return null;
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            return null;
        }
    }

    /**
     * Processar mensagem recebida
     */
    async processMessage(update) {
        try {
            if (!update.message || !update.message.text) {
                return;
            }

            const message = update.message;
            const chatId = message.chat.id;
            const userId = message.from.id;
            const userName = message.from.first_name || 'Cliente';
            const messageText = message.text;
            const messageId = message.message_id;

            console.log(`Mensagem recebida de ${userName} (${chatId}): ${messageText}`);

            // Salvar ou atualizar cliente
            await this.saveOrUpdateClient(message.from);

            // Salvar mensagem na conversa
            await this.saveConversation({
                telegramId: userId.toString(),
                messageType: 'user',
                message: messageText,
                telegramMessageId: messageId,
                metadata: {
                    from: message.from,
                    chat: message.chat,
                    telegramDate: new Date(message.date * 1000),
                    contentType: 'text'
                }
            });

            // Verificar se é admin
            if (await this.isAdmin(userId)) {
                await this.handleAdminMessage(chatId, messageText, userName);
                return;
            }

            // Processar mensagem do cliente com Liza
            await this.processClientMessage(chatId, userId, userName, messageText);

        } catch (error) {
            console.error('Erro ao processar mensagem:', error);
        }
    }

    /**
     * Verificar se usuário é admin
     */
    async isAdmin(userId) {
        try {
            // Verificar se o userId corresponde ao admin configurado
            return this.settings.telegramAdminChatId && 
                   this.settings.telegramAdminChatId === userId.toString();
        } catch (error) {
            console.error('Erro ao verificar admin:', error);
            return false;
        }
    }

    /**
     * Salvar ou atualizar cliente do Telegram
     */
    async saveOrUpdateClient(fromData) {
        try {
            const telegramId = fromData.id.toString();
            
            let client = await TelegramClient.findOne({ telegramId });
            
            if (client) {
                // Atualizar cliente existente
                client.firstName = fromData.first_name || client.firstName;
                client.lastName = fromData.last_name || client.lastName || '';
                client.username = fromData.username || client.username || '';
                await client.updateLastInteraction();
            } else {
                // Criar novo cliente
                client = new TelegramClient({
                    telegramId,
                    firstName: fromData.first_name || 'Cliente',
                    lastName: fromData.last_name || '',
                    username: fromData.username || '',
                    totalMessages: 1,
                    lastInteraction: new Date()
                });
                await client.save();
            }
            
            return client;
        } catch (error) {
            console.error('Erro ao salvar cliente:', error);
            logger.error('Erro ao salvar cliente do Telegram', {
                error: error.message,
                telegramId: fromData.id
            });
            return null;
        }
    }

    /**
     * Salvar conversa no histórico
     */
    async saveConversation(conversationData) {
        try {
            // Buscar cliente para obter o ObjectId
            const client = await TelegramClient.findOne({ 
                telegramId: conversationData.telegramId 
            });
            
            if (!client) {
                console.error('Cliente não encontrado para salvar conversa');
                return null;
            }
            
            const conversation = new TelegramConversation({
                ...conversationData,
                clientId: client._id
            });
            
            await conversation.save();
            return conversation;
        } catch (error) {
            console.error('Erro ao salvar conversa:', error);
            logger.error('Erro ao salvar conversa do Telegram', {
                error: error.message,
                conversationData
            });
            return null;
        }
    }

    /**
     * Processar mensagem de admin
     */
    async handleAdminMessage(chatId, messageText, userName) {
        try {
            const command = messageText.toLowerCase().trim();

            if (command === '/start' || command === '/menu') {
                const adminMenu = `
🤖 <b>Painel Admin - Telegram Bot</b>

Comandos disponíveis:

📢 <b>Disparos em Massa:</b>
/broadcast [mensagem] - Enviar para todos os clientes

🎯 <b>Campanhas:</b>
/campaign [título] [mensagem] - Criar campanha
/schedule [data] [mensagem] - Agendar mensagem

📊 <b>Estatísticas:</b>
/stats - Ver estatísticas do bot
/clients - Listar clientes ativos

⚙️ <b>Configurações:</b>
/status - Status do bot
/help - Ajuda
                `;
                await this.sendMessage(chatId, adminMenu);
                return;
            }

            if (command.startsWith('/broadcast ')) {
                const broadcastMessage = messageText.substring(11);
                await this.sendBroadcast(broadcastMessage, chatId);
                return;
            }

            if (command.startsWith('/campaign ')) {
                const campaignData = messageText.substring(10);
                await this.createCampaign(campaignData, chatId);
                return;
            }

            if (command === '/stats') {
                await this.sendStats(chatId);
                return;
            }

            if (command === '/clients') {
                await this.sendClientsList(chatId);
                return;
            }

            if (command === '/status') {
                await this.sendBotStatus(chatId);
                return;
            }

            // Comando não reconhecido
            await this.sendMessage(chatId, '❌ Comando não reconhecido. Use /menu para ver os comandos disponíveis.');

        } catch (error) {
            console.error('Erro ao processar mensagem de admin:', error);
            await this.sendMessage(chatId, '❌ Erro interno. Tente novamente.');
        }
    }

    /**
     * Processar mensagem de cliente com Liza
     */
    async processClientMessage(chatId, userId, userName, messageText) {
        try {
            // Obter ou criar contexto da conversa
            let conversation = this.conversations.get(chatId) || {
                userId,
                userName,
                messages: [],
                createdAt: new Date()
            };

            // Adicionar mensagem do cliente ao contexto
            conversation.messages.push({
                role: 'user',
                content: messageText,
                timestamp: new Date()
            });

            // Preparar contexto para Liza
            const context = {
                platform: 'telegram',
                chatId,
                userId,
                userName,
                currentMessage: messageText,
                conversationHistory: conversation.messages.slice(-10) // Últimas 10 mensagens
            };

            // Processar com Liza via OpenRouter
            const lizaResponse = await this.getLizaResponse(context);

            if (lizaResponse) {
                // Adicionar resposta da Liza ao contexto
                conversation.messages.push({
                    role: 'assistant',
                    content: lizaResponse,
                    timestamp: new Date()
                });

                // Atualizar conversa
                this.conversations.set(chatId, conversation);

                // Enviar resposta
                const sentMessage = await this.sendMessage(chatId, lizaResponse);

                // Salvar resposta da Liza na conversa
                if (sentMessage) {
                    await this.saveConversation({
                        telegramId: userId.toString(),
                        messageType: 'bot',
                        message: lizaResponse,
                        telegramMessageId: sentMessage.message_id,
                        context: messageText, // Contexto da pergunta do usuário
                        metadata: {
                            from: { id: 'bot', firstName: 'Liza' },
                            chat: { id: chatId.toString(), type: 'private' },
                            telegramDate: new Date(),
                            contentType: 'text'
                        }
                    });
                }

                console.log(`Liza respondeu para ${userName}: ${lizaResponse.substring(0, 50)}...`);
            } else {
                // Resposta padrão em caso de erro
                const errorMessage = '🤖 Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
                const sentMessage = await this.sendMessage(chatId, errorMessage);
                
                // Salvar mensagem de erro
                if (sentMessage) {
                    await this.saveConversation({
                        telegramId: userId.toString(),
                        messageType: 'system',
                        message: errorMessage,
                        telegramMessageId: sentMessage.message_id,
                        metadata: {
                            from: { id: 'system', firstName: 'Sistema' },
                            chat: { id: chatId.toString(), type: 'private' },
                            telegramDate: new Date(),
                            contentType: 'text'
                        }
                    });
                }
            }

        } catch (error) {
            console.error('Erro ao processar mensagem do cliente:', error);
            const errorMessage = '🤖 Ops! Algo deu errado. Tente novamente.';
            await this.sendMessage(chatId, errorMessage);
        }
    }

    /**
     * Obter resposta da Liza via OpenRouter
     */
    async getLizaResponse(context) {
        try {
            // Construir prompt para Liza
            const prompt = this.buildLizaPrompt(context);
            
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
                        { role: 'system', content: this.buildSystemPrompt() },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`OpenRouter API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices?.[0]?.message?.content?.trim() || 'Desculpe, não consegui processar sua mensagem.';
            
        } catch (error) {
            console.error('Erro ao obter resposta da Liza:', error);
            return 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.';
        }
    }

    /**
     * Construir prompt do sistema para Liza
     */
    buildSystemPrompt() {
        return `Você é a Liza, assistente inteligente de um restaurante via Telegram.

Suas funções principais:
- Atender clientes via Telegram
- Responder perguntas sobre o cardápio
- Ajudar com pedidos
- Fornecer informações sobre entrega
- Ser amigável e prestativa

Regras importantes:
- Você é a LIZA, não se refira ao usuário como 'Liza'
- Trate o usuário pelo nome se souber, ou como 'você'
- Respostas SEMPRE curtas e diretas
- Máximo 2-3 frases por resposta
- Use emojis para deixar mais amigável
- Seja proativa e útil
- Foque em ajudar o cliente
- Se não souber algo, seja honesta e ofereça ajuda alternativa`;
    }

    /**
     * Construir prompt para Liza
     */
    buildLizaPrompt(context) {
        const { userName, currentMessage, conversationHistory } = context;
        
        let prompt = `Cliente ${userName} disse: "${currentMessage}"`;
        
        if (conversationHistory.length > 1) {
            prompt += '\n\nHistórico da conversa:\n';
            conversationHistory.slice(-5).forEach(msg => {
                const sender = msg.role === 'user' ? userName : 'Liza';
                prompt += `${sender}: ${msg.content}\n`;
            });
        }
        
        return prompt;
    }

    /**
     * Enviar disparo em massa
     */
    async sendBroadcast(message, adminChatId) {
        try {
            if (!this.settings.telegramMassMessagingEnabled) {
                await this.sendMessage(adminChatId, '❌ Disparos em massa estão desabilitados.');
                return;
            }

            const clients = Array.from(this.conversations.keys());
            
            if (clients.length === 0) {
                await this.sendMessage(adminChatId, '📭 Nenhum cliente encontrado para envio.');
                return;
            }

            let successCount = 0;
            let errorCount = 0;

            await this.sendMessage(adminChatId, `📢 Iniciando disparo para ${clients.length} clientes...`);

            for (const chatId of clients) {
                try {
                    await this.sendMessage(chatId, `📢 <b>Mensagem da equipe:</b>\n\n${message}`);
                    successCount++;
                    
                    // Delay para evitar rate limiting
                    await new Promise(resolve => setTimeout(resolve, 100));
                } catch (error) {
                    console.error(`Erro ao enviar para ${chatId}:`, error);
                    errorCount++;
                }
            }

            const resultMessage = `✅ Disparo concluído!\n\n📊 <b>Resultados:</b>\n• Enviadas: ${successCount}\n• Erros: ${errorCount}\n• Total: ${clients.length}`;
            await this.sendMessage(adminChatId, resultMessage);

            console.log(`Broadcast enviado: ${successCount} sucessos, ${errorCount} erros`);

        } catch (error) {
            console.error('Erro no disparo em massa:', error);
            await this.sendMessage(adminChatId, '❌ Erro ao executar disparo em massa.');
        }
    }

    /**
     * Criar campanha
     */
    async createCampaign(campaignData, adminChatId) {
        try {
            if (!this.settings.telegramCampaignsEnabled) {
                await this.sendMessage(adminChatId, '❌ Campanhas estão desabilitadas.');
                return;
            }

            // Implementar lógica de campanha aqui
            await this.sendMessage(adminChatId, '🎯 Funcionalidade de campanhas em desenvolvimento.');
            
        } catch (error) {
            console.error('Erro ao criar campanha:', error);
            await this.sendMessage(adminChatId, '❌ Erro ao criar campanha.');
        }
    }

    /**
     * Enviar estatísticas
     */
    async sendStats(adminChatId) {
        try {
            const totalConversations = this.conversations.size;
            const activeToday = Array.from(this.conversations.values())
                .filter(conv => {
                    const today = new Date();
                    const lastMessage = conv.messages[conv.messages.length - 1];
                    return lastMessage && 
                           new Date(lastMessage.timestamp).toDateString() === today.toDateString();
                }).length;

            const statsMessage = `
📊 <b>Estatísticas do Bot</b>

👥 Total de conversas: ${totalConversations}
🟢 Ativas hoje: ${activeToday}
📅 Data: ${new Date().toLocaleDateString('pt-BR')}
⏰ Hora: ${new Date().toLocaleTimeString('pt-BR')}
            `;

            await this.sendMessage(adminChatId, statsMessage);
        } catch (error) {
            console.error('Erro ao enviar estatísticas:', error);
            await this.sendMessage(adminChatId, '❌ Erro ao obter estatísticas.');
        }
    }

    /**
     * Enviar lista de clientes
     */
    async sendClientsList(adminChatId) {
        try {
            const clients = Array.from(this.conversations.entries())
                .slice(0, 20) // Limitar a 20 clientes
                .map(([chatId, conv]) => {
                    const lastMessage = conv.messages[conv.messages.length - 1];
                    const lastActivity = lastMessage ? 
                        new Date(lastMessage.timestamp).toLocaleDateString('pt-BR') : 'N/A';
                    return `• ${conv.userName} (${chatId}) - ${lastActivity}`;
                })
                .join('\n');

            const clientsMessage = `
👥 <b>Clientes Ativos (últimos 20)</b>

${clients || 'Nenhum cliente encontrado'}
            `;

            await this.sendMessage(adminChatId, clientsMessage);
        } catch (error) {
            console.error('Erro ao enviar lista de clientes:', error);
            await this.sendMessage(adminChatId, '❌ Erro ao obter lista de clientes.');
        }
    }

    /**
     * Enviar status do bot
     */
    async sendBotStatus(adminChatId) {
        try {
            const status = `
🤖 <b>Status do Bot</b>

✅ Bot: Ativo
${this.settings.telegramEnabled ? '✅' : '❌'} Telegram: ${this.settings.telegramEnabled ? 'Habilitado' : 'Desabilitado'}
${this.settings.telegramMassMessagingEnabled ? '✅' : '❌'} Disparos: ${this.settings.telegramMassMessagingEnabled ? 'Habilitados' : 'Desabilitados'}
${this.settings.telegramCampaignsEnabled ? '✅' : '✅'} Campanhas: ${this.settings.telegramCampaignsEnabled ? 'Habilitadas' : 'Desabilitadas'}

🔗 Webhook: ${this.settings.telegramWebhookUrl || 'Não configurado'}
            `;

            await this.sendMessage(adminChatId, status);
        } catch (error) {
            console.error('Erro ao enviar status:', error);
            await this.sendMessage(adminChatId, '❌ Erro ao obter status.');
        }
    }

    /**
     * Limpar conversas antigas (executar periodicamente)
     */
    cleanOldConversations() {
        try {
            const now = new Date();
            const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 dias

            for (const [chatId, conversation] of this.conversations.entries()) {
                const lastMessage = conversation.messages[conversation.messages.length - 1];
                if (lastMessage && (now - new Date(lastMessage.timestamp)) > maxAge) {
                    this.conversations.delete(chatId);
                    console.log(`Conversa antiga removida: ${chatId}`);
                }
            }
        } catch (error) {
            console.error('Erro ao limpar conversas antigas:', error);
        }
    }
}

export { TelegramService };
export default TelegramService;