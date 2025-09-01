import mongoose from "mongoose";

const productSuggestionSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    },
    suggestedProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    title: {
        type: String,
        default: "Que tal adicionar?"
    },
    description: {
        type: String,
        default: ""
    },
    order: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
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
productSuggestionSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

productSuggestionSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

// Índice composto para evitar sugestões duplicadas
productSuggestionSchema.index({ productId: 1, suggestedProductId: 1, storeId: 1 }, { unique: true });

const ProductSuggestion = mongoose.models.ProductSuggestion || mongoose.model("ProductSuggestion", productSuggestionSchema);

export default ProductSuggestion;