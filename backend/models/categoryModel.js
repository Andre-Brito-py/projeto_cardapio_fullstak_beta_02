import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ""
    },
    isActive: {
        type: Boolean,
        default: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    }
}, {
    timestamps: true
});

// Índice composto para garantir que o nome seja único por loja
categorySchema.index({ name: 1, storeId: 1 }, { unique: true });

const categoryModel = mongoose.models.category || mongoose.model("category", categorySchema);

export default categoryModel;