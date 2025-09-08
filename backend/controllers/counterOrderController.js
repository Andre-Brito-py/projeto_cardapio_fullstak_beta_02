import orderModel from '../models/orderModel.js';
import foodModel from '../models/foodModel.js';
import CounterAttendant from '../models/counterAttendantModel.js';
import Store from '../models/storeModel.js';

// Criar pedido presencial no balcão
const createInPersonOrder = async (req, res) => {
    try {
        const { items, customerName, customerPhone, paymentMethod, observations, discount } = req.body;
        const storeId = req.user.storeId;
        const attendantId = req.user.id;
        
        // Validar itens do pedido
        if (!items || items.length === 0) {
            return res.json({ success: false, message: "Pedido deve conter pelo menos um item" });
        }
        
        // Calcular valor total do pedido
        let totalAmount = 0;
        const validatedItems = [];
        
        for (const item of items) {
            // Buscar produto no banco de dados
            const product = await foodModel.findById(item._id);
            if (!product) {
                return res.json({ success: false, message: `Produto ${item.name} não encontrado` });
            }
            
            // Calcular preço do item incluindo extras
            let itemPrice = product.price;
            let itemExtras = [];
            
            if (item.extras && item.extras.length > 0) {
                for (const extra of item.extras) {
                    itemPrice += extra.price;
                    itemExtras.push({
                        name: extra.name,
                        price: extra.price
                    });
                }
            }
            
            const itemTotal = itemPrice * item.quantity;
            totalAmount += itemTotal;
            
            validatedItems.push({
                _id: product._id,
                name: product.name,
                price: product.price,
                quantity: item.quantity,
                extras: itemExtras,
                observations: item.observations || '',
                image: product.image,
                category: product.category
            });
        }
        
        // Aplicar desconto se fornecido
        const discountAmount = discount && discount > 0 ? discount : 0;
        const finalAmount = Math.max(0, totalAmount - discountAmount);
        
        // Criar dados do pedido
        const orderData = {
            storeId: storeId,
            items: validatedItems,
            amount: finalAmount,
            originalAmount: totalAmount,
            discountAmount: discountAmount,
            deliveryType: 'in_person', // Tipo específico para balcão
            orderType: 'in_person',
            paymentMethod: paymentMethod || 'dinheiro',
            status: 'Food Processing', // Pedido já confirmado
            payment: true, // Pagamento já realizado no balcão
            
            // Informações do cliente (opcionais para balcão)
            customerInfo: {
                name: customerName || 'Cliente Balcão',
                phone: customerPhone || null
            },
            
            // Informações do atendente
            attendantId: attendantId,
            attendantName: req.user.name,
            
            // Observações gerais
            observations: observations || '',
            
            // Dados de entrega (não aplicável para balcão)
            address: null,
            shipping: {
                fee: 0,
                calculatedBy: 'counter'
            },
            
            // Data de criação
            date: new Date()
        };
        
        // Criar o pedido
        const newOrder = new orderModel(orderData);
        await newOrder.save();
        
        // Incrementar contador de pedidos do atendente
        await CounterAttendant.findByIdAndUpdate(
            attendantId,
            { $inc: { totalOrdersCreated: 1 } }
        );
        
        res.json({
            success: true,
            message: "Pedido criado com sucesso",
            order: {
                id: newOrder._id,
                orderNumber: newOrder._id.toString().slice(-6).toUpperCase(),
                items: newOrder.items,
                amount: newOrder.amount,
                paymentMethod: newOrder.paymentMethod,
                customerName: customerName || 'Cliente Balcão',
                createdAt: newOrder.date
            }
        });
        
    } catch (error) {
        console.error('Erro ao criar pedido presencial:', error);
        res.json({ success: false, message: "Erro ao criar pedido", details: error.message });
    }
};

