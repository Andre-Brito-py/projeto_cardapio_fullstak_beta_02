import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';
import bcrypt from 'bcrypt';

const recreateStoreAdmin = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Verificar se já existe
        const existingAdmin = await userModel.findOne({ 
            email: 'admin@fooddelivery.com', 
            role: 'store_admin' 
        });

        if (existingAdmin) {
            console.log('✅ Usuário store admin já existe');
            return;
        }

        // Criar hash da senha
        console.log('🔐 Criando hash da senha...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);

        // Criar o usuário store admin
        console.log('👤 Criando usuário store admin...');
        const storeAdmin = new userModel({
            name: 'Admin da Loja',
            email: 'admin@fooddelivery.com',
            password: hashedPassword,
            role: 'store_admin',
            isActive: true,
            storeId: null // Por enquanto sem loja associada
        });

        await storeAdmin.save();
        console.log('✅ Usuário store admin criado com sucesso!');
        console.log('   ID:', storeAdmin._id);
        console.log('   Nome:', storeAdmin.name);
        console.log('   Email:', storeAdmin.email);
        console.log('   Role:', storeAdmin.role);

        // Verificar se a senha está funcionando
        console.log('\n🔐 Testando senha...');
        const passwordTest = await bcrypt.compare('admin123', storeAdmin.password);
        console.log('   Senha "admin123" confere:', passwordTest);

        console.log('\n✅ Store admin recriado com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

recreateStoreAdmin();