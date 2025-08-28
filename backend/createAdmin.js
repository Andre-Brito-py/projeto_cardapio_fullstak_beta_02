import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import userModel from './models/userModel.js';
import { connectDB } from './config/db.js';

const createAdminUser = async () => {
    try {
        // Conectar ao banco de dados
        await connectDB();
        console.log('Conectado ao MongoDB');

        const adminEmail = 'admin@fooddelivery.com';
        const adminPassword = 'admin123';
        const adminName = 'Administrator';

        // Verificar se o usuário já existe
        const existingUser = await userModel.findOne({ email: adminEmail });
        
        if (existingUser) {
            console.log('⚠️  Usuário admin já existe!');
            console.log('Email:', existingUser.email);
            console.log('Nome:', existingUser.name);
            
            // Atualizar a senha do usuário existente
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            await userModel.findOneAndUpdate(
                { email: adminEmail },
                { password: hashedPassword }
            );
            console.log('✅ Senha do admin atualizada!');
        } else {
            // Criar novo usuário admin
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            
            const adminUser = new userModel({
                name: adminName,
                email: adminEmail,
                password: hashedPassword
            });

            await adminUser.save();
            console.log('✅ Usuário admin criado com sucesso!');
        }

        console.log('\n🔐 CREDENCIAIS DO PAINEL ADMINISTRATIVO');
        console.log('=====================================');
        console.log('Email:', adminEmail);
        console.log('Senha:', adminPassword);
        console.log('\n📋 INSTRUÇÕES:');
        console.log('1. Acesse o painel admin em: http://localhost:5174 (ADMIN)');
        console.log('2. Use as credenciais acima para fazer login');
        console.log('3. ⚠️  IMPORTANTE: Altere a senha após o primeiro login!');
        console.log('\n✅ Sistema de login configurado com sucesso!');
        
        // Verificar se o usuário foi salvo corretamente
        const savedUser = await userModel.findOne({ email: adminEmail });
        if (savedUser) {
            console.log('\n✅ Verificação: Usuário encontrado no banco de dados');
            console.log('ID:', savedUser._id);
            console.log('Nome:', savedUser.name);
            console.log('Email:', savedUser.email);
        } else {
            console.log('\n❌ Erro: Usuário não foi encontrado no banco de dados');
        }
        
    } catch (error) {
        console.error('❌ Erro ao criar usuário admin:', error);
    } finally {
        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
        process.exit(0);
    }
};

// Executar sempre que o script for chamado
createAdminUser();

export { createAdminUser };
export const adminCredentials = {
    email: 'admin@fooddelivery.com',
    password: 'admin123'
};