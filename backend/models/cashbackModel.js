import mongoose from 'mongoose';

const cashbackSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    // Configurações globais
    isActive: {
        type: Boolean,
        default: true
    },
    globalPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Regras gerais
    rules: {
        minPurchaseAmount: {
            type: Number,
            default: 0,
            min: 0
        },
        maxCashbackPerOrder: {
            type: Number,
            default: null // null = sem limite
        },
        maxUsagePerOrder: {
            type: Number,
            default: null // null = sem limite
        },
        validityDays: {
            type: Number,
            default: 365, // 1 ano por padrão
            min: 1
        }
    },
    // Configurações por categoria
    categorySettings: {
        type: [{
            categoryName: {
                type: String,
                required: true
            },
            percentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],
        default: []
    },
    // Configurações por produto específico
    productSettings: {
        type: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Food',
                required: true
            },
            productName: {
                type: String,
                required: true
            },
            percentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            },
            isActive: {
                type: Boolean,
                default: true
            }
        }],
        default: []
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

// Índice para garantir uma configuração por loja
cashbackSchema.index({ storeId: 1 }, { unique: true });

// Middleware para atualizar updatedAt
cashbackSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para calcular cashback de um item
cashbackSchema.methods.calculateItemCashback = function(item, itemPrice) {
    if (!this.isActive) return 0;
    
    let percentage = this.globalPercentage;
    
    // Verificar se há configuração específica para o produto
    const productSetting = this.productSettings.find(p => 
        p.productId.toString() === item._id.toString() && p.isActive
    );
    
    if (productSetting) {
        percentage = productSetting.percentage;
    } else {
        // Verificar se há configuração para a categoria
        const categorySetting = this.categorySettings.find(c => 
            c.categoryName === item.category && c.isActive
        );
        
        if (categorySetting) {
            percentage = categorySetting.percentage;
        }
    }
    
    const cashbackAmount = (itemPrice * percentage) / 100;
    
    // Aplicar limite máximo por pedido se configurado
    if (this.rules.maxCashbackPerOrder && cashbackAmount > this.rules.maxCashbackPerOrder) {
        return this.rules.maxCashbackPerOrder;
    }
    
    return Math.round(cashbackAmount * 100) / 100; // Arredondar para 2 casas decimais
};

// Método para calcular cashback total de um pedido
cashbackSchema.methods.calculateOrderCashback = function(orderItems, orderAmount) {
    if (!this.isActive) return 0;
    
    // Verificar valor mínimo de compra
    if (orderAmount < this.rules.minPurchaseAmount) {
        return 0;
    }
    
    let totalCashback = 0;
    
    // Calcular cashback por item
    orderItems.forEach(orderItem => {
        const itemTotal = orderItem.price * orderItem.quantity;
        
        // Adicionar preço dos extras se existirem
        let extrasTotal = 0;
        if (orderItem.extras && orderItem.extras.length > 0) {
            extrasTotal = orderItem.extras.reduce((sum, extra) => 
                sum + (extra.price * orderItem.quantity), 0
            );
        }
        
        const finalItemPrice = itemTotal + extrasTotal;
        const itemCashback = this.calculateItemCashback(orderItem, finalItemPrice);
        totalCashback += itemCashback;
    });
    
    // Aplicar limite máximo por pedido se configurado
    if (this.rules.maxCashbackPerOrder && totalCashback > this.rules.maxCashbackPerOrder) {
        totalCashback = this.rules.maxCashbackPerOrder;
    }
    
    return Math.round(totalCashback * 100) / 100; // Arredondar para 2 casas decimais
};

// Método estático para obter configuração de cashback de uma loja
cashbackSchema.statics.getStoreConfig = function(storeId) {
    return this.findOne({ storeId });
};

// Método estático para criar configuração padrão para uma loja
cashbackSchema.statics.createDefaultConfig = function(storeId) {
    return this.create({
        storeId,
        isActive: false, // Desativado por padrão
        globalPercentage: 5, // 5% por padrão
        rules: {
            minPurchaseAmount: 20, // R$ 20 mínimo
            validityDays: 365
        }
    });
};

const cashbackModel = mongoose.models.Cashback || mongoose.model('Cashback', cashbackSchema);

export default cashbackModel;