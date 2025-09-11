import mongoose from 'mongoose';

const telegramConfigSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    unique: true
  },
  token: {
    type: String,
    required: true
  },
  webhookUrl: {
    type: String,
    default: ''
  },
  adminChatId: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: false
  },
  botInfo: {
    id: Number,
    first_name: String,
    username: String,
    can_join_groups: Boolean,
    can_read_all_group_messages: Boolean,
    supports_inline_queries: Boolean
  },
  webhookInfo: {
    url: String,
    has_custom_certificate: Boolean,
    pending_update_count: Number,
    last_error_date: Date,
    last_error_message: String,
    max_connections: Number,
    allowed_updates: [String]
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
telegramConfigSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Índices
telegramConfigSchema.index({ storeId: 1 });
telegramConfigSchema.index({ isActive: 1 });

export const TelegramConfig = mongoose.model('TelegramConfig', telegramConfigSchema);