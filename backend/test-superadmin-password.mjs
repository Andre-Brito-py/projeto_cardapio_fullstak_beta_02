import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import userModel from './models/userModel.js';

// Conectar ao MongoDB
await mongoose.connect('mongodb://localhost:27017/fooddelivery');

try {
    console.log('🔍 Conectado ao MongoDB, testando senhas...');
    
    // Buscar o super admin existente
    const superAdmin = await userModel.findOne({ email: 'superamdin@gmail.com', role: 'super_admin' });
    
    if (!superAdmin) {
        console.log('❌ Super admin não encontrado');
        process.exit(1);
    }
    
    console.log('✅ Super admin encontrado:', superAdmin.email);
    console.log('Hash da senha:', superAdmin.password);
    
    // Lista de senhas para testar
    const passwordsToTest = [
        'superadmin123',
        'admin123',
        '123456',
        'admin',
        'password',
        'andre123',
        'Andre123',
        'superamdin123',
        'superamdin',
        '12345678'
    ];
    
    console.log('🔐 Testando senhas...');
    
    for (const password of passwordsToTest) {
        try {
            const isMatch = await bcrypt.compare(password, superAdmin.password);
            console.log(`Senha "${password}": ${isMatch ? '✅ CORRETA' : '❌ incorreta'}`);
            
            if (isMatch) {
                console.log(`🎉 Senha encontrada: ${password}`);
                break;
            }
        } catch (error) {
            console.log(`Erro ao testar senha "${password}":`, error.message);
        }
    }
    
} catch (error) {
    console.error('❌ Erro:', error);
} finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado do MongoDB');
}