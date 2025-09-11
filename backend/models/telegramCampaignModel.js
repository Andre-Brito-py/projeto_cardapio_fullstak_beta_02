import mongoose from 'mongoose';

const telegramCampaignSchema = new mongoose.Schema({
    // Informações básicas da campanha
    name: {
        type: String,
        required: true
    },
    
    description: {
        type: String,
        default: ''
    },
    
    // Tipo de campanha
    type: {
        type: String,
        enum: ['promotion', 'reminder', 'announcement', 'recovery', 'custom'],
        required: true
    },
    
    // Conteúdo da mensagem
    message: {
        type: String,
        required: true
    },
    
    // Configurações de agendamento
    scheduledDate: {
        type: Date,
        default: null
    },
    
    // Status da campanha
    status: {
        type: String,
        enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed'],
        default: 'draft'
    },
    
    // Critérios de segmentação
    targetCriteria: {
        // Todos os clientes ativos
        allActive: {
            type: Boolean,
            default: false
        },
        
        // Clientes inativos (dias sem interação)
        inactiveDays: {
            type: Number,
            default: null
        },
        
        // Tags específicas
        tags: [{
            type: String
        }],
        
        // Clientes específicos por ID do Telegram
        specificClients: [{
            type: String
        }],
        
        // Apenas clientes que aceitam promoções
        acceptsPromotions: {
            type: Boolean,
            default: true
        }
    },
    
    // Estatísticas de envio
    stats: {
        totalTargeted: {
            type: Number,
            default: 0
        },
        
        totalSent: {
            type: Number,
            default: 0
        },
        
        totalFailed: {
            type: Number,
            default: 0
        },
        
        totalDelivered: {
            type: Number,
            default: 0
        },
        
        totalRead: {
            type: Number,
            default: 0
        }
    },
    
    // Configurações avançadas
    settings: {
        // Intervalo entre envios (ms)
        sendInterval: {
            type: Number,
            default: 1000
        },
        
        // Máximo de tentativas em caso de falha
        maxRetries: {
            type: Number,
            default: 3
        },
        
        // Pausar campanha em caso de muitas falhas
        pauseOnFailureRate: {
            type: Number,
            default: 0.1 // 10%
        }
    },
    
    // Logs de execução
    executionLogs: [{
        timestamp: {
            type: Date,
            default: Date.now
        },
        
        event: {
            type: String,
            enum: ['created', 'scheduled', 'started', 'paused', 'resumed', 'completed', 'cancelled', 'failed']
        },
        
        message: String,
        
        data: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    }],
    
    // Usuário que criou a campanha
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Datas de execução
    startedAt: {
        type: Date,
        default: null
    },
    
    completedAt: {
        type: Date,
        default: null
    }
    
}, {
    timestamps: true
});

// Índices para otimização
telegramCampaignSchema.index({ status: 1 });
telegramCampaignSchema.index({ type: 1 });
telegramCampaignSchema.index({ scheduledDate: 1 });
telegramCampaignSchema.index({ createdBy: 1 });
telegramCampaignSchema.index({ createdAt: -1 });

// Método para adicionar log de execução
telegramCampaignSchema.methods.addExecutionLog = function(event, message, data = {}) {
    this.executionLogs.push({
        event,
        message,
        data,
        timestamp: new Date()
    });
    return this.save();
};

// Método para atualizar estatísticas
telegramCampaignSchema.methods.updateStats = function(field, increment = 1) {
    if (this.stats[field] !== undefined) {
        this.stats[field] += increment;
        return this.save();
    }
    return Promise.resolve(this);
};

// Método estático para obter campanhas agendadas
telegramCampaignSchema.statics.getScheduledCampaigns = function() {
    return this.find({
        status: 'scheduled',
        scheduledDate: { $lte: new Date() }
    }).sort({ scheduledDate: 1 });
};

// Método estático para estatísticas gerais
telegramCampaignSchema.statics.getGeneralStats = function(startDate, endDate) {
    const matchStage = {};
    if (startDate && endDate) {
        matchStage.createdAt = { $gte: startDate, $lte: endDate };
    }
    
    return this.aggregate([
        { $match: matchStage },
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 },
                totalTargeted: { $sum: '$stats.totalTargeted' },
                totalSent: { $sum: '$stats.totalSent' },
                totalFailed: { $sum: '$stats.totalFailed' }
            }
        }
    ]);
};

const TelegramCampaign = mongoose.model('TelegramCampaign', telegramCampaignSchema);

export default TelegramCampaign;