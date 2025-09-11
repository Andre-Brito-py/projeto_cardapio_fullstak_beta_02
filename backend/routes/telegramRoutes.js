import express from 'express';
import telegramController from '../controllers/telegramController.js';
import authMiddleware from '../middleware/auth.js';
import { isSuperAdmin } from '../middleware/superAdmin.js';

const router = express.Router();

/**
 * Webhook do Telegram (público - sem autenticação)
 * Recebe mensagens enviadas pelos usuários do bot
 */
router.post('/webhook', telegramController.receiveWebhook);

/**
 * Rotas administrativas (requerem autenticação)
 */

// Configuração do webhook
router.post('/webhook/set', authMiddleware, isSuperAdmin, telegramController.setWebhook);
router.delete('/webhook/remove', authMiddleware, isSuperAdmin, telegramController.removeWebhook);

// Envio de mensagens
router.post('/message/send', authMiddleware, isSuperAdmin, telegramController.sendMessage);
router.post('/broadcast', authMiddleware, isSuperAdmin, telegramController.sendBroadcast);

// Informações e estatísticas
router.get('/stats', authMiddleware, isSuperAdmin, telegramController.getStats);
router.get('/clients', authMiddleware, isSuperAdmin, telegramController.getClients);
router.get('/status', authMiddleware, isSuperAdmin, telegramController.getBotStatus);

// Gerenciamento de clientes
router.post('/clients', authMiddleware, isSuperAdmin, telegramController.addClient);
router.get('/clients/:clientId', authMiddleware, isSuperAdmin, telegramController.getClient);
router.put('/clients/:clientId', authMiddleware, isSuperAdmin, telegramController.updateClient);
router.delete('/clients/:clientId', authMiddleware, isSuperAdmin, telegramController.removeClient);

// Teste de conexão
router.get('/test', authMiddleware, isSuperAdmin, telegramController.testConnection);

// Rotas de campanhas
router.post('/campaigns', authMiddleware, isSuperAdmin, telegramController.createCampaign);
router.get('/campaigns', authMiddleware, isSuperAdmin, telegramController.getCampaigns);
router.post('/campaigns/:campaignId/execute', authMiddleware, isSuperAdmin, telegramController.executeCampaign);
router.post('/campaigns/:campaignId/pause', authMiddleware, isSuperAdmin, telegramController.pauseCampaign);
router.post('/campaigns/:campaignId/cancel', authMiddleware, isSuperAdmin, telegramController.cancelCampaign);
router.post('/campaigns/:campaignId/resume', authMiddleware, isSuperAdmin, telegramController.resumeCampaign);

export default router;