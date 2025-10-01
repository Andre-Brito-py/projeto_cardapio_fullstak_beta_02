import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';
import bcrypt from 'bcrypt';

const createStoreAndAdmin = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Verificar se já existe uma loja
        let store = await Store.findOne({ name: 'Loja Demo' });
        
        if (!store) {
            console.log('🏪 Criando loja demo...');
            
            // Primeiro criar um usuário temporário para ser o owner
            const tempOwner = new userModel({
                name: 'Owner Temporário',
                email: 'owner@lojademo.com',
                password: await bcrypt.hash('temp123', 10),
                role: 'store_admin',
                isActive: true
            });
            await tempOwner.save();
            
            store = new Store({
                name: 'Loja Demo',
                description: 'Loja de demonstração para testes',
                slug: 'loja-demo',
                owner: tempOwner._id, // Campo obrigatório
                settings: {
                    restaurantAddress: 'Rua Demo, 123 - Centro, São Paulo - SP', // Campo obrigatório
                    address: {
                        street: 'Rua Demo',
                        number: '123',
                        neighborhood: 'Centro',
                        city: 'São Paulo',
                        state: 'SP',
                        zipCode: '01000-000'
                    },
                    currency: 'BRL',
                    language: 'pt-BR',
                    timezone: 'America/Sao_Paulo'
                },
                subscription: {
                    plan: 'Básico',
                    status: 'active'
                },
                status: 'active'
            });

            await store.save();
            console.log('✅ Loja criada com sucesso!');
            console.log('   ID:', store._id);
            console.log('   Nome:', store.name);
        } else {
            console.log('✅ Loja já existe:', store.name);
        }

        // Verificar se já existe o admin
        const existingAdmin = await userModel.findOne({ 
            email: 'admin@fooddelivery.com', 
            role: 'store_admin' 
        });

        if (existingAdmin) {
            console.log('✅ Usuário store admin já existe');
            // Atualizar o storeId se necessário
            if (!existingAdmin.storeId) {
                existingAdmin.storeId = store._id;
                await existingAdmin.save();
                console.log('✅ Store ID atualizado para o admin existente');
            }
            return;
        }

        // Criar hash da senha
        console.log('\n🔐 Criando hash da senha...');
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
            storeId: store._id // Associar à loja criada
        });

        await storeAdmin.save();
        console.log('✅ Usuário store admin criado com sucesso!');
        console.log('   ID:', storeAdmin._id);
        console.log('   Nome:', storeAdmin.name);
        console.log('   Email:', storeAdmin.email);
        console.log('   Role:', storeAdmin.role);
        console.log('   Store ID:', storeAdmin.storeId);

        // Verificar se a senha está funcionando
        console.log('\n🔐 Testando senha...');
        const passwordTest = await bcrypt.compare('admin123', storeAdmin.password);
        console.log('   Senha "admin123" confere:', passwordTest);

        console.log('\n✅ Loja e store admin criados com sucesso!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

createStoreAndAdmin();