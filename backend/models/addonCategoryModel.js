import mongoose from 'mongoose';

const addonCategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  isRequired: {
    type: Boolean,
    default: false
  },
  maxSelections: {
    type: Number,
    default: 1
  },
  minSelections: {
    type: Number,
    default: 0
  },
  addons: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    description: {
      type: String,
      trim: true
    },
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Índices para melhor performance
addonCategorySchema.index({ storeId: 1, isActive: 1 });
addonCategorySchema.index({ storeId: 1, order: 1 });

const AddonCategory = mongoose.model('AddonCategory', addonCategorySchema);

export default AddonCategory;