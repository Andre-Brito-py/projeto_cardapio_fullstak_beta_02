import express from 'express';
import axios from 'axios';
import { TelegramConfig } from '../models/telegramConfigModel.js';
import { TelegramContact } from '../models/telegramContactModel.js';
import { TelegramMessage } from '../models/telegramMessageModel.js';
import TelegramCampaign from '../models/telegramCampaignModel.js';
import authMiddleware from '../middleware/auth.js';

const telegramRouter = express.Router();

// Configuração do Bot
telegramRouter.get('/bot-config', authMiddleware, async (req, res) => {
  try {
    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    
    if (!config) {
      return res.json({ 
        success: true, 
        config: {
          token: '',
          webhookUrl: '',
          adminChatId: '',
          isActive: false
        }
      });
    }

    // Não retornar o token completo por segurança
    const safeConfig = {
      token: config.token ? config.token.substring(0, 10) + '...' : '',
      webhookUrl: config.webhookUrl,
      adminChatId: config.adminChatId,
      isActive: config.isActive
    };

    res.json({ success: true, config: safeConfig });
  } catch (error) {
    console.error('Erro ao carregar configuração do bot:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

telegramRouter.post('/bot-config', authMiddleware, async (req, res) => {
  try {
    const { token, webhookUrl, adminChatId, isActive } = req.body;

    if (!token || !token.trim()) {
      return res.status(400).json({ success: false, message: 'Token é obrigatório' });
    }

    let config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    
    if (config) {
      config.token = token;
      config.webhookUrl = webhookUrl;
      config.adminChatId = adminChatId;
      config.isActive = isActive;
      config.updatedAt = new Date();
    } else {
      config = new TelegramConfig({
        storeId: req.user.storeId,
        token,
        webhookUrl,
        adminChatId,
        isActive
      });
    }

    await config.save();

    res.json({ success: true, message: 'Configuração salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar configuração do bot:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Testar conexão do bot
telegramRouter.post('/test-bot', authMiddleware, async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Token é obrigatório' });
    }

    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    
    if (response.data.ok) {
      res.json({ 
        success: true, 
        botInfo: response.data.result,
        message: 'Bot conectado com sucesso'
      });
    } else {
      res.status(400).json({ success: false, message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Erro ao testar bot:', error);
    res.status(400).json({ success: false, message: 'Erro ao conectar com o bot' });
  }
});

// Listar contatos
telegramRouter.get('/contacts', authMiddleware, async (req, res) => {
  try {
    const contacts = await TelegramContact.find({ storeId: req.user.storeId })
      .sort({ lastInteraction: -1 });
    
    res.json({ success: true, contacts });
  } catch (error) {
    console.error('Erro ao carregar contatos:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Adicionar contato
telegramRouter.post('/clients', authMiddleware, async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, username, notes, tags, acceptsPromotions } = req.body;

    if (!firstName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'Nome e telefone são obrigatórios' });
    }

    const existingContact = await TelegramContact.findOne({
      storeId: req.user.storeId,
      phoneNumber
    });

    if (existingContact) {
      return res.status(400).json({ success: false, message: 'Contato já existe' });
    }

    const contact = new TelegramContact({
      storeId: req.user.storeId,
      firstName,
      lastName,
      phoneNumber,
      username,
      notes,
      tags: Array.isArray(tags) ? tags : [],
      acceptsPromotions: acceptsPromotions !== false,
      addedManually: true
    });

    await contact.save();

    res.json({ success: true, message: 'Contato adicionado com sucesso', contact });
  } catch (error) {
    console.error('Erro ao adicionar contato:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Listar campanhas
telegramRouter.get('/campaigns', authMiddleware, async (req, res) => {
  try {
    const campaigns = await TelegramCampaign.find({ createdBy: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error('Erro ao carregar campanhas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Criar campanha
telegramRouter.post('/campaigns', authMiddleware, async (req, res) => {
  try {
    const { name, description, type, message, targetCriteria, scheduledDate } = req.body;

    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Nome e mensagem são obrigatórios' });
    }

    const campaign = new TelegramCampaign({
      name,
      description,
      type,
      message,
      targetCriteria,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : null,
      createdBy: req.user._id
    });

    await campaign.save();
    await campaign.addExecutionLog('created', 'Campanha criada');

    res.json({ success: true, message: 'Campanha criada com sucesso', campaign });
  } catch (error) {
    console.error('Erro ao criar campanha:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Executar campanha
telegramRouter.post('/campaigns/:id/execute', authMiddleware, async (req, res) => {
  try {
    const campaign = await TelegramCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
    }

    if (campaign.status !== 'draft' && campaign.status !== 'scheduled') {
      return res.status(400).json({ success: false, message: 'Campanha não pode ser executada' });
    }

    // Buscar configuração do bot
    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    if (!config || !config.isActive) {
      return res.status(400).json({ success: false, message: 'Bot não configurado ou inativo' });
    }

    // Buscar contatos baseado nos critérios
    let contacts = [];
    const criteria = campaign.targetCriteria;
    
    if (criteria.allActive) {
      contacts = await TelegramContact.find({ 
        storeId: req.user.storeId,
        isActive: true 
      });
    } else if (criteria.specificClients && criteria.specificClients.length > 0) {
      contacts = await TelegramContact.find({
        storeId: req.user.storeId,
        chatId: { $in: criteria.specificClients }
      });
    } else if (criteria.tags && criteria.tags.length > 0) {
      contacts = await TelegramContact.find({
        storeId: req.user.storeId,
        tags: { $in: criteria.tags },
        isActive: true
      });
    } else if (criteria.inactiveDays) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - criteria.inactiveDays);
      
      contacts = await TelegramContact.find({
        storeId: req.user.storeId,
        lastInteraction: { $lt: cutoffDate },
        isActive: true
      });
    }

    if (criteria.acceptsPromotions) {
      contacts = contacts.filter(contact => contact.acceptsPromotions);
    }

    if (contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Nenhum contato encontrado para os critérios especificados' });
    }

    // Atualizar estatísticas da campanha
    campaign.stats.totalTargeted = contacts.length;
    campaign.status = 'sending';
    campaign.startedAt = new Date();
    await campaign.save();
    await campaign.addExecutionLog('started', `Iniciando envio para ${contacts.length} contatos`);

    // Iniciar processo de envio em background
    processCampaignSending(campaign, contacts, config.token);

    res.json({ 
      success: true, 
      message: `Campanha iniciada para ${contacts.length} contatos`,
      campaign 
    });
  } catch (error) {
    console.error('Erro ao executar campanha:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Pausar campanha
telegramRouter.post('/campaigns/:id/pause', authMiddleware, async (req, res) => {
  try {
    const campaign = await TelegramCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
    }

    if (campaign.status !== 'sending') {
      return res.status(400).json({ success: false, message: 'Campanha não está sendo executada' });
    }

    campaign.status = 'paused';
    await campaign.save();
    await campaign.addExecutionLog('paused', 'Campanha pausada pelo usuário');

    res.json({ success: true, message: 'Campanha pausada com sucesso' });
  } catch (error) {
    console.error('Erro ao pausar campanha:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Cancelar campanha
telegramRouter.post('/campaigns/:id/cancel', authMiddleware, async (req, res) => {
  try {
    const campaign = await TelegramCampaign.findById(req.params.id);
    
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campanha não encontrada' });
    }

    if (!['draft', 'scheduled', 'sending', 'paused'].includes(campaign.status)) {
      return res.status(400).json({ success: false, message: 'Campanha não pode ser cancelada' });
    }

    campaign.status = 'cancelled';
    await campaign.save();
    await campaign.addExecutionLog('cancelled', 'Campanha cancelada pelo usuário');

    res.json({ success: true, message: 'Campanha cancelada com sucesso' });
  } catch (error) {
    console.error('Erro ao cancelar campanha:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Estatísticas de campanhas
telegramRouter.get('/campaigns/stats', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const stats = await TelegramCampaign.getGeneralStats(
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null
    );

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Função para processar envio de campanha em background
async function processCampaignSending(campaign, contacts, botToken) {
  try {
    const sendInterval = campaign.settings.sendInterval || 1000;
    const maxRetries = campaign.settings.maxRetries || 3;
    let sentCount = 0;
    let failedCount = 0;
    
    for (const contact of contacts) {
      // Verificar se campanha foi pausada ou cancelada
      const updatedCampaign = await TelegramCampaign.findById(campaign._id);
      if (updatedCampaign.status === 'paused' || updatedCampaign.status === 'cancelled') {
        break;
      }

      let attempts = 0;
      let messageSent = false;
      
      while (attempts < maxRetries && !messageSent) {
        try {
          // Enviar mensagem via API do Telegram
          const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            chat_id: contact.chatId,
            text: campaign.message,
            parse_mode: 'HTML'
          });

          if (response.data.ok) {
            // Salvar mensagem no banco
            const message = new TelegramMessage({
              storeId: contact.storeId,
              chatId: contact.chatId,
              messageId: response.data.result.message_id,
              userId: contact.userId,
              messageType: 'campaign',
              direction: 'outgoing',
              content: campaign.message,
              status: 'sent',
              sentBy: campaign.createdBy,
              campaignId: campaign._id,
              sentAt: new Date()
            });
            
            await message.save();
            
            // Atualizar contato
            contact.lastInteraction = new Date();
            contact.stats.messagesSent += 1;
            await contact.save();
            
            sentCount++;
            messageSent = true;
          }
        } catch (error) {
          attempts++;
          console.error(`Erro ao enviar mensagem para ${contact.chatId} (tentativa ${attempts}):`, error.message);
          
          if (attempts >= maxRetries) {
            failedCount++;
            
            // Salvar mensagem com erro
            const message = new TelegramMessage({
              storeId: contact.storeId,
              chatId: contact.chatId,
              userId: contact.userId,
              messageType: 'campaign',
              direction: 'outgoing',
              content: campaign.message,
              status: 'failed',
              sentBy: campaign.createdBy,
              campaignId: campaign._id,
              error: {
                code: error.response?.status || 'UNKNOWN',
                message: error.message,
                details: error.response?.data
              }
            });
            
            await message.save();
          }
        }
        
        // Aguardar intervalo entre tentativas
        if (attempts < maxRetries && !messageSent) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      // Atualizar estatísticas da campanha
      await campaign.updateStats('totalSent', sentCount);
      await campaign.updateStats('totalFailed', failedCount);
      
      // Verificar taxa de falha
      const failureRate = failedCount / (sentCount + failedCount);
      if (failureRate > campaign.settings.pauseOnFailureRate) {
        campaign.status = 'failed';
        await campaign.save();
        await campaign.addExecutionLog('failed', `Campanha pausada devido a alta taxa de falha: ${(failureRate * 100).toFixed(2)}%`);
        break;
      }
      
      // Aguardar intervalo entre envios
      await new Promise(resolve => setTimeout(resolve, sendInterval));
    }
    
    // Finalizar campanha se não foi pausada/cancelada
    const finalCampaign = await TelegramCampaign.findById(campaign._id);
    if (finalCampaign.status === 'sending') {
      finalCampaign.status = 'sent';
      finalCampaign.completedAt = new Date();
      await finalCampaign.save();
      await finalCampaign.addExecutionLog('completed', `Campanha finalizada. Enviadas: ${sentCount}, Falhas: ${failedCount}`);
    }
    
  } catch (error) {
    console.error('Erro no processamento da campanha:', error);
    campaign.status = 'failed';
    await campaign.save();
    await campaign.addExecutionLog('failed', `Erro no processamento: ${error.message}`);
  }
}

// Enviar cardápio
telegramRouter.post('/send-menu', authMiddleware, async (req, res) => {
  try {
    const { contacts } = req.body;

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Selecione pelo menos um contato' });
    }

    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    
    if (!config || !config.token || !config.isActive) {
      return res.status(400).json({ success: false, message: 'Bot não configurado ou inativo' });
    }

    // Buscar cardápio atual (implementar lógica específica)
    const menuMessage = await generateMenuMessage(req.user.storeId);
    
    let sent = 0;
    const errors = [];

    for (const chatId of contacts) {
      try {
        await sendTelegramMessage(config.token, chatId, menuMessage);
        
        // Registrar mensagem enviada
        const message = new TelegramMessage({
          storeId: req.user.storeId,
          chatId,
          messageType: 'menu',
          content: menuMessage,
          status: 'sent',
          sentBy: req.user.id
        });
        await message.save();
        
        sent++;
      } catch (error) {
        console.error(`Erro ao enviar para ${chatId}:`, error);
        errors.push({ chatId, error: error.message });
      }
    }

    res.json({ 
      success: true, 
      sent, 
      errors: errors.length > 0 ? errors : undefined,
      message: `Cardápio enviado para ${sent} contatos`
    });
  } catch (error) {
    console.error('Erro ao enviar cardápio:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Enviar mensagem promocional
telegramRouter.post('/send-promotional', authMiddleware, async (req, res) => {
  try {
    const { message, contacts } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Mensagem é obrigatória' });
    }

    if (!contacts || contacts.length === 0) {
      return res.status(400).json({ success: false, message: 'Selecione pelo menos um contato' });
    }

    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    
    if (!config || !config.token || !config.isActive) {
      return res.status(400).json({ success: false, message: 'Bot não configurado ou inativo' });
    }

    let sent = 0;
    const errors = [];

    for (const chatId of contacts) {
      try {
        await sendTelegramMessage(config.token, chatId, message);
        
        // Registrar mensagem enviada
        const telegramMessage = new TelegramMessage({
          storeId: req.user.storeId,
          chatId,
          messageType: 'promotional',
          content: message,
          status: 'sent',
          sentBy: req.user.id
        });
        await telegramMessage.save();
        
        sent++;
      } catch (error) {
        console.error(`Erro ao enviar para ${chatId}:`, error);
        errors.push({ chatId, error: error.message });
      }
    }

    res.json({ 
      success: true, 
      sent, 
      errors: errors.length > 0 ? errors : undefined,
      message: `Mensagem enviada para ${sent} contatos`
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem promocional:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Estatísticas gerais
telegramRouter.get('/stats', authMiddleware, async (req, res) => {
  try {
    const totalContacts = await TelegramContact.countDocuments({ storeId: req.user.storeId });
    const activeContacts = await TelegramContact.countDocuments({ 
      storeId: req.user.storeId, 
      isActive: true 
    });
    
    const totalMessages = await TelegramMessage.countDocuments({ storeId: req.user.storeId });
    const todayMessages = await TelegramMessage.countDocuments({
      storeId: req.user.storeId,
      createdAt: { $gte: new Date().setHours(0, 0, 0, 0) }
    });
    
    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    
    // Estatísticas de campanhas
    const totalCampaigns = await TelegramCampaign.countDocuments({ createdBy: req.user._id });
    const activeCampaigns = await TelegramCampaign.countDocuments({ 
      createdBy: req.user._id,
      status: { $in: ['sending', 'scheduled'] }
    });
    
    // Estatísticas de mensagens por período
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    
    const weeklyStats = await TelegramMessage.getMessageStats(
      req.user.storeId,
      last7Days,
      new Date()
    );
    
    res.json({
      success: true,
      stats: {
        totalContacts,
        activeContacts,
        totalMessages,
        todayMessages,
        totalCampaigns,
        activeCampaigns,
        botStatus: config?.isActive ? 'active' : 'inactive',
        weeklyStats: weeklyStats[0] || {
          total: 0,
          sent: 0,
          delivered: 0,
          read: 0,
          failed: 0,
          opened: 0,
          clicked: 0,
          converted: 0
        }
      }
    });
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Histórico de mensagens
telegramRouter.get('/messages', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 50, chatId, messageType, direction, status } = req.query;
    
    const query = { storeId: req.user.storeId };
    
    if (chatId) query.chatId = chatId;
    if (messageType) query.messageType = messageType;
    if (direction) query.direction = direction;
    if (status) query.status = status;
    
    const messages = await TelegramMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('campaignId', 'name type')
      .populate('sentBy', 'name email');
    
    const total = await TelegramMessage.countDocuments(query);
    
    res.json({
      success: true,
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Detalhes de uma mensagem específica
telegramRouter.get('/messages/:id', authMiddleware, async (req, res) => {
  try {
    const message = await TelegramMessage.findById(req.params.id)
      .populate('campaignId', 'name type description')
      .populate('sentBy', 'name email');
    
    if (!message || message.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(404).json({ success: false, message: 'Mensagem não encontrada' });
    }
    
    res.json({ success: true, message });
  } catch (error) {
    console.error('Erro ao carregar mensagem:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Reenviar mensagem falhada
telegramRouter.post('/messages/:id/retry', authMiddleware, async (req, res) => {
  try {
    const message = await TelegramMessage.findById(req.params.id);
    
    if (!message || message.storeId.toString() !== req.user.storeId.toString()) {
      return res.status(404).json({ success: false, message: 'Mensagem não encontrada' });
    }
    
    if (!message.canRetry()) {
      return res.status(400).json({ success: false, message: 'Mensagem não pode ser reenviada' });
    }
    
    const config = await TelegramConfig.findOne({ storeId: req.user.storeId });
    if (!config || !config.isActive) {
      return res.status(400).json({ success: false, message: 'Bot não configurado ou inativo' });
    }
    
    try {
      const response = await axios.post(`https://api.telegram.org/bot${config.token}/sendMessage`, {
        chat_id: message.chatId,
        text: message.content,
        parse_mode: 'HTML'
      });
      
      if (response.data.ok) {
        message.status = 'sent';
        message.sentAt = new Date();
        message.messageId = response.data.result.message_id;
        message.error = undefined;
        await message.save();
        
        res.json({ success: true, message: 'Mensagem reenviada com sucesso' });
      } else {
        await message.incrementAttempt();
        message.error = {
          code: 'API_ERROR',
          message: 'Erro na API do Telegram',
          details: response.data
        };
        await message.save();
        
        res.status(400).json({ success: false, message: 'Falha ao reenviar mensagem' });
      }
    } catch (error) {
      await message.incrementAttempt();
      message.error = {
        code: error.response?.status || 'NETWORK_ERROR',
        message: error.message,
        details: error.response?.data
      };
      await message.save();
      
      res.status(400).json({ success: false, message: 'Erro ao reenviar mensagem' });
    }
  } catch (error) {
    console.error('Erro ao reenviar mensagem:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Preview do cardápio
telegramRouter.get('/menu-preview', authMiddleware, async (req, res) => {
  try {
    const menuPreview = await generateMenuMessage(req.user.storeId);
    res.json({ success: true, preview: menuPreview });
  } catch (error) {
    console.error('Erro ao gerar preview do cardápio:', error);
    res.status(500).json({ success: false, message: 'Erro interno do servidor' });
  }
});

// Funções auxiliares
async function sendTelegramMessage(token, chatId, message) {
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  
  const response = await axios.post(url, {
    chat_id: chatId,
    text: message,
    parse_mode: 'HTML'
  });

  if (!response.data.ok) {
    throw new Error(response.data.description || 'Erro ao enviar mensagem');
  }

  return response.data;
}

async function generateMenuMessage(storeId) {
  // Implementar lógica para gerar mensagem do cardápio
  // Por enquanto, retorna uma mensagem padrão
  return `🍽️ <b>Cardápio Atualizado!</b>\n\n` +
         `Confira nossos deliciosos pratos:\n\n` +
         `🍕 Pizza Margherita - R$ 25,00\n` +
         `🍔 Hambúrguer Artesanal - R$ 18,00\n` +
         `🍝 Espaguete à Bolonhesa - R$ 22,00\n\n` +
         `📱 Faça seu pedido pelo nosso app!\n` +
         `🚚 Entrega rápida em toda a cidade`;
}

export default telegramRouter;