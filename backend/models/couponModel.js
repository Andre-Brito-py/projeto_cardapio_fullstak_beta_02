import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    code: {
        type: String,
        required: true,
        uppercase: true,
        trim: true,
        minlength: 3,
        maxlength: 20
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'fixed', 'free_shipping'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    minOrderValue: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null // Para cupons percentuais, limita o desconto máximo
    },
    maxUses: {
        type: Number,
        default: null // null = uso ilimitado
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxUsesPerUser: {
        type: Number,
        default: 1 // Quantas vezes um usuário pode usar o cupom
    },
    validFrom: {
        type: Date,
        required: true,
        default: Date.now
    },
    validUntil: {
        type: Date,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    applicableCategories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category'
    }], // Se vazio, aplica a todas as categorias da loja
    excludedItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Food'
    }], // Itens que não podem usar o cupom
    firstTimeUserOnly: {
        type: Boolean,
        default: false // Se true, só novos usuários podem usar
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Middleware para atualizar updatedAt
couponSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Índices para melhor performance
couponSchema.index({ storeId: 1, code: 1 }, { unique: true }); // Código único por loja
couponSchema.index({ storeId: 1, isActive: 1, validFrom: 1, validUntil: 1 });
couponSchema.index({ createdBy: 1 });

// Método para verificar se o cupom está válido
couponSchema.methods.isValid = function() {
    const now = new Date();
    return this.isActive && 
           now >= this.validFrom && 
           now <= this.validUntil &&
           (this.maxUses === null || this.usedCount < this.maxUses);
};

// Método para verificar se pode ser usado por um usuário específico
couponSchema.methods.canBeUsedByUser = function(userId, userOrderCount = 0) {
    if (!this.isValid()) return false;
    
    // Verificar se é só para novos usuários
    if (this.firstTimeUserOnly && userOrderCount > 0) {
        return false;
    }
    
    return true;
};

// Método para calcular desconto
couponSchema.methods.calculateDiscount = function(orderAmount, applicableAmount = null) {
    if (!this.isValid()) return 0;
    
    const baseAmount = applicableAmount || orderAmount;
    
    if (orderAmount < this.minOrderValue) return 0;
    
    let discount = 0;
    
    switch (this.discountType) {
        case 'percentage':
            discount = (baseAmount * this.discountValue) / 100;
            if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
                discount = this.maxDiscountAmount;
            }
            break;
        case 'fixed':
            discount = Math.min(this.discountValue, baseAmount);
            break;
        case 'free_shipping':
            // Implementar lógica de frete grátis se necessário
            discount = 0;
            break;
        default:
            discount = 0;
    }
    
    return Math.round(discount * 100) / 100; // Arredondar para 2 casas decimais
};

const couponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema);

export default couponModel;