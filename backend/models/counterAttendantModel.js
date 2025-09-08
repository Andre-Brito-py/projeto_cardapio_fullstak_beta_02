import mongoose from "mongoose";

const counterAttendantSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: true
    },
    employeeId: {
        type: String,
        required: false // ID do funcionário (opcional)
    },
    phone: {
        type: String,
        required: false
    },
    shift: {
        type: String,
        enum: ['morning', 'afternoon', 'night', 'full_time'],
        default: 'full_time'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    permissions: {
        canCreateOrders: {
            type: Boolean,
            default: true
        },
        canViewReports: {
            type: Boolean,
            default: false
        },
        canManageProducts: {
            type: Boolean,
            default: false
        }
    },
    lastLogin: {
        type: Date
    },
    totalOrdersCreated: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Referência ao admin que criou este atendente
        required: true
    }
}, { minimize: false });

// Middleware para atualizar updatedAt
counterAttendantSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para verificar se está ativo
counterAttendantSchema.methods.isActiveAttendant = function() {
    return this.isActive;
};

// Método para incrementar contador de pedidos
counterAttendantSchema.methods.incrementOrderCount = function() {
    this.totalOrdersCreated += 1;
    return this.save();
};

// Método para verificar permissões
counterAttendantSchema.methods.hasPermission = function(permission) {
    return this.permissions[permission] || false;
};

// Índices para otimização
counterAttendantSchema.index({ storeId: 1, isActive: 1 });
counterAttendantSchema.index({ email: 1 });

const CounterAttendant = mongoose.model('CounterAttendant', counterAttendantSchema);

export default CounterAttendant;