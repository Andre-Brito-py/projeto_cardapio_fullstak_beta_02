import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    order: {
        type: Number,
        default: 0
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'food',
        required: false
    }
}, {
    timestamps: true
});

const bannerModel = mongoose.models.banner || mongoose.model("banner", bannerSchema);

export default bannerModel;