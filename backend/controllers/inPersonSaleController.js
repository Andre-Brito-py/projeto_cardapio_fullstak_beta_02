import inPersonSaleModel from '../models/inPersonSaleModel.js';
import foodModel from '../models/foodModel.js';
import mongoose from 'mongoose';

// Adicionar nova venda presencial
const addInPersonSale = async (req, res) => {
    try {
        const { items, total, notes } = req.body;
        const storeId = req.storeId;
        const createdBy = req.userId;

        // Validar dados obrigatórios
        if (!items || !Array.isArray(items) || items.length === 0) {
            return res.json({
                success: false,
                message: 'Items são obrigatórios e devem ser um array não vazio'
            });
        }

        if (!total || total <= 0) {
            return res.json({
                success: false,
                message: 'Total deve ser maior que zero'
            });
        }

        // Validar se todos os produtos existem e pertencem à loja
        const productIds = items.map(item => item.productId);
        const products = await foodModel.find({
            _id: { $in: productIds },
            storeId: storeId
        });

        if (products.length !== productIds.length) {
            return res.json({
                success: false,
                message: 'Um ou mais produtos não foram encontrados ou não pertencem a esta loja'
            });
        }

        // Validar preços e quantidades
        for (const item of items) {
            const product = products.find(p => p._id.toString() === item.productId);
            if (!product) {
                return res.json({
                    success: false,
                    message: `Produto ${item.name} não encontrado`
                });
            }

            if (item.price !== product.price) {
                return res.json({
                    success: false,
                    message: `Preço do produto ${item.name} não confere`
                });
            }

            if (!item.quantity || item.quantity <= 0) {
                return res.json({
                    success: false,
                    message: `Quantidade do produto ${item.name} deve ser maior que zero`
                });
            }
        }

        // Calcular total esperado
        const expectedTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (Math.abs(expectedTotal - total) > 0.01) { // Tolerância para arredondamento
            return res.json({
                success: false,
                message: 'Total calculado não confere com o total informado'
            });
        }

        // Criar nova venda presencial
        const newSale = new inPersonSaleModel({
            storeId,
            items,
            total,
            notes: notes || '',
            createdBy
        });

        await newSale.save();

        res.json({
            success: true,
            message: 'Venda presencial registrada com sucesso',
            data: newSale
        });

    } catch (error) {
        console.error('Erro ao adicionar venda presencial:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter histórico de vendas presenciais
const getInPersonSalesHistory = async (req, res) => {
    try {
        const storeId = req.storeId;
        const { page = 1, limit = 50, startDate, endDate } = req.query;

        // Construir filtros
        const filters = { storeId };

        if (startDate || endDate) {
            filters.date = {};
            if (startDate) {
                filters.date.$gte = new Date(startDate);
            }
            if (endDate) {
                filters.date.$lte = new Date(endDate);
            }
        }

        // Buscar vendas com paginação
        const sales = await inPersonSaleModel
            .find(filters)
            .populate('createdBy', 'name email')
            .populate('items.productId', 'name category')
            .sort({ date: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        // Contar total de registros
        const total = await inPersonSaleModel.countDocuments(filters);

        res.json({
            success: true,
            data: sales,
            pagination: {
                current: page,
                pages: Math.ceil(total / limit),
                total
            }
        });

    } catch (error) {
        console.error('Erro ao buscar histórico de vendas:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter estatísticas de vendas presenciais
const getInPersonSalesStats = async (req, res) => {
    try {
        const storeId = req.storeId;
        const { period = 'month' } = req.query;

        let startDate;
        const endDate = new Date();

        // Definir período
        switch (period) {
            case 'day':
                startDate = new Date();
                startDate.setHours(0, 0, 0, 0);
                break;
            case 'week':
                startDate = new Date();
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'month':
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'year':
                startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - 1);
                break;
            default:
                startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
        }

        // Agregação para estatísticas
        const stats = await inPersonSaleModel.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    date: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: null,
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageTicket: { $avg: '$total' },
                    totalItems: { $sum: { $sum: '$items.quantity' } }
                }
            }
        ]);

        // Produtos mais vendidos
        const topProducts = await inPersonSaleModel.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    date: { $gte: startDate, $lte: endDate },
                    status: 'completed'
                }
            },
            { $unwind: '$items' },
            {
                $group: {
                    _id: '$items.productId',
                    name: { $first: '$items.name' },
                    totalQuantity: { $sum: '$items.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
                }
            },
            { $sort: { totalQuantity: -1 } },
            { $limit: 10 }
        ]);

        // Vendas por dia (últimos 30 dias)
        const dailySales = await inPersonSaleModel.aggregate([
            {
                $match: {
                    storeId: new mongoose.Types.ObjectId(storeId),
                    date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$date' },
                        month: { $month: '$date' },
                        day: { $dayOfMonth: '$date' }
                    },
                    totalSales: { $sum: 1 },
                    totalRevenue: { $sum: '$total' }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
        ]);

        const result = {
            period,
            summary: stats[0] || {
                totalSales: 0,
                totalRevenue: 0,
                averageTicket: 0,
                totalItems: 0
            },
            topProducts,
            dailySales
        };

        res.json({
            success: true,
            data: result
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Cancelar venda presencial
const cancelInPersonSale = async (req, res) => {
    try {
        const { saleId } = req.params;
        const storeId = req.storeId;

        // Buscar venda
        const sale = await inPersonSaleModel.findOne({
            _id: saleId,
            storeId: storeId
        });

        if (!sale) {
            return res.json({
                success: false,
                message: 'Venda não encontrada'
            });
        }

        if (sale.status === 'cancelled') {
            return res.json({
                success: false,
                message: 'Venda já foi cancelada'
            });
        }

        // Atualizar status
        sale.status = 'cancelled';
        await sale.save();

        res.json({
            success: true,
            message: 'Venda cancelada com sucesso',
            data: sale
        });

    } catch (error) {
        console.error('Erro ao cancelar venda:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Obter detalhes de uma venda específica
const getInPersonSaleById = async (req, res) => {
    try {
        const { saleId } = req.params;
        const storeId = req.storeId;

        const sale = await inPersonSaleModel
            .findOne({
                _id: saleId,
                storeId: storeId
            })
            .populate('createdBy', 'name email')
            .populate('items.productId', 'name category image')
            .exec();

        if (!sale) {
            return res.json({
                success: false,
                message: 'Venda não encontrada'
            });
        }

        res.json({
            success: true,
            data: sale
        });

    } catch (error) {
        console.error('Erro ao buscar venda:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export {
    addInPersonSale,
    getInPersonSalesHistory,
    getInPersonSalesStats,
    cancelInPersonSale,
    getInPersonSaleById
};