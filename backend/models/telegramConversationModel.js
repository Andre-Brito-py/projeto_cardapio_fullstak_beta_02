import mongoose from 'mongoose';

const telegramConversationSchema = new mongoose.Schema({
    // Identificação da loja
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    
    // Identificação da conversa
    telegramId: {
        type: String,
        required: true,
        index: true
    },
    
    // Referência ao cliente
    clientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TelegramClient',
        required: true
    },
    
    // Tipo de mensagem
    messageType: {
        type: String,
        enum: ['user', 'bot', 'admin', 'system'],
        required: true
    },
    
    // Conteúdo da mensagem
    message: {
        type: String,
        required: true
    },
    
    // ID da mensagem no Telegram
    telegramMessageId: {
        type: Number,
        required: true
    },
    
    // Contexto da conversa (para manter histórico da IA)
    context: {
        type: String,
        default: ''
    },
    
    // Metadados da mensagem
    metadata: {
        // Informações do usuário que enviou
        from: {
            id: String,
            firstName: String,
            lastName: String,
            username: String
        },
        
        // Informações do chat
        chat: {
            id: String,
            type: String
        },
        
        // Timestamp da mensagem no Telegram
        telegramDate: Date,
        
        // Tipo de conteúdo (text, photo, document, etc.)
        contentType: {
            type: String,
            default: 'text'
        },
        
        // Dados específicos do tipo de conteúdo
        contentData: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    
    // Status da mensagem
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    
    // Resposta da IA (se aplicável)
    aiResponse: {
        model: String,
        tokens: Number,
        processingTime: Number,
        confidence: Number
    },
    
    // Flags especiais
    isCommand: {
        type: Boolean,
        default: false
    },
    
    isPromotional: {
        type: Boolean,
        default: false
    },
    
    isBroadcast: {
        type: Boolean,
        default: false
    }
    
}, {
    timestamps: true
});

// Índices para otimização
telegramConversationSchema.index({ storeId: 1, telegramId: 1, createdAt: -1 });
telegramConversationSchema.index({ storeId: 1, clientId: 1, createdAt: -1 });
telegramConversationSchema.index({ storeId: 1, messageType: 1 });
telegramConversationSchema.index({ storeId: 1, createdAt: -1 });
telegramConversationSchema.index({ storeId: 1, isCommand: 1 });
telegramConversationSchema.index({ storeId: 1, isBroadcast: 1 });

// Método estático para obter histórico de conversa
telegramConversationSchema.statics.getConversationHistory = function(storeId, telegramId, limit = 50) {
    return this.find({ storeId, telegramId })
        .populate('clientId', 'firstName lastName username')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};

// Método estático para obter contexto da IA
telegramConversationSchema.statics.getAIContext = function(storeId, telegramId, limit = 10) {
    return this.find({ 
        storeId,
        telegramId, 
        messageType: { $in: ['user', 'bot'] },
        context: { $ne: '' }
    })
        .sort({ createdAt: -1 })
        .limit(limit)
        .select('message messageType context createdAt')
        .lean();
};

// Método estático para estatísticas
telegramConversationSchema.statics.getStats = function(storeId, startDate, endDate) {
    const matchStage = { storeId };
    if (startDate && endDate) {
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$messageType',
                count: { $sum: 1 },
                uniqueUsers: { $addToSet: '$telegramId' }
            }
        },
        {
            $project: {
                messageType: '$_id',
                count: 1,
                uniqueUsers: { $size: '$uniqueUsers' },
                _id: 0
            }
        }
    ]);
};

const TelegramConversation = mongoose.model('TelegramConversation', telegramConversationSchema);

export default TelegramConversation;