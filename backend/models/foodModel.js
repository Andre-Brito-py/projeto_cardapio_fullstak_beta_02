import mongoose from "mongoose";

const foodSchema = new mongoose.Schema({
    name: {type: String,required: true},
    description: {type: String,required: true},
    price: {type: Number,required: true},
    image: {type: String,required: true},
    category: {type: String,required: true},
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: false
    },
    // Sistema antigo de extras (mantido para compatibilidade)
    extras: {
        type: [{
            name: {type: String, required: true},
            price: {type: Number, required: true},
            description: {type: String, default: ""}
        }],
        default: []
    },
    // Novo sistema inline de categorias de adicionais
    inlineAddonCategories: {
        type: [{
            name: {type: String, required: true},
            description: {type: String, default: ""}
        }],
        default: []
    },
    // Adicionais organizados por categoria (novo sistema)
    categoryAddons: {
        type: mongoose.Schema.Types.Mixed, // Objeto com chaves sendo nomes de categorias
        default: {}
    },
    // Flag para determinar qual sistema usar
    useOldSystem: {
        type: Boolean,
        default: true // Por padrão usa o sistema antigo para compatibilidade
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
})

// Middleware para atualizar updatedAt
foodSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

foodSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const foodModel = mongoose.models.food || mongoose.model("food",foodSchema);

export default foodModel;