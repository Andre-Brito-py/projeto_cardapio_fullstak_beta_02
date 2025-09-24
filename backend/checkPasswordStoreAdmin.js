import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import storeModel from './models/storeModel.js';
import bcrypt from 'bcrypt';

const checkPasswordStoreAdmin = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Buscar o usuário store admin
        console.log('🔍 Buscando usuário store admin...');
        const storeAdmin = await userModel.findOne({ 
            email: 'admin@fooddelivery.com',
            role: 'store_admin'
        }).populate('storeId');

        if (!storeAdmin) {
            console.log('❌ Usuário store admin não encontrado');
            return;
        }

        console.log('✅ Usuário store admin encontrado:');
        console.log('   ID:', storeAdmin._id);
        console.log('   Nome:', storeAdmin.name);
        console.log('   Email:', storeAdmin.email);
        console.log('   Role:', storeAdmin.role);
        console.log('   Ativo:', storeAdmin.isActive);
        console.log('   Store ID:', storeAdmin.storeId?._id);
        console.log('   Store Nome:', storeAdmin.storeId?.name);
        console.log('   Store Status:', storeAdmin.storeId?.status);

        // Testar diferentes senhas
        const senhasParaTestar = ['admin123', 'password', '123456', 'admin', 'fooddelivery'];
        
        console.log('\n🔐 Testando senhas...');
        for (const senha of senhasParaTestar) {
            const match = await bcrypt.compare(senha, storeAdmin.password);
            console.log(`   Senha "${senha}": ${match ? '✅ CORRETA' : '❌ incorreta'}`);
            if (match) {
                console.log(`\n🎉 Senha encontrada: "${senha}"`);
                break;
            }
        }

        // Mostrar hash da senha para debug
        console.log('\n🔍 Hash da senha no banco:', storeAdmin.password);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

checkPasswordStoreAdmin();