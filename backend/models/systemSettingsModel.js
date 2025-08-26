import mongoose from 'mongoose';

const systemSettingsSchema = new mongoose.Schema({
  googleMapsApiKey: {
    type: String,
    required: true,
    trim: true
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