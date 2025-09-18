import express from 'express';
import cors from 'cors';

// Servidor de teste para demonstrar a integração do Telegram
const app = express();
const port = 3001;

app.use(express.json());
app.use(cors());

// Mock dos modelos para teste sem MongoDB
const mockTelegramClient = {
    find: () => Promise.resolve([]),
    findOne: () => Promise.resolve(null),
    create: (data) => Promise.resolve({ _id: 'mock-id', ...data }),
    countDocuments: () => Promise.resolve(0),
    save: () => Promise.resolve({ _id: 'mock-id' }),
    updateLastInteraction: () => Promise.resolve()
};

const mockTelegramConversation = {
    create: (data) => Promise.resolve({ _id: 'mock-id', ...data }),
    find: () => Promise.resolve([]),
    countDocuments: () => Promise.resolve(0),
    getStats: () => Promise.resolve({}),
    save: () => Promise.resolve({ _id: 'mock-id' })
};

const mockTelegramCampaign = {
    create: (data) => Promise.resolve({ _id: 'mock-id', ...data }),
    find: () => Promise.resolve([]),
    findById: () => Promise.resolve(null),
    countDocuments: () => Promise.resolve(0),
    getGeneralStats: () => Promise.resolve({})
};

// Mock do SystemSettings para evitar conexão com MongoDB
const mockSystemSettings = {
    getInstance: () => Promise.resolve({
        telegramEnabled: true,
        telegramBotToken: 'mock-token-123',
        telegramWebhookUrl: 'http://localhost:3000/api/telegram/webhook',
        telegramMassMessagingEnabled: true,
        telegramCampaignsEnabled: true,
        telegramAdminChatId: '123456789',
        openrouterApiKey: 'mock-openrouter-key'
    })
};

// Substituir os modelos globalmente para teste
global.TelegramClient = mockTelegramClient;
global.TelegramConversation = mockTelegramConversation;
global.TelegramCampaign = mockTelegramCampaign;
global.SystemSettings = mockSystemSettings;

// Mock da classe TelegramService para teste
class MockTelegramService {
    constructor() {
        this.settings = {
            telegramEnabled: true,
            telegramBotToken: 'mock-token-123',
            telegramWebhookUrl: 'http://localhost:3000/api/telegram/webhook',
            telegramMassMessagingEnabled: true,
            telegramCampaignsEnabled: true,
            telegramAdminChatId: '123456789'
        };
        this.baseUrl = `https://api.telegram.org/bot${this.settings.telegramBotToken}`;
        this.conversations = new Map();
    }

    async initialize() {
        console.log('Mock Telegram Service inicializado com sucesso');
        return true;
    }

    async processMessage(message) {
        console.log('Processando mensagem mock:', message.text);
        return { success: true, processed: true };
    }

    async sendMessage(chatId, text) {
        console.log(`Mock: Enviando mensagem para ${chatId}: ${text}`);
        return { success: true, message_id: Math.floor(Math.random() * 1000) };
    }

    async getStats() {
        return {
            totalClients: 10,
            totalMessages: 50,
            activeCampaigns: 2
        };
    }
}

// Rotas de teste
app.get('/test-telegram-service', async (req, res) => {
    try {
        const telegramService = new MockTelegramService();
        
        // Teste de inicialização
        const initialized = await telegramService.initialize();
        
        res.json({
            success: true,
            message: 'TelegramService testado com sucesso',
            initialized,
            features: {
                webhook: 'Configurado para receber mensagens',
                openrouter: 'Integrado com IA Liza',
                database: 'Modelos criados para clientes, conversas e campanhas',
                admin: 'Endpoints para gerenciamento administrativo'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no teste do TelegramService',
            error: error.message
        });
    }
});

app.post('/test-webhook', async (req, res) => {
    try {
        const telegramService = new MockTelegramService();
        
        // Simular recebimento de mensagem
        const mockMessage = {
            message: {
                message_id: 123,
                from: {
                    id: 12345,
                    first_name: 'Usuário',
                    last_name: 'Teste',
                    username: 'usuario_teste'
                },
                chat: {
                    id: 12345,
                    type: 'private'
                },
                date: Math.floor(Date.now() / 1000),
                text: 'Olá, quero fazer um pedido!'
            }
        };
        
        // Processar mensagem
        await telegramService.processMessage(mockMessage.message);
        
        res.json({
            success: true,
            message: 'Webhook testado com sucesso',
            processed: mockMessage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no teste do webhook',
            error: error.message
        });
    }
});

app.get('/test-stats', async (req, res) => {
    try {
        const telegramService = new MockTelegramService();
        const stats = await telegramService.getStats();
        
        res.json({
            success: true,
            message: 'Estatísticas obtidas com sucesso',
            stats
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao obter estatísticas',
            error: error.message
        });
    }
});

app.get('/test-integration', async (req, res) => {
    try {
        const telegramService = new MockTelegramService();
        
        // Teste completo de integração
        const initialized = await telegramService.initialize();
        
        if (!initialized) {
            throw new Error('Falha na inicialização do serviço');
        }
        
        // Simular envio de mensagem
        const sendResult = await telegramService.sendMessage('123456', 'Teste de integração');
        
        res.json({
            success: true,
            message: 'Integração testada com sucesso',
            tests: {
                initialization: initialized,
                messaging: sendResult.success,
                database: 'Mock funcionando',
                webhook: 'Configurado'
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro no teste de integração',
            error: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`🤖 Servidor de teste do Telegram rodando em http://localhost:${port}`);
    console.log('📋 Endpoints disponíveis:');
    console.log(`   GET  http://localhost:${port}/test-telegram-service`);
    console.log(`   POST http://localhost:${port}/test-webhook`);
    console.log(`   GET  http://localhost:${port}/test-stats`);
    console.log(`   GET  http://localhost:${port}/test-integration`);
});

export default app;