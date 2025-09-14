import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';
import 'dotenv/config';

const createAdminUser = async () => {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');

        // Verificar se já existe um usuário admin
        const existingAdmin = await userModel.findOne({ email: 'admin@admin.com' });
        
        if (existingAdmin) {
            console.log('Usuário admin já existe:', existingAdmin.email);
            
            // Verificar se tem loja associada
            if (existingAdmin.storeId) {
                const store = await Store.findById(existingAdmin.storeId);
                console.log('Loja associada:', store ? store.name : 'Não encontrada');
            } else {
                console.log('Admin não tem loja associada');
                
                // Buscar primeira loja ativa
                const firstStore = await Store.findOne({ status: 'active' });
                if (firstStore) {
                    existingAdmin.storeId = firstStore._id;
                    await existingAdmin.save();
                    console.log('Loja associada ao admin:', firstStore.name);
                }
            }
        } else {
            // Buscar primeira loja ativa
            const firstStore = await Store.findOne({ status: 'active' });
            
            if (!firstStore) {
                console.log('Nenhuma loja ativa encontrada. Criando loja de teste...');
                return;
            }

            // Criar usuário admin
            const hashedPassword = await bcrypt.hash('123456', 10);
            
            const adminUser = new userModel({
                name: 'Admin',
                email: 'admin@admin.com',
                password: hashedPassword,
                role: 'store_admin',
                storeId: firstStore._id
            });

            await adminUser.save();
            console.log('Usuário admin criado com sucesso!');
            console.log('Email: admin@admin.com');
            console.log('Senha: 123456');
            console.log('Loja associada:', firstStore.name);
        }

        // Listar todas as lojas
        const stores = await Store.find();
        console.log('\nLojas no banco:');
        stores.forEach(store => {
            console.log(`- ${store.name} (${store.status}) - ID: ${store._id}`);
        });

        // Listar todos os usuários
        const users = await userModel.find();
        console.log('\nUsuários no banco:');
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email}) - Role: ${user.role} - Store: ${user.storeId}`);
        });

    } catch (error) {
        console.error('Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\nConexão MongoDB fechada');
    }
};

createAdminUser();