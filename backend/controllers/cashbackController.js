import cashbackModel from '../models/cashbackModel.js';
import cashbackTransactionModel from '../models/cashbackTransactionModel.js';
import customerModel from '../models/customerModel.js';
import orderModel from '../models/orderModel.js';
import foodModel from '../models/foodModel.js';

// Obter configurações de cashback da loja
const getCashbackConfig = async (req, res) => {
    try {
        const storeId = req.store._id;
        
        let config = await cashbackModel.findOne({ storeId });
        
        if (!config) {
            // Criar configuração padrão se não existir
            config = await cashbackModel.createDefaultConfig(storeId);
        }
        
        res.json({ success: true, config });
    } catch (error) {
        console.error('Erro ao obter configuração de cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Atualizar configurações de cashback da loja
const updateCashbackConfig = async (req, res) => {
    try {
        const storeId = req.store._id;
        const updateData = req.body;
        
        // Validações
        if (updateData.globalPercentage && (updateData.globalPercentage < 0 || updateData.globalPercentage > 100)) {
            return res.json({ success: false, message: 'Percentual global deve estar entre 0 e 100' });
        }
        
        if (updateData.rules) {
            if (updateData.rules.minPurchaseAmount && updateData.rules.minPurchaseAmount < 0) {
                return res.json({ success: false, message: 'Valor mínimo de compra não pode ser negativo' });
            }
            
            if (updateData.rules.validityDays && updateData.rules.validityDays < 1) {
                return res.json({ success: false, message: 'Validade deve ser de pelo menos 1 dia' });
            }
        }
        
        const config = await cashbackModel.findOneAndUpdate(
            { storeId },
            updateData,
            { new: true, upsert: true }
        );
        
        res.json({ success: true, config, message: 'Configurações atualizadas com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar configuração de cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Obter saldo de cashback de um cliente
const getCustomerBalance = async (req, res) => {
    try {
        const { customerId } = req.params;
        const storeId = req.store._id;
        
        const balance = await cashbackTransactionModel.getCustomerBalance(customerId, storeId);
        const customer = await customerModel.findById(customerId);
        
        if (!customer) {
            return res.json({ success: false, message: 'Cliente não encontrado' });
        }
        
        // Atualizar saldo no modelo do cliente se necessário
        if (Math.abs(customer.cashbackBalance - balance) > 0.01) {
            await customerModel.updateCashbackBalance(customerId, storeId);
        }
        
        res.json({ 
            success: true, 
            balance,
            summary: customer.getCashbackSummary()
        });
    } catch (error) {
        console.error('Erro ao obter saldo de cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Obter histórico de transações de cashback de um cliente
const getCustomerHistory = async (req, res) => {
    try {
        const { customerId } = req.params;
        const storeId = req.store._id;
        const { page = 1, limit = 20 } = req.query;
        
        const skip = (page - 1) * limit;
        const history = await cashbackTransactionModel.getCustomerHistory(
            customerId, 
            storeId, 
            parseInt(limit), 
            skip
        );
        
        const total = await cashbackTransactionModel.countDocuments({
            customerId,
            storeId,
            status: 'confirmed'
        });
        
        res.json({ 
            success: true, 
            history,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / limit),
                count: history.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Erro ao obter histórico de cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Calcular cashback para um pedido (preview)
const calculateOrderCashback = async (req, res) => {
    try {
        const storeId = req.store._id;
        const { items, orderAmount } = req.body;
        
        const config = await cashbackModel.findOne({ storeId });
        
        if (!config || !config.isActive) {
            return res.json({ 
                success: true, 
                cashback: 0, 
                message: 'Cashback não está ativo para esta loja' 
            });
        }
        
        // Buscar informações dos produtos
        const productIds = items.map(item => item._id || item.id);
        const products = await foodModel.find({ _id: { $in: productIds } });
        
        // Mapear produtos para os itens
        const enrichedItems = items.map(item => {
            const product = products.find(p => p._id.toString() === (item._id || item.id).toString());
            return {
                ...item,
                category: product ? product.category : item.category
            };
        });
        
        const cashbackAmount = config.calculateOrderCashback(enrichedItems, orderAmount);
        
        res.json({ 
            success: true, 
            cashback: cashbackAmount,
            config: {
                isActive: config.isActive,
                globalPercentage: config.globalPercentage,
                minPurchaseAmount: config.rules.minPurchaseAmount
            }
        });
    } catch (error) {
        console.error('Erro ao calcular cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Processar cashback após confirmação de pagamento
const processCashback = async (orderId, storeId) => {
    try {
        const order = await orderModel.findById(orderId);
        if (!order || !order.customerId) {
            return { success: false, message: 'Pedido ou cliente não encontrado' };
        }
        
        const config = await cashbackModel.findOne({ storeId });
        if (!config || !config.isActive) {
            return { success: false, message: 'Cashback não está ativo' };
        }
        
        // Buscar informações dos produtos
        const productIds = order.items.map(item => item._id || item.id);
        const products = await foodModel.find({ _id: { $in: productIds } });
        
        // Mapear produtos para os itens
        const enrichedItems = order.items.map(item => {
            const product = products.find(p => p._id.toString() === (item._id || item.id).toString());
            return {
                ...item,
                category: product ? product.category : item.category
            };
        });
        
        const cashbackAmount = config.calculateOrderCashback(enrichedItems, order.amount);
        
        if (cashbackAmount > 0) {
            // Calcular data de expiração
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + config.rules.validityDays);
            
            // Criar detalhes da transação
            const earnedDetails = {
                orderAmount: order.amount,
                cashbackPercentage: config.globalPercentage,
                items: enrichedItems.map(item => {
                    const itemTotal = item.price * item.quantity;
                    const extrasTotal = item.extras ? 
                        item.extras.reduce((sum, extra) => sum + (extra.price * item.quantity), 0) : 0;
                    const finalPrice = itemTotal + extrasTotal;
                    
                    return {
                        productId: item._id || item.id,
                        productName: item.name,
                        category: item.category,
                        quantity: item.quantity,
                        unitPrice: item.price,
                        totalPrice: finalPrice,
                        cashbackAmount: config.calculateItemCashback(item, finalPrice),
                        cashbackPercentage: config.globalPercentage
                    };
                })
            };
            
            // Criar transação de cashback
            const transaction = await cashbackTransactionModel.createEarnedTransaction({
                customerId: order.customerId,
                storeId: storeId,
                orderId: orderId,
                amount: cashbackAmount,
                earnedDetails,
                expiresAt
            });
            
            // Atualizar pedido com informações de cashback
            await orderModel.findByIdAndUpdate(orderId, {
                'cashback.earned': cashbackAmount,
                'cashback.percentage': config.globalPercentage,
                'cashback.transactionId': transaction._id
            });
            
            // Atualizar saldo do cliente
            const customer = await customerModel.findById(order.customerId);
            if (customer) {
                await customer.addCashback(cashbackAmount);
            }
            
            return { 
                success: true, 
                cashbackAmount, 
                transactionId: transaction._id,
                expiresAt 
            };
        }
        
        return { success: true, cashbackAmount: 0, message: 'Nenhum cashback aplicável' };
    } catch (error) {
        console.error('Erro ao processar cashback:', error);
        return { success: false, message: 'Erro ao processar cashback' };
    }
};

// Usar cashback em um pedido
const useCashback = async (req, res) => {
    try {
        const { customerId, amount, orderId } = req.body;
        const storeId = req.store._id;
        
        // Verificar saldo disponível
        const currentBalance = await cashbackTransactionModel.getCustomerBalance(customerId, storeId);
        
        if (currentBalance < amount) {
            return res.json({ 
                success: false, 
                message: 'Saldo de cashback insuficiente',
                currentBalance 
            });
        }
        
        // Verificar se o pedido existe
        const order = await orderModel.findById(orderId);
        if (!order) {
            return res.json({ success: false, message: 'Pedido não encontrado' });
        }
        
        // Verificar regras de uso
        const config = await cashbackModel.findOne({ storeId });
        if (config && config.rules.maxUsagePerOrder && amount > config.rules.maxUsagePerOrder) {
            return res.json({ 
                success: false, 
                message: `Valor máximo de uso por pedido: R$ ${config.rules.maxUsagePerOrder}` 
            });
        }
        
        // Criar transação de uso
        const transaction = await cashbackTransactionModel.createUsedTransaction({
            customerId,
            storeId,
            orderId,
            amount,
            usedDetails: {
                originalAmount: order.amount,
                discountApplied: amount
            }
        });
        
        // Atualizar pedido
        await orderModel.findByIdAndUpdate(orderId, {
            'cashback.used': amount,
            amount: Math.max(0, order.amount - amount)
        });
        
        // Atualizar saldo do cliente
        const customer = await customerModel.findById(customerId);
        if (customer) {
            await customer.useCashback(amount);
        }
        
        res.json({ 
            success: true, 
            message: 'Cashback aplicado com sucesso',
            transactionId: transaction._id,
            newBalance: currentBalance - amount
        });
    } catch (error) {
        console.error('Erro ao usar cashback:', error);
        res.json({ success: false, message: error.message || 'Erro interno do servidor' });
    }
};

// Relatórios de cashback para administradores
const getCashbackReports = async (req, res) => {
    try {
        const storeId = req.store._id;
        const { startDate, endDate, period = '30' } = req.query;
        
        let start, end;
        
        if (startDate && endDate) {
            start = new Date(startDate);
            end = new Date(endDate);
        } else {
            end = new Date();
            start = new Date();
            start.setDate(start.getDate() - parseInt(period));
        }
        
        const stats = await cashbackTransactionModel.getStoreStats(storeId, start, end);
        
        // Obter top clientes por cashback ganho
        const topCustomers = await cashbackTransactionModel.aggregate([
            {
                $match: {
                    storeId: storeId,
                    type: 'earned',
                    status: 'confirmed',
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: '$customerId',
                    totalEarned: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            {
                $lookup: {
                    from: 'customers',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            {
                $unwind: '$customer'
            },
            {
                $sort: { totalEarned: -1 }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    customerName: '$customer.name',
                    customerPhone: '$customer.phone',
                    totalEarned: 1,
                    transactionCount: 1
                }
            }
        ]);
        
        res.json({ 
            success: true, 
            stats,
            topCustomers,
            period: {
                start,
                end,
                days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
            }
        });
    } catch (error) {
        console.error('Erro ao gerar relatórios de cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

// Expirar cashback antigo (função para ser executada periodicamente)
const expireOldCashback = async (req, res) => {
    try {
        const expiredCount = await cashbackTransactionModel.expireOldCashback();
        
        res.json({ 
            success: true, 
            message: `${expiredCount} transações de cashback foram expiradas`,
            expiredCount 
        });
    } catch (error) {
        console.error('Erro ao expirar cashback:', error);
        res.json({ success: false, message: 'Erro interno do servidor' });
    }
};

export {
    getCashbackConfig,
    updateCashbackConfig,
    getCustomerBalance,
    getCustomerHistory,
    calculateOrderCashback,
    processCashback,
    useCashback,
    getCashbackReports,
    expireOldCashback
};