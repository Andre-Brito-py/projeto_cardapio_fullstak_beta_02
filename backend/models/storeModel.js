import mongoose from 'mongoose';

const storeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  logo: {
    type: String // URL da logo
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended', 'pending'],
    default: 'pending'
  },
  subscription: {
    plan: {
      type: String,
      required: true,
      default: 'Básico'
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'cancelled', 'trial'],
      default: 'trial'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: function() {
        const date = new Date();
        date.setDate(date.getDate() + 7); // 7 dias de trial
        return date;
      }
    },
    autoRenew: {
      type: Boolean,
      default: false
    },
    // Campos para integração com Asaas
    asaasCustomerId: {
      type: String,
      unique: true,
      sparse: true
    },
    asaasSubscriptionId: {
      type: String,
      unique: true,
      sparse: true
    },
    ciclo: {
      type: String,
      enum: ['mensal', 'anual'],
      default: 'mensal'
    },
    validadePlano: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ['PIX', 'BOLETO', 'CREDIT_CARD'],
      default: 'PIX'
    }
  },
  settings: {
    restaurantAddress: {
      type: String,
      required: true
    },
    address: {
      street: {
        type: String,
        required: false,
        default: 'Não informado'
      },
      number: {
        type: String,
        required: false,
        default: 'S/N'
      },
      complement: {
        type: String
      },
      neighborhood: {
        type: String,
        required: false,
        default: 'Não informado'
      },
      city: {
        type: String,
        required: false,
        default: 'Não informado'
      },
      state: {
        type: String,
        required: false,
        default: 'Não informado'
      },
      zipCode: {
        type: String,
        required: false,
        default: '00000-000'
      }
    },
    pixKey: {
      type: String
    },
    isOpen: {
      type: Boolean,
      default: true
    },
    autoAcceptOrders: {
      type: Boolean,
      default: false
    },
    acceptedPaymentMethods: {
      type: [String],
      enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao'],
      default: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao']
    },
    deliveryZones: [{
      name: {
        type: String,
        required: true
      },
      maxDistance: {
        type: Number,
        required: true
      },
      fee: {
        type: Number,
        required: true
      }
    }],
    maxDeliveryDistance: {
      type: Number,
      default: 10
    },
    operatingHours: {
      monday: { open: String, close: String, closed: { type: Boolean, default: false } },
      tuesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      wednesday: { open: String, close: String, closed: { type: Boolean, default: false } },
      thursday: { open: String, close: String, closed: { type: Boolean, default: false } },
      friday: { open: String, close: String, closed: { type: Boolean, default: false } },
      saturday: { open: String, close: String, closed: { type: Boolean, default: false } },
      sunday: { open: String, close: String, closed: { type: Boolean, default: false } }
    },
    currency: {
      type: String,
      default: 'BRL'
    },
    language: {
      type: String,
      default: 'pt-BR'
    },
    timezone: {
      type: String,
      default: 'America/Sao_Paulo'
    }
  },
  customization: {
    primaryColor: {
      type: String,
      default: '#ff6b35'
    },
    secondaryColor: {
      type: String,
      default: '#2c3e50'
    },
    customCSS: {
      type: String
    },
    favicon: {
      type: String
    }
  },
  domain: {
    subdomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true
    },
    customDomain: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true
    },
    sslEnabled: {
      type: Boolean,
      default: false
    }
  },
  analytics: {
    totalOrders: {
      type: Number,
      default: 0
    },
    totalRevenue: {
      type: Number,
      default: 0
    },
    currentMonthOrders: {
      type: Number,
      default: 0
    },
    currentMonthRevenue: {
      type: Number,
      default: 0
    },
    lastResetDate: {
      type: Date,
      default: Date.now
    }
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
storeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Gerar slug automaticamente baseado no nome
storeSchema.pre('save', function(next) {
  if (this.isModified('name') || !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
  next();
});

// Método para verificar se a assinatura está ativa
storeSchema.methods.isSubscriptionActive = function() {
  return this.subscription.status === 'active' || 
         (this.subscription.status === 'trial' && this.subscription.endDate > new Date());
};

// Método para verificar limites do plano
storeSchema.methods.checkPlanLimits = async function(type) {
  const SystemSettings = mongoose.model('SystemSettings');
  const settings = await SystemSettings.getInstance();
  const plan = settings.subscriptionPlans.find(p => p.name === this.subscription.plan);
  
  if (!plan) return { allowed: false, message: 'Plano não encontrado' };
  
  if (type === 'orders') {
    if (plan.maxOrders === -1) return { allowed: true };
    return {
      allowed: this.analytics.currentMonthOrders < plan.maxOrders,
      current: this.analytics.currentMonthOrders,
      limit: plan.maxOrders
    };
  }
  
  if (type === 'products') {
    const Product = mongoose.model('Product');
    const productCount = await Product.countDocuments({ storeId: this._id });
    if (plan.maxProducts === -1) return { allowed: true };
    return {
      allowed: productCount < plan.maxProducts,
      current: productCount,
      limit: plan.maxProducts
    };
  }
  
  return { allowed: true };
};

const Store = mongoose.model('Store', storeSchema);

export default Store;