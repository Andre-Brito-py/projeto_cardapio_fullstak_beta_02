import express from 'express';
import lizaService from '../services/lizaIntegrationService.js';
import Order from '../models/orderModel.js';
import Food from '../models/foodModel.js';
import authMiddleware from '../middleware/auth.js';

const lizaRouter = express.Router();

// Rota para chat com a Liza
lizaRouter.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { message, context = 'admin_panel' } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, message: 'Mensagem é obrigatória' });
    }

    // Processar mensagem com a Liza
    const response = await lizaService.processMessage({
      text: message,
      from: req.user.id,
      context: context,
      timestamp: new Date()
    });

    res.json({
      success: true,
      response: response.text || response.message || 'Desculpe, não consegui processar sua mensagem.',
      context: response.context
    });

  } catch (error) {
    console.error('Erro no chat com Liza:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      response: 'Desculpe, estou com dificuldades técnicas no momento. Tente novamente em alguns instantes.'
    });
  }
});

// Rota para relatório diário
lizaRouter.get('/daily-report', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Buscar pedidos do dia
    const todayOrders = await Order.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['delivered', 'completed'] }
    }).populate('items.food');

    // Calcular estatísticas
    const completedOrders = todayOrders.length;
    const totalRevenue = todayOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
    const averageTicket = completedOrders > 0 ? totalRevenue / completedOrders : 0;

    // Encontrar produto mais vendido
    const productSales = {};
    todayOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productName = item.food?.name || item.name || 'Produto desconhecido';
          const quantity = item.quantity || 1;
          productSales[productName] = (productSales[productName] || 0) + quantity;
        });
      }
    });

    const topProduct = Object.keys(productSales).length > 0 
      ? Object.keys(productSales).reduce((a, b) => productSales[a] > productSales[b] ? a : b)
      : 'Nenhum produto vendido';

    const topProductQuantity = productSales[topProduct] || 0;

    // Dados adicionais
    const pendingOrders = await Order.countDocuments({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      },
      status: { $in: ['pending', 'preparing', 'ready'] }
    });

    const report = {
      date: today.toISOString().split('T')[0],
      completedOrders,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageTicket: Math.round(averageTicket * 100) / 100,
      topProduct: topProductQuantity > 0 ? `${topProduct} (${topProductQuantity}x)` : topProduct,
      productSales,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      report
    });

  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório diário'
    });
  }
});

// Rota para enviar relatório automático
lizaRouter.post('/send-daily-report', authMiddleware, async (req, res) => {
  try {
    // Buscar relatório do dia
    const reportResponse = await fetch(`${req.protocol}://${req.get('host')}/api/liza/daily-report`, {
      headers: {
        'Authorization': req.headers.authorization
      }
    });
    
    if (!reportResponse.ok) {
      throw new Error('Erro ao buscar relatório');
    }
    
    const { report } = await reportResponse.json();
    
    // Formatar mensagem do relatório
    const reportMessage = `📊 **Resumo Diário - ${new Date().toLocaleDateString('pt-BR')}**\n\n` +
                         `🛍️ **Pedidos Concluídos:** ${report.completedOrders}\n` +
                         `⏳ **Pedidos Pendentes:** ${report.pendingOrders}\n` +
                         `💰 **Faturamento Total:** R$ ${report.totalRevenue.toFixed(2)}\n` +
                         `🎯 **Ticket Médio:** R$ ${report.averageTicket.toFixed(2)}\n` +
                         `🏆 **Produto Mais Vendido:** ${report.topProduct}\n\n` +
                         `📈 **Performance:** ${report.completedOrders > 0 ? 'Ativo' : 'Sem vendas'}\n` +
                         `🕐 **Gerado às:** ${new Date().toLocaleTimeString('pt-BR')}`;

    // Aqui você pode integrar com WhatsApp, email, etc.
    // Por enquanto, apenas retornamos a mensagem formatada
    
    res.json({
      success: true,
      message: 'Relatório gerado com sucesso',
      report,
      formattedMessage: reportMessage
    });

  } catch (error) {
    console.error('Erro ao enviar relatório diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao enviar relatório diário'
    });
  }
});

// Rota para configurar relatório automático
lizaRouter.post('/schedule-daily-report', authMiddleware, async (req, res) => {
  try {
    const { time = '18:00', enabled = true } = req.body;
    
    // Aqui você implementaria a lógica de agendamento
    // Por exemplo, usando node-cron ou similar
    
    res.json({
      success: true,
      message: 'Relatório diário configurado',
      schedule: {
        time,
        enabled,
        nextExecution: 'Calculado baseado no horário configurado'
      }
    });

  } catch (error) {
    console.error('Erro ao configurar relatório automático:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao configurar relatório automático'
    });
  }
});

// Rota para histórico de relatórios
lizaRouter.get('/reports-history', authMiddleware, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(days));

    const reports = [];
    
    // Gerar relatórios para cada dia no período
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
      
      const dayOrders = await Order.find({
        createdAt: {
          $gte: dayStart,
          $lt: dayEnd
        },
        status: { $in: ['delivered', 'completed'] }
      });
      
      const dayRevenue = dayOrders.reduce((sum, order) => sum + (order.amount || 0), 0);
      
      reports.push({
        date: dayStart.toISOString().split('T')[0],
        completedOrders: dayOrders.length,
        totalRevenue: Math.round(dayRevenue * 100) / 100,
        averageTicket: dayOrders.length > 0 ? Math.round((dayRevenue / dayOrders.length) * 100) / 100 : 0
      });
    }

    res.json({
      success: true,
      reports: reports.reverse() // Mais recente primeiro
    });

  } catch (error) {
    console.error('Erro ao buscar histórico de relatórios:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar histórico de relatórios'
    });
  }
});

export default lizaRouter;