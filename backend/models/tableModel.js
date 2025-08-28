import mongoose from 'mongoose';

const tableSchema = new mongoose.Schema({
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  tableNumber: {
    type: String,
    required: true
  },
  displayName: {
    type: String,
    required: true // Ex: "Mesa 1", "Mesa 2", etc.
  },
  qrCode: {
    type: String,
    required: true,
    unique: true // QR code único para cada mesa
  },
  qrCodeUrl: {
    type: String // URL que será codificada no QR code
  },
  isActive: {
    type: Boolean,
    default: true
  },
  capacity: {
    type: Number,
    default: 4 // Capacidade padrão de 4 pessoas
  },
  location: {
    type: String // Localização da mesa (ex: "Área externa", "Salão principal")
  },
  notes: {
    type: String // Notas adicionais sobre a mesa
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
tableSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Índice composto para garantir que o número da mesa seja único por loja
tableSchema.index({ storeId: 1, tableNumber: 1 }, { unique: true });

// Método para gerar URL do QR code
tableSchema.methods.generateQRCodeUrl = function() {
  // URL que será acessada quando o QR code for escaneado
  // Incluirá o ID da mesa e da loja para identificação
  const storeId = this.storeId.toString ? this.storeId.toString() : this.storeId;
  return `${process.env.FRONTEND_URL || 'http://localhost:5173'}/menu/${storeId}?table=${this._id}`;
};

// Método para verificar se a mesa está ativa
tableSchema.methods.isTableActive = function() {
  return this.isActive;
};

const tableModel = mongoose.model.Table || mongoose.model('Table', tableSchema);

export default tableModel;