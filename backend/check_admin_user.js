import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import Store from './models/storeModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Verificar usuários admin
        const adminUsers = await userModel.find({ role: 'store_admin' });
        console.log(`\n👤 Total de usuários admin: ${adminUsers.length}`);
        
        if (adminUsers.length > 0) {
            console.log('\n🔑 Lista de usuários admin:');
            for (const admin of adminUsers) {
                console.log(`- ${admin.name} (${admin.email})`);
                console.log(`  ID: ${admin._id}`);
                console.log(`  StoreId: ${admin.storeId}`);
                console.log(`  Ativo: ${admin.isActive}`);
                
                // Verificar se a loja existe
                if (admin.storeId) {
                    const store = await Store.findById(admin.storeId);
                    if (store) {
                        console.log(`  Loja: ${store.name} (${store.slug})`);
                        console.log(`  Status da loja: ${store.status}`);
                    } else {
                        console.log(`  ❌ Loja não encontrada!`);
                    }
                } else {
                    console.log(`  ❌ Sem loja associada!`);
                }
                console.log('');
            }
        } else {
            console.log('❌ Nenhum usuário admin encontrado');
            
            // Criar um usuário admin de teste
            console.log('\n📦 Criando usuário admin de teste...');
            
            // Primeiro, criar uma loja
            const testStore = new Store({
                name: 'Loja Teste',
                slug: 'loja-teste',
                description: 'Loja de teste para desenvolvimento',
                owner: new mongoose.Types.ObjectId(),
                status: 'active',
                settings: {
                    restaurantAddress: 'Rua Teste, 123',
                    isOpen: true
                }
            });
            
            const savedStore = await testStore.save();
            console.log(`✅ Loja criada: ${savedStore.name} (ID: ${savedStore._id})`);
            
            // Criar usuário admin
            const testAdmin = new userModel({
                name: 'Admin Teste',
                email: 'admin@teste.com',
                password: '$2b$10$example.hash.for.password123', // Hash de 'password123'
                role: 'store_admin',
                storeId: savedStore._id,
                isActive: true
            });
            
            const savedAdmin = await testAdmin.save();
            console.log(`✅ Admin criado: ${savedAdmin.name} (${savedAdmin.email})`);
            console.log(`   Senha: password123`);
            console.log(`   StoreId: ${savedAdmin.storeId}`);
        }
        
        // Verificar lojas
        const stores = await Store.find({});
        console.log(`\n🏪 Total de lojas: ${stores.length}`);
        
        if (stores.length > 0) {
            console.log('\n🏪 Lista de lojas:');
            stores.forEach(store => {
                console.log(`- ${store.name} (${store.slug})`);
                console.log(`  ID: ${store._id}`);
                console.log(`  Status: ${store.status}`);
                console.log(`  Owner: ${store.owner}`);
                console.log('');
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();