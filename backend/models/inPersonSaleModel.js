import mongoose from 'mongoose';

const inPersonSaleSchema = new mongoose.Schema({
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'store',
        required: true
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'food',
            required: true
        },
        name: {
            type: String,
            required: true
        },
        price: {
            type: Number,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        }
    }],
    total: {
        type: Number,
        required: true,
        min: 0
    },
    date: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['completed', 'cancelled'],
        default: 'completed'
    }
}, {
    timestamps: true
});

// Índices para melhor performance
inPersonSaleSchema.index({ storeId: 1, date: -1 });
inPersonSaleSchema.index({ storeId: 1, createdBy: 1 });
inPersonSaleSchema.index({ date: -1 });

const inPersonSaleModel = mongoose.models.inPersonSale || mongoose.model('inPersonSale', inPersonSaleSchema);

export default inPersonSaleModel;