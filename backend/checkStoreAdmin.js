import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';
import bcrypt from 'bcrypt';

const checkStoreAdmin = async () => {
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
        console.log('   Store ID:', storeAdmin.storeId);
        console.log('   Criado em:', storeAdmin.createdAt);

        // Verificar senha
        console.log('\n🔐 Verificando senha...');
        const passwordMatch = await bcrypt.compare('admin123', storeAdmin.password);
        console.log('   Senha "admin123" confere:', passwordMatch);

        // Verificar se tem loja associada
        if (storeAdmin.storeId) {
            console.log('\n🏪 Loja associada encontrada:');
            console.log('   ID da Loja:', storeAdmin.storeId._id);
            console.log('   Nome da Loja:', storeAdmin.storeId.name);
            console.log('   Status da Loja:', storeAdmin.storeId.status);
            console.log('   Ativa:', storeAdmin.storeId.isActive);
        } else {
            console.log('\n❌ Nenhuma loja associada ao usuário');
            
            // Buscar todas as lojas para ver se existe alguma
            console.log('\n🔍 Buscando todas as lojas...');
            const allStores = await Store.find({});
            console.log('   Total de lojas:', allStores.length);
            
            if (allStores.length > 0) {
                console.log('   Lojas encontradas:');
                allStores.forEach((store, index) => {
                    console.log(`   ${index + 1}. ${store.name} (ID: ${store._id}, Status: ${store.status})`);
                });
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

checkStoreAdmin();