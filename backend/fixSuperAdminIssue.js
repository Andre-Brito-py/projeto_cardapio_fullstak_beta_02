import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

async function fixSuperAdminIssue() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');
        
        console.log('🔍 CORRIGINDO PROBLEMA DOS SUPER ADMINS DUPLICADOS');
        console.log('================================================');
        
        // Buscar todos os super admins
        const superAdmins = await userModel.find({ role: 'super_admin' });
        console.log(`Encontrados ${superAdmins.length} usuários super admin:\n`);
        
        superAdmins.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - Criado em: ${user.createdAt}`);
        });
        
        console.log('\n🗑️ Removendo usuário super admin antigo...');
        
        // Remover o usuário antigo (superadmin@sistema.com)
        const deletedOldAdmin = await userModel.deleteOne({ 
            email: 'superadmin@sistema.com',
            role: 'super_admin'
        });
        
        if (deletedOldAdmin.deletedCount > 0) {
            console.log('✅ Usuário antigo removido com sucesso');
        } else {
            console.log('⚠️ Usuário antigo não encontrado ou já removido');
        }
        
        // Verificar se o usuário correto ainda existe
        const correctAdmin = await userModel.findOne({ 
            email: 'superadmin@fooddelivery.com',
            role: 'super_admin'
        });
        
        if (correctAdmin) {
            console.log('✅ Usuário correto ainda existe:', correctAdmin.name, '(' + correctAdmin.email + ')');
            
            // Verificar se a senha está correta
            const isPasswordCorrect = await bcrypt.compare('superadmin123', correctAdmin.password);
            console.log('🔑 Senha correta:', isPasswordCorrect ? '✅ SIM' : '❌ NÃO');
            
        } else {
            console.log('❌ Usuário correto não encontrado! Criando novamente...');
            
            // Criar o usuário correto novamente
            const hashedPassword = await bcrypt.hash('superadmin123', 10);
            
            const newSuperAdmin = new userModel({
                name: 'Super Admin',
                email: 'superadmin@fooddelivery.com',
                password: hashedPassword,
                role: 'super_admin',
                isActive: true
            });
            
            await newSuperAdmin.save();
            console.log('✅ Super Admin correto criado com sucesso');
        }
        
        console.log('\n🔍 VERIFICAÇÃO FINAL');
        console.log('==================');
        
        const finalSuperAdmins = await userModel.find({ role: 'super_admin' });
        console.log(`Total de super admins após correção: ${finalSuperAdmins.length}`);
        
        finalSuperAdmins.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão com MongoDB');
        await mongoose.connection.close();
    }
}

fixSuperAdminIssue();