import mongoose from 'mongoose';

const telegramClientSchema = new mongoose.Schema({
    // Identificação do cliente no Telegram
    telegramId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    
    // Informações básicas do cliente
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
    
    // Informações de contato
    phoneNumber: {
        type: String,
        default: ''
    },
    
    // Status do cliente
    isActive: {
        type: Boolean,
        default: true
    },
    
    isBlocked: {
        type: Boolean,
        default: false
    },
    
    // Preferências do cliente
    language: {
        type: String,
        default: 'pt-BR'
    },
    
    // Estatísticas de interação
    totalMessages: {
        type: Number,
        default: 0
    },
    
    lastInteraction: {
        type: Date,
        default: Date.now
    },
    
    // Dados para campanhas
    acceptsPromotions: {
        type: Boolean,
        default: true
    },
    
    // Tags para segmentação
    tags: [{
        type: String
    }],
    
    // Notas administrativas
    notes: {
        type: String,
        default: ''
    }
    
}, {
    timestamps: true
});

// Índices para otimização
telegramClientSchema.index({ telegramId: 1 });
telegramClientSchema.index({ isActive: 1 });
telegramClientSchema.index({ lastInteraction: -1 });
telegramClientSchema.index({ acceptsPromotions: 1 });

// Método para atualizar última interação
telegramClientSchema.methods.updateLastInteraction = function() {
    this.lastInteraction = new Date();
    this.totalMessages += 1;
    return this.save();
};

// Método para verificar se cliente está inativo
telegramClientSchema.methods.isInactive = function(days = 30) {
    const inactiveDate = new Date();
    inactiveDate.setDate(inactiveDate.getDate() - days);
    return this.lastInteraction < inactiveDate;
};

const TelegramClient = mongoose.model('TelegramClient', telegramClientSchema);

export default TelegramClient;