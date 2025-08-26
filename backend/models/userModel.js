import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    cartData:{type:Object, default:{}},
    role: {
        type: String,
        enum: ['super_admin', 'store_admin', 'customer'],
        default: 'customer'
    },
    storeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
        required: function() {
            return this.role === 'store_admin';
        }
    },
    permissions: [{
        type: String
    }],
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
},{minimize:false})

// Middleware para atualizar updatedAt
userSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Método para verificar se é super admin
userSchema.methods.isSuperAdmin = function() {
    return this.role === 'super_admin';
};

// Método para verificar se é admin de loja
userSchema.methods.isStoreAdmin = function() {
    return this.role === 'store_admin';
};

// Método para verificar se é cliente
userSchema.methods.isCustomer = function() {
    return this.role === 'customer';
};

// Método para verificar permissões
userSchema.methods.hasPermission = function(permission) {
    if (this.role === 'super_admin') return true;
    return this.permissions.includes(permission);
};

const userModel = mongoose.model.user || mongoose.model("user", userSchema);

export default userModel;