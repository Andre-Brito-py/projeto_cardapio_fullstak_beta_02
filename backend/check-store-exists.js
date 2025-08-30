import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import userModel from './models/userModel.js';
import 'dotenv/config';

const checkStoreExists = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        const testStoreId = '676b4b7b8b8b8b8b8b8b8b8b';
        console.log(`\n🔍 Verificando loja com ID: ${testStoreId}`);
        
        // Verificar se a loja existe
        const store = await Store.findById(testStoreId);
        
        if (store) {
            console.log('✅ Loja encontrada:');
            console.log(`   - Nome: ${store.name}`);
            console.log(`   - Slug: ${store.slug}`);
            console.log(`   - Status: ${store.status}`);
            console.log(`   - Ativa: ${store.isActive}`);
        } else {
            console.log('❌ Loja não encontrada.');
            
            // Buscar um usuário admin existente para usar como owner
            const adminUser = await userModel.findOne({ role: 'store_admin' });
            
            if (!adminUser) {
                console.log('❌ Nenhum usuário admin encontrado. Criando usuário admin primeiro...');
                
                // Criar usuário admin
                const newAdmin = new userModel({
                    name: 'Admin Teste',
                    email: 'admin@teste.com',
                    password: '$2b$10$hash', // Hash fictício
                    role: 'store_admin',
                    isActive: true
                });
                
                await newAdmin.save();
                console.log('✅ Usuário admin criado');
                
                // Usar o novo admin como owner
                await createTestStore(testStoreId, newAdmin._id);
            } else {
                console.log(`✅ Usuário admin encontrado: ${adminUser.name}`);
                await createTestStore(testStoreId, adminUser._id);
            }
        }
        
        // Listar todas as lojas
        const allStores = await Store.find({});
        console.log(`\n🏪 Total de lojas no banco: ${allStores.length}`);
        allStores.forEach(store => {
            console.log(`   - ${store.name} (${store.slug}) - Status: ${store.status}`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

const createTestStore = async (storeId, ownerId) => {
    try {
        console.log('🏪 Criando loja de teste...');
        
        const newStore = new Store({
            _id: storeId,
            name: 'Loja de Teste Garçom',
            slug: 'loja-teste-garcom',
            description: 'Loja para testar funcionalidade de garçom',
            owner: ownerId,
            status: 'active',
            isActive: true,
            settings: {
                isOpen: true,
                deliveryFee: 5.00,
                minimumOrder: 20.00,
                restaurantAddress: 'Rua Teste, 123',
                phone: '(11) 99999-9999',
                email: 'teste@loja.com',
                workingHours: {
                    monday: { open: '08:00', close: '22:00', isOpen: true },
                    tuesday: { open: '08:00', close: '22:00', isOpen: true },
                    wednesday: { open: '08:00', close: '22:00', isOpen: true },
                    thursday: { open: '08:00', close: '22:00', isOpen: true },
                    friday: { open: '08:00', close: '22:00', isOpen: true },
                    saturday: { open: '08:00', close: '22:00', isOpen: true },
                    sunday: { open: '08:00', close: '22:00', isOpen: true }
                }
            },
            subscription: {
                plan: 'basic',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 ano
            }
        });
        
        await newStore.save();
        console.log('✅ Loja de teste criada com sucesso!');
        
        // Atualizar o usuário para associá-lo à loja
        await userModel.findByIdAndUpdate(ownerId, { storeId: storeId });
        console.log('✅ Usuário associado à loja');
        
    } catch (error) {
        console.error('❌ Erro ao criar loja:', error);
    }
};

checkStoreExists();