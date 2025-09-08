import express from 'express';
import {
    verifyWebhook,
    receiveMessage,
    getConfig,
    saveConfig,
    sendMessage,
    getConversationHistory,
    getActiveConversations,
    testConnection,
    getMessageStats
} from '../controllers/whatsappController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, requireActiveStore } from '../middleware/multiTenancy.js';

const whatsappRouter = express.Router();

// Rotas públicas para webhook (sem autenticação)
// GET para verificação do webhook
whatsappRouter.get('/webhook', verifyWebhook);

// POST para receber mensagens do webhook
whatsappRouter.post('/webhook', receiveMessage);

// Rotas protegidas (requerem autenticação)
// Aplicar middleware de autenticação e multi-tenancy
whatsappRouter.use(authMiddleware);
whatsappRouter.use(identifyStore);
whatsappRouter.use(requireActiveStore);

// Configuração do WhatsApp
whatsappRouter.get('/config', getConfig);
whatsappRouter.post('/config', saveConfig);
whatsappRouter.put('/config', saveConfig);

// Envio de mensagens
whatsappRouter.post('/send-message', sendMessage);

// Conversas e histórico
whatsappRouter.get('/conversations', getActiveConversations);
whatsappRouter.get('/conversations/:customerPhone/history', getConversationHistory);

// Teste de conexão
whatsappRouter.post('/test-connection', testConnection);

// Estatísticas
whatsappRouter.get('/stats', getMessageStats);

export default whatsappRouter;