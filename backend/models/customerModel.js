import mongoose from 'mongoose';

// Schema para endereços múltiplos do cliente
const addressSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true // Ex: "Casa", "Trabalho", "Outro"
  },
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
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Schema para itens do pedido no histórico
const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  observations: {
    type: String,
    trim: true
  }
});

// Schema para histórico de pedidos
const orderHistorySchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  deliveryAddress: {
    type: addressSchema
  },
  paymentMethod: {
    type: String,
    enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
    default: 'pending'
  },
  orderDate: {
    type: Date,
    default: Date.now
  }
});

const customerSchema = new mongoose.Schema({
    // Identificador único para cookies
    clientId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    name: {
        type: String,
        trim: true // Não obrigatório no cadastro inicial
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    // Múltiplos endereços
    addresses: [addressSchema],
    // Histórico de pedidos
    orderHistory: [orderHistorySchema],
    // Endereço principal (compatibilidade com código existente)
    address: {
        street: {
            type: String,
            trim: true
        },
        number: {
            type: String,
            trim: true
        },
        complement: {
            type: String,
            trim: true
        },
        neighborhood: {
            type: String,
            trim: true
        },
        city: {
            type: String,
            trim: true
        },
        state: {
            type: String,
            trim: true
        },
        zipCode: {
            type: String,
            trim: true
        }
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    // LGPD - Consentimento para uso de dados
    lgpdConsent: {
        consentGiven: {
            type: Boolean,
            default: false
        },
        consentDate: {
            type: Date
        },
        dataUsagePurpose: {
            type: String,
            default: "Histórico de pedidos e facilitar próximas compras"
        }
    },
    // Estatísticas do cliente
    statistics: {
        totalOrders: {
            type: Number,
            default: 0
        },
        totalSpent: {
            type: Number,
            default: 0
        },
        averageOrderValue: {
            type: Number,
            default: 0
        },
        lastOrderDate: {
            type: Date
        },
        favoriteItems: [{
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product'
            },
            orderCount: {
                type: Number,
                default: 1
            }
        }]
    },
    // Preferências do cliente
    preferences: {
        deliveryInstructions: {
            type: String,
            trim: true
        },
        preferredPaymentMethod: {
            type: String,
            enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao']
        },
        allowPromotions: {
            type: Boolean,
            default: true
        }
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
    
    allowWhatsappContact: {
        type: Boolean,
        default: true
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

// Índices para performance
customerSchema.index({ phoneHash: 1, storeId: 1 }, { unique: true });
customerSchema.index({ clientId: 1 }, { unique: true });
customerSchema.index({ phone: 1, storeId: 1 });

// Middleware para atualizar updatedAt
customerSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para obter endereço completo (compatibilidade)
customerSchema.methods.getFullAddress = function() {
    const addr = this.address;
    if (!addr || !addr.street) return '';
    return `${addr.street}, ${addr.number}${addr.complement ? ', ' + addr.complement : ''}, ${addr.neighborhood}, ${addr.city} - ${addr.state}, ${addr.zipCode}`;
};

// Método para incrementar contador de pedidos
customerSchema.methods.incrementOrderCount = function() {
    this.totalOrders += 1;
    this.lastOrderDate = new Date();
};

// Método estático para buscar por telefone e loja
customerSchema.statics.findByPhoneAndStore = function(phone, storeId) {
    const phoneHash = this.createPhoneHash(phone, storeId);
    return this.findOne({ phoneHash, storeId });
};

// Método estático para criar hash do telefone
customerSchema.statics.createPhoneHash = function(phone, storeId) {
    return `${phone}_${storeId}`;
};

// Método para adicionar cashback
customerSchema.methods.addCashback = function(amount) {
    this.cashbackBalance += amount;
    this.totalCashbackEarned += amount;
    this.lastCashbackUpdate = new Date();
};

customerSchema.methods.useCashback = function(amount) {
    if (this.cashbackBalance >= amount) {
        this.cashbackBalance -= amount;
        this.totalCashbackUsed += amount;
        this.lastCashbackUpdate = new Date();
        return true;
    }
    return false;
};

customerSchema.methods.getCashbackSummary = function() {
    return {
        balance: this.cashbackBalance,
        totalEarned: this.totalCashbackEarned,
        totalUsed: this.totalCashbackUsed
    };
};

// Novos métodos para o sistema de cadastro automático

// Método para adicionar endereço
customerSchema.methods.addAddress = function(addressData) {
    // Se é o primeiro endereço, marca como padrão
    if (this.addresses.length === 0) {
        addressData.isDefault = true;
    }
    
    // Se está marcando como padrão, remove o padrão dos outros
    if (addressData.isDefault) {
        this.addresses.forEach(addr => addr.isDefault = false);
    }
    
    this.addresses.push(addressData);
    return this.addresses[this.addresses.length - 1];
};

// Método para adicionar pedido ao histórico
customerSchema.methods.addOrderToHistory = function(orderData) {
    this.orderHistory.push(orderData);
    
    // Atualizar estatísticas
    this.statistics.totalOrders += 1;
    this.statistics.totalSpent += orderData.totalAmount;
    this.statistics.averageOrderValue = this.statistics.totalSpent / this.statistics.totalOrders;
    this.statistics.lastOrderDate = new Date();
    
    // Atualizar itens favoritos
    orderData.items.forEach(item => {
        const existingFavorite = this.statistics.favoriteItems.find(
            fav => fav.productId.toString() === item.productId.toString()
        );
        
        if (existingFavorite) {
            existingFavorite.orderCount += item.quantity;
        } else {
            this.statistics.favoriteItems.push({
                productId: item.productId,
                orderCount: item.quantity
            });
        }
    });
    
    // Manter apenas os 10 itens mais pedidos
    this.statistics.favoriteItems.sort((a, b) => b.orderCount - a.orderCount);
    this.statistics.favoriteItems = this.statistics.favoriteItems.slice(0, 10);
    
    return this.orderHistory[this.orderHistory.length - 1];
};

// Método para obter endereço padrão
customerSchema.methods.getDefaultAddress = function() {
    return this.addresses.find(addr => addr.isDefault) || this.addresses[0];
};

// Método estático para gerar clientId único
customerSchema.statics.generateClientId = function() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

customerSchema.statics.updateCashbackBalance = async function(customerId, storeId) {
    try {
        // Implementação existente mantida
        return await this.findById(customerId);
    } catch (error) {
        throw error;
    }
};

customerSchema.statics.getCustomerAnalytics = async function(storeId, dateRange = 30) {
    try {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - dateRange);
        
        const analytics = await this.aggregate([
            { $match: { storeId: new mongoose.Types.ObjectId(storeId), createdAt: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalCustomers: { $sum: 1 },
                    totalOrders: { $sum: '$totalOrders' },
                    totalRevenue: { $sum: '$statistics.totalSpent' },
                    averageOrderValue: { $avg: '$statistics.averageOrderValue' },
                    activeCustomers: {
                        $sum: {
                            $cond: [
                                { $gte: ['$lastOrderDate', startDate] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);
        
        return analytics[0] || {
            totalCustomers: 0,
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            activeCustomers: 0
        };
    } catch (error) {
        throw error;
    }
};

customerSchema.statics.getContactableCustomers = async function(storeId, segment = null, contactMethod = 'whatsapp') {
    try {
        const query = {
            storeId: new mongoose.Types.ObjectId(storeId),
            isActive: true,
            campaignOptOut: false
        };
        
        if (segment) {
            query.customerSegment = segment;
        }
        
        // Apenas WhatsApp suportado
        query.allowWhatsappContact = true;
        query.whatsappNumber = { $exists: true, $ne: '' };
        
        return await this.find(query).select('name phone whatsappNumber customerSegment totalOrders statistics.totalSpent');
    } catch (error) {
        throw error;
    }
};

customerSchema.statics.updateCustomerSegments = async function(storeId) {
    try {
        const customers = await this.find({ storeId });
        
        for (const customer of customers) {
            const daysSinceLastOrder = customer.lastOrderDate 
                ? Math.floor((new Date() - customer.lastOrderDate) / (1000 * 60 * 60 * 24))
                : 999;
            
            let segment = 'new';
            
            if (customer.totalOrders === 0) {
                segment = 'new';
            } else if (customer.totalOrders >= 10 && customer.statistics.totalSpent >= 500) {
                segment = 'vip';
            } else if (customer.totalOrders >= 5 && daysSinceLastOrder <= 30) {
                segment = 'loyal';
            } else if (daysSinceLastOrder > 60) {
                segment = 'inactive';
            }
            
            customer.customerSegment = segment;
            await customer.save();
        }
    } catch (error) {
        throw error;
    }
};

const customerModel = mongoose.models.Customer || mongoose.model('Customer', customerSchema);

export default customerModel;
