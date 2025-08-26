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
        required: true
    },
    extras: {
        type: [{
            name: {type: String, required: true},
            price: {type: Number, required: true},
            description: {type: String, default: ""}
        }],
        default: []
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