// Listar pedidos do balcão (do dia atual)
const getTodayCounterOrders = async (req, res) => {
    try {
        const storeId = req.user.storeId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const orders = await orderModel.find({
            storeId: storeId,
            deliveryType: 'in_person',
            date: {
                $gte: today,
                $lt: tomorrow
            }
        })
        .sort({ date: -1 })
        .populate('attendantId', 'name')
        .limit(50);
        
        // Calcular estatísticas do dia
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + order.amount, 0);
        const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
        
        // Agrupar por método de pagamento
        const paymentStats = orders.reduce((stats, order) => {
            const method = order.paymentMethod || 'não_informado';
            if (!stats[method]) {
                stats[method] = { count: 0, total: 0 };
            }
            stats[method].count++;
            stats[method].total += order.amount;
            return stats;
        }, {});
        
        res.json({
            success: true,
            orders: orders.map(order => ({
                id: order._id,
                orderNumber: order._id.toString().slice(-6).toUpperCase(),
                items: order.items,
                amount: order.amount,
                paymentMethod: order.paymentMethod,
                customerName: order.customerInfo?.name || 'Cliente Balcão',
                attendantName: order.attendantName,
                status: order.status,
                createdAt: order.date,
                observations: order.observations
            })),
            stats: {
                totalOrders,
                totalRevenue,
                averageTicket,
                paymentStats
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar pedidos do balcão:', error);
        res.json({ success: false, message: "Erro ao buscar pedidos" });
    }
};

// Buscar produtos disponíveis para o balcão
const getAvailableProducts = async (req, res) => {
    try {
        const storeId = req.user.storeId;
        
        const products = await foodModel.find({ 
            storeId: storeId,
            isAvailable: true 
        })
        .populate('category', 'name')
        .sort({ category: 1, name: 1 });
        
        // Agrupar produtos por categoria
        const productsByCategory = products.reduce((grouped, product) => {
            const categoryName = product.category?.name || 'Sem Categoria';
            if (!grouped[categoryName]) {
                grouped[categoryName] = [];
            }
            grouped[categoryName].push({
                _id: product._id,
                name: product.name,
                price: product.price,
                image: product.image,
                description: product.description,
                extras: product.extras || []
            });
            return grouped;
        }, {});
        
        res.json({
            success: true,
            products: productsByCategory
        });
        
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.json({ success: false, message: "Erro ao buscar produtos" });
    }
};

// Atualizar status do pedido
const updateOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;
        
        const validStatuses = ['Food Processing', 'Ready for Pickup', 'Delivered', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: "Status inválido" });
        }
        
        const order = await orderModel.findOneAndUpdate(
            { 
                _id: orderId, 
                storeId: req.user.storeId,
                deliveryType: 'in_person'
            },
            { status: status },
            { new: true }
        );
        
        if (!order) {
            return res.json({ success: false, message: "Pedido não encontrado" });
        }
        
        res.json({
            success: true,
            message: "Status atualizado com sucesso",
            order: {
                id: order._id,
                status: order.status
            }
        });
        
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.json({ success: false, message: "Erro ao atualizar status" });
    }
};

// Obter estatísticas do atendente
const getAttendantStats = async (req, res) => {
    try {
        const attendantId = req.user.id;
        const storeId = req.user.storeId;
        
        // Estatísticas do dia atual
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayOrders = await orderModel.find({
            storeId: storeId,
            attendantId: attendantId,
            deliveryType: 'in_person',
            date: { $gte: today, $lt: tomorrow }
        });
        
        // Estatísticas do mês atual
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const monthOrders = await orderModel.find({
            storeId: storeId,
            attendantId: attendantId,
            deliveryType: 'in_person',
            date: { $gte: startOfMonth }
        });
        
        const todayStats = {
            totalOrders: todayOrders.length,
            totalRevenue: todayOrders.reduce((sum, order) => sum + order.amount, 0),
            averageTicket: todayOrders.length > 0 ? 
                todayOrders.reduce((sum, order) => sum + order.amount, 0) / todayOrders.length : 0
        };
        
        const monthStats = {
            totalOrders: monthOrders.length,
            totalRevenue: monthOrders.reduce((sum, order) => sum + order.amount, 0),
            averageTicket: monthOrders.length > 0 ? 
                monthOrders.reduce((sum, order) => sum + order.amount, 0) / monthOrders.length : 0
        };
        
        res.json({
            success: true,
            stats: {
                today: todayStats,
                month: monthStats,
                attendantName: req.user.name
            }
        });
        
    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.json({ success: false, message: "Erro ao buscar estatísticas" });
    }
};

export {
    createInPersonOrder,
    getTodayCounterOrders,
    getAvailableProducts,
    updateOrderStatus,
    getAttendantStats
};