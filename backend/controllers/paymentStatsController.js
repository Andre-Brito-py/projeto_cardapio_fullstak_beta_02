import orderModel from '../models/orderModel.js';

// Buscar estatísticas por método de pagamento
const getPaymentStats = async (req, res) => {
    try {
        const { storeId, startDate, endDate } = req.query;

        // Construir filtro base
        let matchFilter = {};
        
        if (storeId) {
            matchFilter.storeId = storeId;
        }

        // Filtro de data
        if (startDate || endDate) {
            matchFilter.date = {};
            if (startDate) {
                matchFilter.date.$gte = new Date(startDate);
            }
            if (endDate) {
                const endDateTime = new Date(endDate);
                endDateTime.setHours(23, 59, 59, 999);
                matchFilter.date.$lte = endDateTime;
            }
        }

        // Agregação para estatísticas por método de pagamento
        const stats = await orderModel.aggregate([
            {
                $match: matchFilter
            },
            {
                $group: {
                    _id: '$paymentMethod',
                    count: { $sum: 1 },
                    totalAmount: { $sum: '$amount' },
                    averageAmount: { $avg: '$amount' }
                }
            },
            {
                $project: {
                    _id: 1,
                    paymentMethod: '$_id',
                    count: 1,
                    totalAmount: { $round: ['$totalAmount', 2] },
                    averageAmount: { $round: ['$averageAmount', 2] }
                }
            },
            {
                $sort: { count: -1 }
            }
        ]);

        // Calcular totais
        const totalOrders = stats.reduce((sum, stat) => sum + stat.count, 0);
        const totalRevenue = stats.reduce((sum, stat) => sum + stat.totalAmount, 0);

        // Garantir que todos os métodos de pagamento estejam representados
        const paymentMethods = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao'];
        const completeStats = paymentMethods.map(method => {
            const existingStat = stats.find(stat => stat._id === method);
            return existingStat || {
                _id: method,
                paymentMethod: method,
                count: 0,
                totalAmount: 0,
                averageAmount: 0,
                percentage: 0
            };
        });

        // Recalcular percentuais para estatísticas completas
        completeStats.forEach(stat => {
            stat.percentage = totalOrders > 0 ? ((stat.count / totalOrders) * 100).toFixed(1) : 0;
        });

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
        console.error('Erro ao buscar estatísticas de pagamento:', error);
        res.json({
            success: false,
            message: 'Erro ao buscar estatísticas de pagamento'
        });
    }
};

export { getPaymentStats };