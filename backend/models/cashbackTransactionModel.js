import mongoose from 'mongoose';

const cashbackTransactionSchema = new mongoose.Schema({
    customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    type: {
        type: String,
        enum: ['earned', 'used', 'expired', 'refunded'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0
    },
    // Informações sobre o cashback ganho
    earnedDetails: {
        orderAmount: {
            type: Number,
            required: function() { return this.type === 'earned'; }
        },
        cashbackPercentage: {
            type: Number,
            required: function() { return this.type === 'earned'; }
        },
        items: {
            type: [{
                productId: mongoose.Schema.Types.ObjectId,
                productName: String,
                category: String,
                quantity: Number,
                unitPrice: Number,
                totalPrice: Number,
                cashbackAmount: Number,
                cashbackPercentage: Number
            }],
            required: function() { return this.type === 'earned'; }
        }
    },
    // Informações sobre o cashback usado
    usedDetails: {
        originalAmount: {
            type: Number,
            required: function() { return this.type === 'used'; }
        },
        discountApplied: {
            type: Number,
            required: function() { return this.type === 'used'; }
        }
    },
    // Status da transação
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled'],
        default: 'confirmed'
    },
    // Data de expiração (para cashback ganho)
    expiresAt: {
        type: Date,
        required: function() { return this.type === 'earned'; }
    },
    // Observações
    notes: {
        type: String,
        default: ''
    },
    // Timestamps
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, { minimize: false });

// Índices para otimizar consultas
cashbackTransactionSchema.index({ customerId: 1, storeId: 1 });
cashbackTransactionSchema.index({ orderId: 1 });
cashbackTransactionSchema.index({ type: 1, status: 1 });
cashbackTransactionSchema.index({ expiresAt: 1 });
cashbackTransactionSchema.index({ createdAt: -1 });

// Middleware para atualizar updatedAt
cashbackTransactionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método estático para calcular saldo atual de um cliente
cashbackTransactionSchema.statics.getCustomerBalance = async function(customerId, storeId) {
    const now = new Date();
    
    // Somar cashback ganho (não expirado)
    const earnedResult = await this.aggregate([
        {
            $match: {
                customerId: new mongoose.Types.ObjectId(customerId),
                storeId: new mongoose.Types.ObjectId(storeId),
                type: 'earned',
                status: 'confirmed',
                expiresAt: { $gt: now }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);
    
    // Somar cashback usado
    const usedResult = await this.aggregate([
        {
            $match: {
                customerId: new mongoose.Types.ObjectId(customerId),
                storeId: new mongoose.Types.ObjectId(storeId),
                type: 'used',
                status: 'confirmed'
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: '$amount' }
            }
        }
    ]);
    
    const earned = earnedResult.length > 0 ? earnedResult[0].total : 0;
    const used = usedResult.length > 0 ? usedResult[0].total : 0;
    
    return Math.round((earned - used) * 100) / 100;
};

// Método estático para obter histórico de transações de um cliente
cashbackTransactionSchema.statics.getCustomerHistory = function(customerId, storeId, limit = 50, skip = 0) {
    return this.find({
        customerId,
        storeId,
        status: 'confirmed'
    })
    .populate('orderId', 'amount date status')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Método estático para criar transação de cashback ganho
cashbackTransactionSchema.statics.createEarnedTransaction = function(data) {
    return this.create({
        customerId: data.customerId,
        storeId: data.storeId,
        orderId: data.orderId,
        type: 'earned',
        amount: data.amount,
        earnedDetails: data.earnedDetails,
        expiresAt: data.expiresAt,
        status: 'confirmed'
    });
};

// Método estático para criar transação de cashback usado
cashbackTransactionSchema.statics.createUsedTransaction = function(data) {
    return this.create({
        customerId: data.customerId,
        storeId: data.storeId,
        orderId: data.orderId,
        type: 'used',
        amount: data.amount,
        usedDetails: data.usedDetails,
        status: 'confirmed'
    });
};

// Método estático para expirar cashback antigo
cashbackTransactionSchema.statics.expireOldCashback = async function() {
    const now = new Date();
    
    // Encontrar cashback expirado
    const expiredTransactions = await this.find({
        type: 'earned',
        status: 'confirmed',
        expiresAt: { $lt: now }
    });
    
    // Criar transações de expiração
    const expiredPromises = expiredTransactions.map(transaction => {
        return this.create({
            customerId: transaction.customerId,
            storeId: transaction.storeId,
            orderId: transaction.orderId,
            type: 'expired',
            amount: transaction.amount,
            notes: `Cashback expirado - Transação original: ${transaction._id}`,
            status: 'confirmed'
        });
    });
    
    await Promise.all(expiredPromises);
    
    return expiredTransactions.length;
};

// Método estático para relatórios administrativos
cashbackTransactionSchema.statics.getStoreStats = async function(storeId, startDate, endDate) {
    const matchConditions = {
        storeId: new mongoose.Types.ObjectId(storeId),
        status: 'confirmed'
    };
    
    if (startDate && endDate) {
        matchConditions.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }
    
    const stats = await this.aggregate([
        { $match: matchConditions },
        {
            $group: {
                _id: '$type',
                total: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    const result = {
        totalEarned: 0,
        totalUsed: 0,
        totalExpired: 0,
        transactionsCount: {
            earned: 0,
            used: 0,
            expired: 0
        }
    };
    
    stats.forEach(stat => {
        switch (stat._id) {
            case 'earned':
                result.totalEarned = stat.total;
                result.transactionsCount.earned = stat.count;
                break;
            case 'used':
                result.totalUsed = stat.total;
                result.transactionsCount.used = stat.count;
                break;
            case 'expired':
                result.totalExpired = stat.total;
                result.transactionsCount.expired = stat.count;
                break;
        }
    });
    
    result.currentBalance = result.totalEarned - result.totalUsed - result.totalExpired;
    
    return result;
};

const cashbackTransactionModel = mongoose.models.CashbackTransaction || 
    mongoose.model('CashbackTransaction', cashbackTransactionSchema);

export default cashbackTransactionModel;