import mongoose from 'mongoose';

const whatsappMessageSchema = mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    // Identificação da conversa
    conversationId: {
        type: String,
        required: true
    },
    customerPhone: {
        type: String,
        required: true
    },
    customerName: {
        type: String,
        required: false
    },
    // Dados da mensagem
    messageId: {
        type: String,
        required: true,
        unique: true
    },
    direction: {
        type: String,
        enum: ['inbound', 'outbound'],
        required: true
    },
    messageType: {
        type: String,
        enum: ['text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'interactive'],
        default: 'text'
    },
    content: {
        text: String,
        mediaUrl: String,
        mediaType: String,
        caption: String,
        location: {
            latitude: Number,
            longitude: Number,
            address: String
        },
        contact: {
            name: String,
            phone: String
        },
        interactive: {
            type: String, // 'button', 'list'
            header: String,
            body: String,
            footer: String,
            buttons: [{
                id: String,
                title: String
            }],
            listItems: [{
                id: String,
                title: String,
                description: String
            }]
        }
    },
    // Status da mensagem
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read', 'failed'],
        default: 'sent'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    // Processamento pela Lisa AI
    processedByLisa: {
        type: Boolean,
        default: false
    },
    lisaResponse: {
        type: String,
        required: false
    },
    lisaProcessingTime: {
        type: Number, // em milissegundos
        required: false
    },
    // Contexto do pedido (se aplicável)
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: false
    },
    // Metadados
    metadata: {
        webhookData: mongoose.Schema.Types.Mixed,
        errorMessage: String,
        retryCount: {
            type: Number,
            default: 0
        }
    }
}, {
    timestamps: true
});

// Índices para otimização de consultas
whatsappMessageSchema.index({ storeId: 1, conversationId: 1, timestamp: -1 });
whatsappMessageSchema.index({ storeId: 1, customerPhone: 1, timestamp: -1 });
whatsappMessageSchema.index({ messageId: 1 }, { unique: true });

const WhatsAppMessage = mongoose.model('WhatsAppMessage', whatsappMessageSchema);

export default WhatsAppMessage;