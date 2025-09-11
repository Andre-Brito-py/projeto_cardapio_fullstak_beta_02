import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  // Google Maps API
  googleMapsApiKey: {
    type: String,
    trim: true
  },
  googleMapsEnabled: {
    type: Boolean,
    default: false
  },
  systemName: {
    type: String,
    default: 'Food Delivery System',
    trim: true
  },
  systemVersion: {
    type: String,
    default: '1.0.0'
  },
  maxStoresAllowed: {
    type: Number,
    default: 100
  },
  subscriptionPlans: [{
    name: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true
    },
    features: [{
      type: String
    }],
    maxOrders: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    maxProducts: {
      type: Number,
      default: -1
    }
  }],
  maintenanceMode: {
    type: Boolean,
    default: false
  },
  maintenanceMessage: {
    type: String,
    default: 'Sistema em manutenção. Voltaremos em breve.'
  },
  emailSettings: {
    smtpHost: String,
    smtpPort: Number,
    smtpUser: String,
    smtpPassword: String,
    fromEmail: String,
    fromName: String
  },
  // Asaas API
  asaasApiKey: {
    type: String,
    trim: true
  },
  asaasEnvironment: {
    type: String,
    enum: ['sandbox', 'production'],
    default: 'sandbox'
  },
  asaasEnabled: {
    type: Boolean,
    default: false
  },
  
  // Lisa AI Assistant
  lisaEnabled: {
    type: Boolean,
    default: false
  },
  lisaOpenAiApiKey: {
    type: String,
    trim: true
  },
  lisaGroqApiKey: {
    type: String,
    trim: true
  },
  lisaChainlitSecret: {
    type: String,
    trim: true
  },
  lisaLiteralApiKey: {
    type: String,
    trim: true
  },
  lisaOpenRouterApiKey: {
    type: String,
    trim: true
  },

  lisaPort: {
    type: String,
    default: '8000',
    trim: true
  },
  lisaMaxFileSize: {
    type: Number,
    default: 10
  },
  
  // Telegram Bot Integration
  telegramEnabled: {
    type: Boolean,
    default: false
  },
  telegramBotToken: {
    type: String,
    trim: true
  },
  telegramWebhookUrl: {
    type: String,
    trim: true
  },
  telegramAdminChatId: {
    type: String,
    trim: true
  },
  telegramMassMessagingEnabled: {
    type: Boolean,
    default: false
  },
  telegramCampaignsEnabled: {
    type: Boolean,
    default: false
  },
  
  // Configurações de frete
  shippingEnabled: {
    type: Boolean,
    default: true
  },
  freeShippingMinValue: {
    type: Number,
    default: 50
  },
  baseShippingCost: {
    type: Number,
    default: 5
  },
  costPerKm: {
    type: Number,
    default: 2
  },
  
  paymentSettings: {
    stripePublicKey: String,
    stripeSecretKey: String,
    pixEnabled: {
      type: Boolean,
      default: true
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
systemSettingsSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Garantir que só existe uma instância de configurações do sistema
systemSettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({
      googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      subscriptionPlans: [
        {
          name: 'Básico',
          price: 29.90,
          features: ['Até 100 pedidos/mês', 'Até 50 produtos', 'Suporte por email'],
          maxOrders: 100,
          maxProducts: 50
        },
        {
          name: 'Profissional',
          price: 59.90,
          features: ['Até 500 pedidos/mês', 'Até 200 produtos', 'Suporte prioritário', 'Relatórios avançados'],
          maxOrders: 500,
          maxProducts: 200
        },
        {
          name: 'Enterprise',
          price: 99.90,
          features: ['Pedidos ilimitados', 'Produtos ilimitados', 'Suporte 24/7', 'API personalizada'],
          maxOrders: -1,
          maxProducts: -1
        }
      ]
    });
  }
  return settings;
};

const SystemSettings = mongoose.model('SystemSettings', systemSettingsSchema);

export default SystemSettings;