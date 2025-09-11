import mongoose from 'mongoose';

const telegramMessageSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  chatId: {
    type: String,
    required: true
  },
  messageId: {
    type: Number
  },
  userId: {
    type: Number
  },
  // Tipo da mensagem
  messageType: {
    type: String,
    enum: [
      'text', 'photo', 'video', 'audio', 'voice', 'document', 'sticker',
      'location', 'contact', 'poll', 'venue', 'animation', 'video_note',
      'menu', 'promotional', 'order_update', 'welcome', 'help', 'error',
      'campaign', 'broadcast', 'notification', 'reminder'
    ],
    required: true
  },
  // Direção da mensagem
  direction: {
    type: String,
    enum: ['incoming', 'outgoing'],
    required: true
  },
  // Conteúdo
  content: {
    type: String,
    required: true
  },
  originalContent: {
    type: String // Conteúdo original antes de processamento
  },
  // Mídia
  media: {
    type: {
      type: String,
      enum: ['photo', 'video', 'audio', 'voice', 'document', 'sticker', 'animation']
    },
    fileId: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // Para áudio/vídeo
    width: Number,    // Para foto/vídeo
    height: Number,   // Para foto/vídeo
    thumbnail: {
      fileId: String,
      width: Number,
      height: Number,
      fileSize: Number
    }
  },
  // Status da mensagem
  status: {
    type: String,
    enum: ['pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'],
    default: 'pending'
  },
  // Informações de envio
  sentBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' // Admin que enviou a mensagem
  },
  sentAt: {
    type: Date
  },
  deliveredAt: {
    type: Date
  },
  readAt: {
    type: Date
  },
  // Erro (se houver)
  error: {
    code: String,
    message: String,
    details: mongoose.Schema.Types.Mixed
  },
  // Campanha (se faz parte de uma)
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TelegramCampaign'
  },
  // Contexto da conversa
  replyToMessageId: {
    type: Number
  },
  forwardFrom: {
    userId: Number,
    firstName: String,
    lastName: String,
    username: String,
    chatId: String
  },
  // Botões inline (se houver)
  inlineKeyboard: [[
    {
      text: String,
      callback_data: String,
      url: String,
      switch_inline_query: String,
      switch_inline_query_current_chat: String
    }
  ]],
  // Callback query (se for resposta a botão)
  callbackQuery: {
    id: String,
    data: String,
    message: mongoose.Schema.Types.Mixed
  },
  // Localização (se for mensagem de localização)
  location: {
    latitude: Number,
    longitude: Number,
    live_period: Number,
    heading: Number,
    proximity_alert_radius: Number
  },
  // Contato (se for mensagem de contato)
  contact: {
    phone_number: String,
    first_name: String,
    last_name: String,
    user_id: Number,
    vcard: String
  },
  // Enquete (se for mensagem de enquete)
  poll: {
    id: String,
    question: String,
    options: [{
      text: String,
      voter_count: Number
    }],
    total_voter_count: Number,
    is_closed: Boolean,
    is_anonymous: Boolean,
    type: String,
    allows_multiple_answers: Boolean
  },
  // Processamento
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  processingResult: {
    action: String,
    response: String,
    data: mongoose.Schema.Types.Mixed
  },
  // Métricas
  metrics: {
    opened: {
      type: Boolean,
      default: false
    },
    openedAt: Date,
    clicked: {
      type: Boolean,
      default: false
    },
    clickedAt: Date,
    converted: {
      type: Boolean,
      default: false
    },
    convertedAt: Date,
    conversionValue: Number
  },
  // Tags para organização
  tags: [String],
  // Prioridade
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  // Agendamento
  scheduledFor: {
    type: Date
  },
  // Tentativas de envio
  attempts: {
    type: Number,
    default: 0
  },
  maxAttempts: {
    type: Number,
    default: 3
  },
  nextAttemptAt: {
    type: Date
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
telegramMessageSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Definir sentAt se status mudou para sent
  if (this.isModified('status') && this.status === 'sent' && !this.sentAt) {
    this.sentAt = new Date();
  }
  
  // Definir deliveredAt se status mudou para delivered
  if (this.isModified('status') && this.status === 'delivered' && !this.deliveredAt) {
    this.deliveredAt = new Date();
  }
  
  // Definir readAt se status mudou para read
  if (this.isModified('status') && this.status === 'read' && !this.readAt) {
    this.readAt = new Date();
  }
  
  next();
});

// Métodos do schema
telegramMessageSchema.methods.markAsRead = function() {
  this.status = 'read';
  this.readAt = new Date();
  if (this.metrics) {
    this.metrics.opened = true;
    this.metrics.openedAt = new Date();
  }
  return this.save();
};

telegramMessageSchema.methods.markAsClicked = function() {
  if (this.metrics) {
    this.metrics.clicked = true;
    this.metrics.clickedAt = new Date();
  }
  return this.save();
};

telegramMessageSchema.methods.markAsConverted = function(value = 0) {
  if (this.metrics) {
    this.metrics.converted = true;
    this.metrics.convertedAt = new Date();
    this.metrics.conversionValue = value;
  }
  return this.save();
};

telegramMessageSchema.methods.incrementAttempt = function() {
  this.attempts += 1;
  if (this.attempts < this.maxAttempts) {
    // Próxima tentativa em 5 minutos * número de tentativas
    this.nextAttemptAt = new Date(Date.now() + (5 * 60 * 1000 * this.attempts));
  }
  return this.save();
};

telegramMessageSchema.methods.canRetry = function() {
  return this.attempts < this.maxAttempts && 
         this.status === 'failed' && 
         (!this.nextAttemptAt || this.nextAttemptAt <= new Date());
};

// Statics
telegramMessageSchema.statics.getMessageStats = function(storeId, dateFrom, dateTo) {
  const match = { storeId };
  
  if (dateFrom || dateTo) {
    match.createdAt = {};
    if (dateFrom) match.createdAt.$gte = dateFrom;
    if (dateTo) match.createdAt.$lte = dateTo;
  }
  
  return this.aggregate([
    { $match: match },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] } },
        read: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
        failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } },
        opened: { $sum: { $cond: ['$metrics.opened', 1, 0] } },
        clicked: { $sum: { $cond: ['$metrics.clicked', 1, 0] } },
        converted: { $sum: { $cond: ['$metrics.converted', 1, 0] } }
      }
    }
  ]);
};

// Índices
telegramMessageSchema.index({ storeId: 1, chatId: 1, createdAt: -1 });
telegramMessageSchema.index({ storeId: 1, messageType: 1 });
telegramMessageSchema.index({ storeId: 1, direction: 1 });
telegramMessageSchema.index({ storeId: 1, status: 1 });
telegramMessageSchema.index({ storeId: 1, campaignId: 1 });
telegramMessageSchema.index({ storeId: 1, sentBy: 1 });
telegramMessageSchema.index({ scheduledFor: 1 });
telegramMessageSchema.index({ nextAttemptAt: 1 });
telegramMessageSchema.index({ createdAt: -1 });
telegramMessageSchema.index({ processed: 1, createdAt: 1 });

export const TelegramMessage = mongoose.model('TelegramMessage', telegramMessageSchema);