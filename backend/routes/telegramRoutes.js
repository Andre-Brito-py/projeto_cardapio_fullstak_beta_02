/**
 * Rotas do Telegram Bot
 * 
 * Define todas as rotas relacionadas às funcionalidades
 * do bot Telegram, incluindo envio de mensagens,
 * gerenciamento de contatos e webhooks.
 * 
 * Autor: Sistema IA Liza
 * Data: Janeiro 2025
 */

import express from 'express';
import {
    sendMenu,
    sendPromotionalMessage,
    getTelegramContacts,
    getBotStats,
    testAdminMessage,
    getMenuPreview,
    webhook
} from '../controllers/telegramController.js';
import authMiddleware from '../middleware/auth.js';
import { requireStoreAdmin } from '../middleware/multiTenancy.js';

const router = express.Router();

// Webhook público (sem autenticação)
router.post('/webhook', webhook);

// Todas as outras rotas requerem autenticação
router.use(authMiddleware);

// Rotas específicas da loja (requerem acesso à loja)
router.post('/stores/:storeId/send-menu', requireStoreAdmin, sendMenu);
router.post('/stores/:storeId/send-promotional', requireStoreAdmin, sendPromotionalMessage);
router.get('/stores/:storeId/contacts', requireStoreAdmin, getTelegramContacts);
router.get('/stores/:storeId/stats', requireStoreAdmin, getBotStats);
router.get('/stores/:storeId/menu-preview', requireStoreAdmin, getMenuPreview);

// Rotas administrativas
router.post('/test-admin-message', testAdminMessage);

export default router;