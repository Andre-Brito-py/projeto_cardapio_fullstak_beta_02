import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Buscar o usuário admin
        const admin = await userModel.findOne({ email: 'admin@teste.com', role: 'store_admin' });
        
        if (!admin) {
            console.log('❌ Usuário admin não encontrado');
            return;
        }
        
        console.log('👤 Usuário encontrado:', admin.name, admin.email);
        
        // Gerar hash correto para a senha 'password123'
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        
        // Atualizar a senha
        admin.password = hashedPassword;
        await admin.save();
        
        console.log('✅ Senha atualizada com sucesso!');
        console.log('📧 Email: admin@teste.com');
        console.log('🔑 Senha: password123');
        
        // Testar o login
        const testMatch = await bcrypt.compare('password123', admin.password);
        console.log('🧪 Teste de senha:', testMatch ? '✅ OK' : '❌ Falhou');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();