import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        street: {
            type: String,
            required: true,
            trim: true
        },
        number: {
            type: String,
            required: true,
            trim: true
        },
        complement: {
            type: String,
            trim: true
        },
        neighborhood: {
            type: String,
            required: true,
            trim: true
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        state: {
            type: String,
            required: true,
            trim: true
        },
        zipCode: {
            type: String,
            required: true,
            trim: true
        }
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    // Identificador único por loja para detectar clientes existentes
    phoneHash: {
        type: String,
        required: true
    },
    // Histórico de pedidos
    totalOrders: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
        type: Date
    },
    // Status do cliente
    isActive: {
        type: Boolean,
        default: true
    },
    // Sistema de Cashback
    cashbackBalance: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCashbackEarned: {
        type: Number,
        default: 0,
        min: 0
    },
    totalCashbackUsed: {
        type: Number,
        default: 0,
        min: 0
    },
    lastCashbackUpdate: {
        type: Date,
        default: Date.now
    },
    // Contact information for Liza campaigns
    whatsappNumber: {
        type: String,
        trim: true,
        default: function() {
            return this.phone; // Default to main phone number
        }
    },
    telegramUsername: {
        type: String,
        trim: true
    },
    allowWhatsappContact: {
        type: Boolean,
        default: true
    },
    allowTelegramContact: {
        type: Boolean,
        default: false
    },
    // Customer segmentation for campaigns
    customerSegment: {
        type: String,
        enum: ['new', 'loyal', 'inactive', 'vip'],
        default: 'new'
    },
    lastCampaignContact: {
        type: Date
    },
    campaignOptOut: {
        type: Boolean,
        default: false
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

// Índice composto para garantir unicidade de telefone por loja
customerSchema.index({ phoneHash: 1, storeId: 1 }, { unique: true });

// Middleware para atualizar updatedAt
customerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para formatar endereço completo
customerSchema.methods.getFullAddress = function() {
    const addr = this.address;
    let fullAddress = `${addr.street}, ${addr.number}`;
    if (addr.complement) {
        fullAddress += `, ${addr.complement}`;
    }
    fullAddress += `, ${addr.neighborhood}, ${addr.city} - ${addr.state}, CEP: ${addr.zipCode}`;
    return fullAddress;
};

// Método para incrementar contador de pedidos
customerSchema.methods.incrementOrderCount = function() {
    this.totalOrders += 1;
    this.lastOrderDate = new Date();
    return this.save();
};

// Método estático para encontrar cliente por telefone e loja
customerSchema.statics.findByPhoneAndStore = function(phone, storeId) {
    // Criar hash do telefone para busca
    const crypto = require('crypto');
    const phoneHash = crypto.createHash('sha256').update(phone + storeId.toString()).digest('hex');
    return this.findOne({ phoneHash, storeId });
};

// Método estático para criar hash do telefone
customerSchema.statics.createPhoneHash = function(phone, storeId) {
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(phone + storeId.toString()).digest('hex');
};

// Métodos relacionados ao cashback
customerSchema.methods.addCashback = function(amount) {
    this.cashbackBalance += amount;
    this.totalCashbackEarned += amount;
    this.lastCashbackUpdate = new Date();
    return this.save();
};

customerSchema.methods.useCashback = function(amount) {
    if (this.cashbackBalance >= amount) {
        this.cashbackBalance -= amount;
        this.totalCashbackUsed += amount;
        this.lastCashbackUpdate = new Date();
        return this.save();
    }
    throw new Error('Saldo de cashback insuficiente');
};

customerSchema.methods.getCashbackSummary = function() {
    return {
        currentBalance: this.cashbackBalance,
        totalEarned: this.totalCashbackEarned,
        totalUsed: this.totalCashbackUsed,
        lastUpdate: this.lastCashbackUpdate
    };
};

// Método estático para atualizar saldo de cashback de um cliente
customerSchema.statics.updateCashbackBalance = async function(customerId, storeId) {
    const CashbackTransaction = require('./cashbackTransactionModel.js').default;
    const balance = await CashbackTransaction.getCustomerBalance(customerId, storeId);
    
    return this.findByIdAndUpdate(customerId, {
        cashbackBalance: balance,
        lastCashbackUpdate: new Date()
    }, { new: true });
};

// Analytics methods for Liza campaigns
customerSchema.statics.getCustomerAnalytics = async function(storeId, dateRange = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - dateRange);
    
    const analytics = await this.aggregate([
        { $match: { storeId: new mongoose.Types.ObjectId(storeId) } },
        {
            $facet: {
                totalCustomers: [{ $count: "count" }],
                newCustomers: [
                    { $match: { createdAt: { $gte: startDate } } },
                    { $count: "count" }
                ],
                loyalCustomers: [
                    { $match: { totalOrders: { $gte: 5 } } },
                    { $count: "count" }
                ],
                inactiveCustomers: [
                    { $match: { 
                        lastOrderDate: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
                        totalOrders: { $gt: 0 }
                    }},
                    { $count: "count" }
                ],
                vipCustomers: [
                    { $match: { totalOrders: { $gte: 10 } } },
                    { $count: "count" }
                ],
                customersBySegment: [
                    { $group: { _id: "$customerSegment", count: { $sum: 1 } } }
                ],
                ordersOverTime: [
                    { $match: { createdAt: { $gte: startDate } } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { _id: 1 } }
                ]
            }
        }
    ]);
    
    return analytics[0];
};

customerSchema.statics.getContactableCustomers = async function(storeId, segment = null, contactMethod = 'whatsapp') {
    const query = {
        storeId: new mongoose.Types.ObjectId(storeId),
        campaignOptOut: false
    };
    
    if (segment) {
        query.customerSegment = segment;
    }
    
    if (contactMethod === 'whatsapp') {
        query.allowWhatsappContact = true;
        query.whatsappNumber = { $exists: true, $ne: '' };
    } else if (contactMethod === 'telegram') {
        query.allowTelegramContact = true;
        query.telegramUsername = { $exists: true, $ne: '' };
    }
    
    return await this.find(query).select('name phone whatsappNumber telegramUsername customerSegment totalOrders lastOrderDate');
};

customerSchema.statics.updateCustomerSegments = async function(storeId) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    // Update segments based on order behavior
    await this.updateMany(
        { storeId, createdAt: { $gte: sevenDaysAgo }, totalOrders: { $lte: 1 } },
        { customerSegment: 'new' }
    );
    
    await this.updateMany(
        { storeId, totalOrders: { $gte: 5, $lt: 10 } },
        { customerSegment: 'loyal' }
    );
    
    await this.updateMany(
        { storeId, totalOrders: { $gte: 10 } },
        { customerSegment: 'vip' }
    );
    
    await this.updateMany(
        { 
            storeId, 
            lastOrderDate: { $lt: thirtyDaysAgo },
            totalOrders: { $gt: 0 }
        },
        { customerSegment: 'inactive' }
    );
};

const customerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default customerModel;