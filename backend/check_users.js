import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const checkUsers = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');
        
        // Verificar usuários existentes
        const users = await userModel.find({});
        console.log('\n=== USUÁRIOS EXISTENTES ===');
        users.forEach(user => {
            console.log(`Email: ${user.email}`);
            console.log(`Nome: ${user.name}`);
            console.log(`Role: ${user.role || 'customer'}`);
            console.log(`Ativo: ${user.isActive !== false ? 'Sim' : 'Não'}`);
            console.log('---');
        });
        
        // Criar usuário de teste se não existir
        const testUser = await userModel.findOne({ email: 'teste@exemplo.com' });
        if (!testUser) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            const newUser = new userModel({
                name: 'Usuário Teste',
                email: 'teste@exemplo.com',
                password: hashedPassword,
                role: 'customer',
                isActive: true,
                cartData: {}
            });
            await newUser.save();
            console.log('\n✅ Usuário de teste criado:');
            console.log('Email: teste@exemplo.com');
            console.log('Senha: 123456');
        } else {
            console.log('\n✅ Usuário de teste já existe:');
            console.log('Email: teste@exemplo.com');
            console.log('Senha: 123456');
        }
        
    } catch (error) {
        console.error('Erro:', error);
    } finally {
        mongoose.connection.close();
    }
};

checkUsers();