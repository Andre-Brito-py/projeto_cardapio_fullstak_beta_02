import orderModel from '../models/orderModel.js';

// Obter estatísticas de saídas por tipo de entrega
const getDeliveryStats = async (req, res) => {
    try {
        // Filter by store in multi-tenant context
        const storeId = req.store ? req.store._id : null;
        const baseQuery = storeId ? { storeId: storeId } : {};
        
        // Get date range from query parameters (optional)
        const { startDate, endDate } = req.query;
        let dateQuery = {};
        
        if (startDate || endDate) {
            dateQuery.date = {};
            if (startDate) {
                dateQuery.date.$gte = new Date(startDate);
            }
            if (endDate) {
                dateQuery.date.$lte = new Date(endDate);
            }
        }
        
        const query = { ...baseQuery, ...dateQuery };
        
        // Aggregate statistics by delivery type
        const stats = await orderModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: '$deliveryType',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    averageAmount: { $avg: '$amount' }
                }
            },
            {
                $project: {
                    deliveryType: '$_id',
                    count: 1,
                    totalAmount: { $round: ['$totalAmount', 2] },
                    averageAmount: { $round: ['$averageAmount', 2] },
                    _id: 0
                }
            }
        ]);
        
        // Get total orders for percentage calculation
        const totalOrders = await orderModel.countDocuments(query);
        
        // Add percentage to each stat
        const statsWithPercentage = stats.map(stat => ({
            ...stat,
            percentage: totalOrders > 0 ? Math.round((stat.count / totalOrders) * 100) : 0
        }));
        
        // Ensure all delivery types are represented
        const deliveryTypes = ['delivery', 'waiter', 'in_person'];
        const completeStats = deliveryTypes.map(type => {
            const existingStat = statsWithPercentage.find(s => s.deliveryType === type);
            return existingStat || {
                deliveryType: type,
                count: 0,
                totalAmount: 0,
                averageAmount: 0,
                percentage: 0
            };
        });
        
        // Calculate total revenue
        const totalRevenue = completeStats.reduce((sum, stat) => sum + stat.totalAmount, 0);
        
        res.json({
            success: true,
            data: {
                stats: completeStats,
                totalOrders,
                totalRevenue,
                dateRange: { startDate, endDate }
            }
    });
    } catch (error) {
        console.error('Erro ao buscar estatísticas de entrega:', error);
        res.json({ success: false, message: 'Erro ao buscar estatísticas', details: error.message });
    }
};

// Obter pedidos filtrados por tipo de entrega
const getOrdersByDeliveryType = async (req, res) => {
    try {
        // Filter by store in multi-tenant context
        const storeId = req.store ? req.store._id : null;
        const baseQuery = storeId ? { storeId: storeId } : {};
        
        const { deliveryType, startDate, endDate, page = 1, limit = 20 } = req.query;
        
        let query = { ...baseQuery };
        
        // Filter by delivery type if specified
        if (deliveryType && ['delivery', 'waiter', 'in_person'].includes(deliveryType)) {
            query.deliveryType = deliveryType;
        }
        
        // Add date range filter if specified
        if (startDate || endDate) {
            query.date = {};
            if (startDate) {
                query.date.$gte = new Date(startDate);
            }
            if (endDate) {
                query.date.$lte = new Date(endDate);
            }
        }
        
        // Calculate pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        // Get orders with pagination
        const orders = await orderModel.find(query)
            .populate('tableId', 'tableNumber displayName')
            .sort({ date: -1 })
            .skip(skip)
            .limit(parseInt(limit));
        
        // Get total count for pagination
        const totalCount = await orderModel.countDocuments(query);
        const totalPages = Math.ceil(totalCount / parseInt(limit));
        
        res.json({
            success: true,
            data: {
                orders,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalCount,
                    hasNext: parseInt(page) < totalPages,
                    hasPrev: parseInt(page) > 1
                }
            }
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos por tipo de entrega:', error);
        res.json({ success: false, message: 'Erro ao buscar pedidos', details: error.message });
    }
};

// Obter resumo diário de saídas
const getDailyDeliveryStats = async (req, res) => {
    try {
        // Filter by store in multi-tenant context
        const storeId = req.store ? req.store._id : null;
        const baseQuery = storeId ? { storeId: storeId } : {};
        
        const { days = 7 } = req.query; // Default to last 7 days
        
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(days));
        startDate.setHours(0, 0, 0, 0);
        
        const query = {
            ...baseQuery,
            date: { $gte: startDate }
        };
        
        const dailyStats = await orderModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        date: {
                            $dateToString: {
                                format: '%Y-%m-%d',
                                date: '$date'
                            }
                        },
                        deliveryType: '$deliveryType'
                    },
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $group: {
                    _id: '$_id.date',
                    deliveryTypes: {
                        $push: {
                            type: '$_id.deliveryType',
                            count: '$count',
                            totalAmount: '$totalAmount'
                        }
                    },
                    totalOrders: { $sum: '$count' },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                dailyStats,
                period: `${days} dias`
            }
        });
    } catch (error) {
        console.error('Erro ao buscar estatísticas diárias:', error);
        res.json({ success: false, message: 'Erro ao buscar estatísticas diárias', details: error.message });
    }
};

export {
    getDeliveryStats,
    getOrdersByDeliveryType,
    getDailyDeliveryStats
};