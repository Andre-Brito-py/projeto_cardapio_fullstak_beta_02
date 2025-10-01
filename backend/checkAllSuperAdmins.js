import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAllSuperAdmins() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');
        
        console.log('🔍 VERIFICANDO TODOS OS USUÁRIOS SUPER ADMIN');
        console.log('============================================');
        
        const superAdmins = await userModel.find({ role: 'super_admin' });
        
        if (superAdmins.length === 0) {
            console.log('❌ Nenhum usuário super admin encontrado');
        } else {
            console.log(`✅ Encontrados ${superAdmins.length} usuário(s) super admin:\n`);
            
            superAdmins.forEach((user, index) => {
                console.log(`--- Super Admin ${index + 1} ---`);
                console.log(`👤 Nome: ${user.name}`);
                console.log(`📧 Email: ${user.email}`);
                console.log(`🔑 Role: ${user.role}`);
                console.log(`✅ Ativo: ${user.isActive}`);
                console.log(`📅 Criado em: ${user.createdAt}`);
                console.log(`🔒 Hash da senha: ${user.password.substring(0, 30)}...`);
                console.log('');
            });
        }
        
        console.log('🔍 VERIFICANDO TODOS OS USUÁRIOS (QUALQUER ROLE)');
        console.log('===============================================');
        
        const allUsers = await userModel.find({});
        console.log(`Total de usuários: ${allUsers.length}\n`);
        
        allUsers.forEach((user, index) => {
            console.log(`--- Usuário ${index + 1} ---`);
            console.log(`👤 Nome: ${user.name}`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔑 Role: ${user.role}`);
            console.log(`✅ Ativo: ${user.isActive}`);
            console.log(`📅 Criado em: ${user.createdAt}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('🔌 Fechando conexão com MongoDB');
        await mongoose.connection.close();
    }
}

checkAllSuperAdmins();