import express from 'express';
import Order from '../models/orderModel.js';
import Food from '../models/foodModel.js';
import authMiddleware from '../middleware/auth.js';

const reportRouter = express.Router();

// Rota para relatório diário
reportRouter.get('/daily', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    // Buscar pedidos do dia
    const todayOrders = await Order.find({
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    }).populate('items.food');

    // Filtrar pedidos concluídos
    const completedOrders = todayOrders.filter(order => 
      ['delivered', 'completed', 'finalizado'].includes(order.status)
    );

    // Calcular estatísticas
    const completedCount = completedOrders.length;
    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + (order.amount || order.total || 0);
    }, 0);
    
    const averageTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

    // Encontrar produto mais vendido
    const productSales = {};
    completedOrders.forEach(order => {
      if (order.items && Array.isArray(order.items)) {
        order.items.forEach(item => {
          const productName = item.food?.name || item.name || 'Produto desconhecido';
          const quantity = item.quantity || 1;
          productSales[productName] = (productSales[productName] || 0) + quantity;
        });
      }
    });

    let topProduct = 'Nenhum produto vendido';
    let maxQuantity = 0;
    
    Object.entries(productSales).forEach(([product, quantity]) => {
      if (quantity > maxQuantity) {
        maxQuantity = quantity;
        topProduct = `${product} (${quantity}x)`;
      }
    });

    // Pedidos pendentes
    const pendingOrders = todayOrders.filter(order => 
      ['pending', 'preparing', 'ready', 'em_preparo', 'pendente'].includes(order.status)
    ).length;

    const report = {
      date: today.toISOString().split('T')[0],
      completedOrders: completedCount,
      pendingOrders,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageTicket: Math.round(averageTicket * 100) / 100,
      topProduct,
      productSales,
      totalOrders: todayOrders.length,
      generatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      ...report
    });

  } catch (error) {
    console.error('Erro ao gerar relatório diário:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório diário',
      completedOrders: 0,
      totalRevenue: 0,
      averageTicket: 0,
      topProduct: 'Erro ao carregar dados'
    });
  }
});

// Rota para relatório semanal
reportRouter.get('/weekly', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weekOrders = await Order.find({
      createdAt: {
        $gte: weekAgo,
        $lt: today
      }
    }).populate('items.food');

    const completedOrders = weekOrders.filter(order => 
      ['delivered', 'completed', 'finalizado'].includes(order.status)
    );

    const totalRevenue = completedOrders.reduce((sum, order) => {
      return sum + (order.amount || order.total || 0);
    }, 0);

    res.json({
      success: true,
      period: 'weekly',
      completedOrders: completedOrders.length,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      averageTicket: completedOrders.length > 0 ? Math.round((totalRevenue / completedOrders.length) * 100) / 100 : 0,
      totalOrders: weekOrders.length
    });

  } catch (error) {
    console.error('Erro ao gerar relatório semanal:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório semanal'
    });
  }
});

// Rota para estatísticas rápidas
reportRouter.get('/quick-stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Pedidos de hoje
    const todayOrdersCount = await Order.countDocuments({
      createdAt: { $gte: startOfDay }
    });
    
    // Pedidos pendentes
    const pendingOrdersCount = await Order.countDocuments({
      status: { $in: ['pending', 'preparing', 'ready', 'em_preparo', 'pendente'] }
    });
    
    // Total de produtos cadastrados
    const totalProducts = await Food.countDocuments({ available: true });
    
    res.json({
      success: true,
      todayOrders: todayOrdersCount,
      pendingOrders: pendingOrdersCount,
      totalProducts,
      lastUpdate: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar estatísticas rápidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

export default reportRouter;