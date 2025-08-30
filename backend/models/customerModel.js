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

const customerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default customerModel;