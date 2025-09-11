/**
 * Controlador do Telegram Bot
 * 
 * Gerencia funcionalidades do bot Telegram incluindo:
 * - Envio de cardápios
 * - Mensagens promocionais
 * - Relatórios de conversas
 * - Integração com contatos
 * 
 * Autor: Sistema IA Liza
 * Data: Janeiro 2025
 */

import telegramService from '../services/telegramService.js';
import Store from '../models/storeModel.js';
import customerModel from '../models/customerModel.js';
import logger from '../utils/logger.js';

/**
 * Enviar cardápio via Telegram
 */
export const sendMenu = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { contactIds } = req.body; // Array opcional de IDs de contatos

        // Verificar se a loja existe e pertence ao usuário
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar permissões (se não for super admin, verificar se é dono da loja)
        if (req.user.role !== 'super_admin' && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Enviar cardápio via Telegram
        const result = await telegramService.sendMenuToContacts(storeId, contactIds);

        if (result.success) {
            res.json({
                success: true,
                message: 'Cardápio enviado com sucesso',
                data: result.results
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        logger.error('Erro ao enviar cardápio via Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Enviar mensagem promocional via Telegram
 */
export const sendPromotionalMessage = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { message, contactIds } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mensagem é obrigatória'
            });
        }

        // Verificar se a loja existe e pertence ao usuário
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar permissões
        if (req.user.role !== 'super_admin' && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Enviar mensagem promocional
        const result = await telegramService.sendPromotionalMessage(storeId, message, contactIds);

        if (result.success) {
            res.json({
                success: true,
                message: 'Mensagem promocional enviada com sucesso',
                data: result.results
            });
        } else {
            res.status(400).json({
                success: false,
                message: result.message
            });
        }

    } catch (error) {
        logger.error('Erro ao enviar mensagem promocional via Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Obter contatos com Telegram configurado
 */
export const getTelegramContacts = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Verificar se a loja existe e pertence ao usuário
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar permissões
        if (req.user.role !== 'super_admin' && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Buscar contatos com Telegram ID
        const contacts = await customerModel.find({
            store: storeId,
            isActive: true,
            telegramId: { $exists: true, $ne: null, $ne: '' }
        }).select('name email phone telegramId createdAt lastContact');

        // Buscar total de contatos
        const totalContacts = await customerModel.countDocuments({
            store: storeId,
            isActive: true
        });

        res.json({
            success: true,
            data: {
                contacts,
                totalContacts,
                telegramContacts: contacts.length,
                percentage: totalContacts > 0 ? ((contacts.length / totalContacts) * 100).toFixed(1) : 0
            }
        });

    } catch (error) {
        logger.error('Erro ao buscar contatos do Telegram:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Obter estatísticas do bot Telegram
 */
export const getBotStats = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Verificar se a loja existe e pertence ao usuário
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar permissões
        if (req.user.role !== 'super_admin' && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Obter estatísticas do bot
        const botStats = await telegramService.getBotStats();

        // Obter estatísticas de contatos da loja
        const totalContacts = await customerModel.countDocuments({
            store: storeId,
            isActive: true
        });

        const telegramContacts = await customerModel.countDocuments({
            store: storeId,
            isActive: true,
            telegramId: { $exists: true, $ne: null, $ne: '' }
        });

        res.json({
            success: true,
            data: {
                bot: botStats,
                store: {
                    totalContacts,
                    telegramContacts,
                    percentage: totalContacts > 0 ? ((telegramContacts / totalContacts) * 100).toFixed(1) : 0
                }
            }
        });

    } catch (error) {
        logger.error('Erro ao obter estatísticas do bot:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Testar envio de mensagem para admin
 */
export const testAdminMessage = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Mensagem é obrigatória'
            });
        }

        // Inicializar serviço se necessário
        await telegramService.initialize();

        if (!telegramService.adminChatId) {
            return res.status(400).json({
                success: false,
                message: 'Chat ID do admin não configurado'
            });
        }

        // Enviar mensagem de teste
        const testMessage = `🧪 <b>Teste do Bot Liza</b>\n\n${message}\n\n` +
            `🕐 ${new Date().toLocaleString('pt-BR')}\n` +
            `👤 Enviado por: ${req.user.name || req.user.email}`;

        await telegramService.sendMessage(telegramService.adminChatId, testMessage);

        res.json({
            success: true,
            message: 'Mensagem de teste enviada com sucesso'
        });

    } catch (error) {
        logger.error('Erro ao enviar mensagem de teste:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao enviar mensagem de teste'
        });
    }
};

/**
 * Gerar preview do cardápio
 */
export const getMenuPreview = async (req, res) => {
    try {
        const { storeId } = req.params;

        // Verificar se a loja existe e pertence ao usuário
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Verificar permissões
        if (req.user.role !== 'super_admin' && store.owner.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Acesso negado'
            });
        }

        // Gerar preview do cardápio
        const menuMessage = await telegramService.generateMenuMessage(storeId);

        res.json({
            success: true,
            data: {
                preview: menuMessage,
                length: menuMessage.length,
                storeName: store.name
            }
        });

    } catch (error) {
        logger.error('Erro ao gerar preview do cardápio:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Webhook para receber mensagens do Telegram
 */
export const webhook = async (req, res) => {
    try {
        const update = req.body;

        // Log da mensagem recebida
        logger.info('Webhook Telegram recebido:', {
            updateId: update.update_id,
            messageId: update.message?.message_id,
            chatId: update.message?.chat?.id,
            text: update.message?.text?.substring(0, 100) // Primeiros 100 caracteres
        });

        // Processar mensagem se existir
        if (update.message && update.message.text) {
            const chatId = update.message.chat.id;
            const messageText = update.message.text;
            const userName = update.message.from.first_name || 'Usuário';

            // Verificar se o usuário tem permissão
            if (!telegramService.isUserAllowed(chatId)) {
                await telegramService.sendMessage(
                    chatId,
                    '🚫 Desculpe, você não tem permissão para usar este bot.'
                );
                return res.status(200).json({ ok: true });
            }

            // Processar comandos básicos
            if (messageText.startsWith('/start')) {
                const welcomeMessage = `👋 Olá ${userName}!\n\n` +
                    `🤖 Eu sou o Bot Liza, seu assistente de delivery!\n\n` +
                    `📋 Comandos disponíveis:\n` +
                    `• /menu - Ver cardápio\n` +
                    `• /help - Ajuda\n\n` +
                    `💬 Você também pode conversar naturalmente comigo!`;
                
                await telegramService.sendMessage(chatId, welcomeMessage);
            } else if (messageText.startsWith('/help')) {
                const helpMessage = `🆘 <b>Ajuda - Bot Liza</b>\n\n` +
                    `📋 <b>Comandos:</b>\n` +
                    `• /start - Iniciar conversa\n` +
                    `• /menu - Ver cardápio\n` +
                    `• /help - Esta ajuda\n\n` +
                    `💡 <b>Dicas:</b>\n` +
                    `• Converse naturalmente\n` +
                    `• Pergunte sobre produtos\n` +
                    `• Solicite informações\n\n` +
                    `🤖 Desenvolvido com IA Liza`;
                
                await telegramService.sendMessage(chatId, helpMessage);
            } else {
                // Para outras mensagens, resposta padrão por enquanto
                const response = `🤖 Obrigado pela mensagem, ${userName}!\n\n` +
                    `📝 Recebi: "${messageText}"\n\n` +
                    `⚙️ Em breve terei mais funcionalidades de IA para te ajudar melhor!\n\n` +
                    `💡 Use /menu para ver o cardápio ou /help para ajuda.`;
                
                await telegramService.sendMessage(chatId, response);
            }

            // Registrar conversa
            await telegramService.logConversation(
                chatId,
                messageText,
                'Resposta automática processada',
                null // storeId será determinado posteriormente
            );
        }

        res.status(200).json({ ok: true });

    } catch (error) {
        logger.error('Erro no webhook do Telegram:', error);
        res.status(500).json({ ok: false, error: error.message });
    }
};