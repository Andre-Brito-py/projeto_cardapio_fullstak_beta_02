import mongoose from 'mongoose';

const whatsappConfigSchema = mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true,
        unique: true
    },
    // Configurações da API do WhatsApp Business
    accessToken: {
        type: String,
        required: false
    },
    phoneNumberId: {
        type: String,
        required: false
    },
    businessAccountId: {
        type: String,
        required: false
    },
    webhookVerifyToken: {
        type: String,
        required: false
    },
    // Configurações do WhatsApp Web (alternativa)
    useWhatsAppWeb: {
        type: Boolean,
        default: false
    },
    qrCode: {
        type: String,
        required: false
    },
    sessionData: {
        type: String,
        required: false
    },
    // Status da conexão
    isConnected: {
        type: Boolean,
        default: false
    },
    connectionStatus: {
        type: String,
        enum: ['disconnected', 'connecting', 'connected', 'error'],
        default: 'disconnected'
    },
    lastConnectionAt: {
        type: Date
    },
    // Configurações da Lisa AI
    lisaEnabled: {
        type: Boolean,
        default: true
    },
    autoReply: {
        type: Boolean,
        default: true
    },
    welcomeMessage: {
        type: String,
        default: 'Olá! Sou a Lisa, sua assistente virtual. Como posso ajudá-lo hoje?'
    },
    // Horário de funcionamento
    businessHours: {
        enabled: {
            type: Boolean,
            default: false
        },
        schedule: {
            monday: { start: String, end: String, active: Boolean },
            tuesday: { start: String, end: String, active: Boolean },
            wednesday: { start: String, end: String, active: Boolean },
            thursday: { start: String, end: String, active: Boolean },
            friday: { start: String, end: String, active: Boolean },
            saturday: { start: String, end: String, active: Boolean },
            sunday: { start: String, end: String, active: Boolean }
        },
        outsideHoursMessage: {
            type: String,
            default: 'Obrigado pelo contato! Nosso horário de atendimento é de segunda a sexta, das 9h às 18h. Retornaremos assim que possível.'
        }
    }
}, {
    timestamps: true
});

const WhatsAppConfig = mongoose.model('WhatsAppConfig', whatsappConfigSchema);

export default WhatsAppConfig;