import express from 'express';
import Store from '../models/storeModel.js';
import authMiddleware from '../middleware/auth.js';
import MultiStoreTelegramService from '../services/multiStoreTelegramService.js';

const router = express.Router();
const multiStoreTelegramService = new MultiStoreTelegramService();

/**
 * GET /telegram/config - Obter configuração do Telegram da loja
 */
router.get('/telegram/config', authMiddleware, async (req, res) => {
    try {
        const store = await Store.findById(req.user.storeId).select('telegram');
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        res.json({
            success: true,
            config: store.telegram
        });
    } catch (error) {
        console.error('Erro ao obter configuração do Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * PUT /telegram/config - Atualizar configuração do Telegram da loja
 */
router.put('/telegram/config', authMiddleware, async (req, res) => {
    try {
        const { phoneNumber, isActive, adminChatId, welcomeMessage, autoReply, businessHours } = req.body;
        
        const store = await Store.findById(req.user.storeId);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Validar número de telefone se fornecido
        if (phoneNumber && phoneNumber.trim()) {
            const normalizedPhone = phoneNumber.replace(/\D/g, '');
            if (normalizedPhone.length < 10 || normalizedPhone.length > 15) {
                return res.status(400).json({
                    success: false,
                    message: 'Número de telefone inválido'
                });
            }
        }

        // Atualizar configurações do Telegram
        store.telegram = {
            phoneNumber: phoneNumber?.trim() || store.telegram.phoneNumber,
            isActive: isActive !== undefined ? isActive : store.telegram.isActive,
            adminChatId: adminChatId?.trim() || store.telegram.adminChatId,
            welcomeMessage: welcomeMessage?.trim() || store.telegram.welcomeMessage,
            autoReply: autoReply !== undefined ? autoReply : store.telegram.autoReply,
            businessHours: businessHours || store.telegram.businessHours
        };

        await store.save();

        // Recarregar configurações no serviço multi-loja
        await multiStoreTelegramService.reloadStoreConfigurations();

        res.json({
            success: true,
            message: 'Configuração do Telegram atualizada com sucesso',
            config: store.telegram
        });
    } catch (error) {
        console.error('Erro ao atualizar configuração do Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * POST /telegram/test - Testar configuração do Telegram da loja
 */
router.post('/telegram/test', authMiddleware, async (req, res) => {
    try {
        const store = await Store.findById(req.user.storeId);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        if (!store.telegram.isActive) {
            return res.status(400).json({
                success: false,
                message: 'Telegram não está ativo para esta loja'
            });
        }

        if (!store.telegram.adminChatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID do admin não configurado'
            });
        }

        // Inicializar serviço e enviar mensagem de teste
        await multiStoreTelegramService.initialize();
        
        const testMessage = `🧪 *Teste de Configuração*

✅ Loja: ${store.name}
📱 Número: ${store.telegram.phoneNumber || 'Não configurado'}
🤖 Status: ${store.telegram.isActive ? 'Ativo' : 'Inativo'}

Esta é uma mensagem de teste para verificar se a configuração do Telegram está funcionando corretamente.`;

        const result = await multiStoreTelegramService.sendMessage(
            store.telegram.adminChatId,
            testMessage
        );

        if (result) {
            res.json({
                success: true,
                message: 'Mensagem de teste enviada com sucesso'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Erro ao enviar mensagem de teste'
            });
        }
    } catch (error) {
        console.error('Erro ao testar configuração do Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

/**
 * GET /telegram/status - Obter status do Telegram da loja
 */
router.get('/telegram/status', authMiddleware, async (req, res) => {
    try {
        const store = await Store.findById(req.user.storeId);
        
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar se o serviço está inicializado
        const serviceInitialized = await multiStoreTelegramService.initialize();

        const status = {
            configured: !!(store.telegram.phoneNumber && store.telegram.phoneNumber.trim()),
            active: store.telegram.isActive,
            adminChatConfigured: !!(store.telegram.adminChatId && store.telegram.adminChatId.trim()),
            serviceInitialized,
            phoneNumber: store.telegram.phoneNumber || null,
            autoReply: store.telegram.autoReply,
            businessHoursEnabled: store.telegram.businessHours.enabled
        };

        res.json({
            success: true,
            status
        });
    } catch (error) {
        console.error('Erro ao obter status do Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
});

export default router;