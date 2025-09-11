import mongoose from 'mongoose';

const telegramContactSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  userId: {
    type: Number,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    default: ''
  },
  username: {
    type: String,
    default: ''
  },
  phoneNumber: {
    type: String,
    default: ''
  },
  languageCode: {
    type: String,
    default: 'pt'
  },
  isBot: {
    type: Boolean,
    default: false
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  addedToAttachmentMenu: {
    type: Boolean,
    default: false
  },
  canJoinGroups: {
    type: Boolean,
    default: false
  },
  canReadAllGroupMessages: {
    type: Boolean,
    default: false
  },
  supportsInlineQueries: {
    type: Boolean,
    default: false
  },
  // Campos personalizados
  notes: {
    type: String,
    default: ''
  },
  tags: [{
    type: String
  }],
  acceptsPromotions: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockedReason: {
    type: String,
    default: ''
  },
  // Estatísticas
  totalMessages: {
    type: Number,
    default: 0
  },
  totalOrders: {
    type: Number,
    default: 0
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  lastOrderDate: {
    type: Date
  },
  // Interações
  firstInteraction: {
    type: Date,
    default: Date.now
  },
  lastInteraction: {
    type: Date,
    default: Date.now
  },
  lastMessageReceived: {
    type: Date
  },
  lastMessageSent: {
    type: Date
  },
  // Controle
  isActive: {
    type: Boolean,
    default: true
  },
  addedManually: {
    type: Boolean,
    default: false
  },
  source: {
    type: String,
    enum: ['bot_interaction', 'manual_add', 'import', 'webhook'],
    default: 'bot_interaction'
  },
  // Preferências
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    promotions: {
      type: Boolean,
      default: true
    },
    orderUpdates: {
      type: Boolean,
      default: true
    },
    newsletter: {
      type: Boolean,
      default: false
    }
  },
  // Segmentação
  segment: {
    type: String,
    enum: ['new', 'regular', 'vip', 'inactive', 'churned'],
    default: 'new'
  },
  customerValue: {
    type: String,
    enum: ['low', 'medium', 'high', 'premium'],
    default: 'low'
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
});

// Middleware para atualizar updatedAt
telegramContactSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Métodos do schema
telegramContactSchema.methods.updateInteraction = function() {
  this.lastInteraction = new Date();
  this.totalMessages += 1;
  return this.save();
};

telegramContactSchema.methods.addOrder = function(orderValue) {
  this.totalOrders += 1;
  this.totalSpent += orderValue;
  this.lastOrderDate = new Date();
  
  // Atualizar segmento baseado no valor gasto
  if (this.totalSpent >= 500) {
    this.segment = 'vip';
    this.customerValue = 'premium';
  } else if (this.totalSpent >= 200) {
    this.segment = 'regular';
    this.customerValue = 'high';
  } else if (this.totalSpent >= 50) {
    this.customerValue = 'medium';
  }
  
  return this.save();
};

telegramContactSchema.methods.getFullName = function() {
  return `${this.firstName} ${this.lastName}`.trim();
};

telegramContactSchema.methods.canReceivePromotions = function() {
  return this.acceptsPromotions && 
         this.preferences.promotions && 
         !this.isBlocked && 
         this.isActive;
};

// Índices
telegramContactSchema.index({ storeId: 1, chatId: 1 }, { unique: true });
telegramContactSchema.index({ storeId: 1, userId: 1 });
telegramContactSchema.index({ storeId: 1, phoneNumber: 1 });
telegramContactSchema.index({ storeId: 1, username: 1 });
telegramContactSchema.index({ storeId: 1, isActive: 1 });
telegramContactSchema.index({ storeId: 1, acceptsPromotions: 1 });
telegramContactSchema.index({ storeId: 1, segment: 1 });
telegramContactSchema.index({ storeId: 1, lastInteraction: -1 });
telegramContactSchema.index({ storeId: 1, tags: 1 });
telegramContactSchema.index({ createdAt: 1 });
telegramContactSchema.index({ lastInteraction: 1 });

export const TelegramContact = mongoose.model('TelegramContact', telegramContactSchema);