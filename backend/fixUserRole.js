import mongoose from 'mongoose';
import userModel from './models/userModel.js';

const fixUserRole = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Buscar o usuário
        console.log('🔍 Buscando usuário admin@fooddelivery.com...');
        const user = await userModel.findOne({ 
            email: 'admin@fooddelivery.com'
        });

        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }

        console.log('✅ Usuário encontrado:');
        console.log('   ID:', user._id);
        console.log('   Nome:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role atual:', user.role);
        console.log('   Store ID:', user.storeId);

        // Corrigir o role
        console.log('\n🔄 Corrigindo role para store_admin...');
        user.role = 'store_admin';
        user.name = 'Admin da Loja'; // Corrigir o nome também
        await user.save();

        console.log('✅ Usuário atualizado com sucesso!');
        console.log('   Novo role:', user.role);
        console.log('   Novo nome:', user.name);

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

fixUserRole();