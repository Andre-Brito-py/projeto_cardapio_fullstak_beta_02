import mongoose from 'mongoose';
import userModel from './models/userModel.js';

// Conectar ao MongoDB
await mongoose.connect('mongodb://localhost:27017/fooddelivery');

try {
    console.log('🔍 Conectado ao MongoDB, procurando usuários...');
    
    // Buscar todos os usuários
    const allUsers = await userModel.find({});
    console.log('📊 Total de usuários no banco:', allUsers.length);
    
    // Buscar especificamente super admins
    const superAdmins = await userModel.find({ role: 'super_admin' });
    console.log('👑 Total de super admins:', superAdmins.length);
    
    superAdmins.forEach((user, index) => {
        console.log(`Super Admin ${index + 1}:`, {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            isActive: user.isActive,
            hasPassword: !!user.password
        });
    });
    
    // Buscar especificamente o usuário admin@fooddelivery.com
    const specificUser = await userModel.findOne({ email: 'admin@fooddelivery.com' });
    console.log('🎯 Usuário admin@fooddelivery.com encontrado:', specificUser ? 'SIM' : 'NÃO');
    
    if (specificUser) {
        console.log('Dados completos:', {
            id: specificUser._id,
            name: specificUser.name,
            email: specificUser.email,
            role: specificUser.role,
            isActive: specificUser.isActive,
            storeId: specificUser.storeId
        });
    }
    
} catch (error) {
    console.error('❌ Erro:', error);
} finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
}