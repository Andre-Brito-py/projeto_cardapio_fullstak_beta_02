import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';

const updateStoreAdmin = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Buscar o usuário store admin
        console.log('🔍 Buscando usuário store admin...');
        const storeAdmin = await userModel.findOne({ 
            email: 'admin@fooddelivery.com'
        });

        if (!storeAdmin) {
            console.log('❌ Usuário store admin não encontrado');
            return;
        }

        console.log('✅ Usuário encontrado:');
        console.log('   ID:', storeAdmin._id);
        console.log('   Nome:', storeAdmin.name);
        console.log('   Email:', storeAdmin.email);
        console.log('   Role:', storeAdmin.role);
        console.log('   Store ID atual:', storeAdmin.storeId);

        // Buscar a loja criada
        console.log('\n🏪 Buscando loja...');
        const store = await Store.findOne({ name: 'Loja Demo' });
        
        if (!store) {
            console.log('❌ Loja não encontrada');
            return;
        }

        console.log('✅ Loja encontrada:');
        console.log('   ID:', store._id);
        console.log('   Nome:', store.name);

        // Atualizar o storeId do usuário
        console.log('\n🔄 Atualizando storeId do usuário...');
        storeAdmin.storeId = store._id;
        await storeAdmin.save();

        console.log('✅ Store admin atualizado com sucesso!');
        console.log('   Novo Store ID:', storeAdmin.storeId);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

updateStoreAdmin();