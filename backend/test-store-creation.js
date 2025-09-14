import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import categoryModel from './models/categoryModel.js';
import userModel from './models/userModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        // Verificar se já existe uma conexão ativa
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Usando conexão MongoDB existente');
            return;
        }
        
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            maxPoolSize: 10
        };
        
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin', mongoOptions);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Função para testar criação de loja diretamente no banco
const testStoreCreation = async () => {
    try {
        console.log('🧪 Iniciando teste de criação de loja...');
        
        // Importar o controller diretamente
        const { createStore } = await import('./controllers/storeController.js');
        const { setupDefaultCategories } = await import('./setup-default-categories.js');
        
        // Dados de teste
        const testStoreData = {
            name: 'Loja Teste Banner ' + Date.now(),
            description: 'Loja para testar banner e categorias padrão',
            restaurantAddress: 'Rua Teste, 123',
            street: 'Rua Teste',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000',
            ownerName: 'Proprietário Teste',
            ownerEmail: 'teste' + Date.now() + '@banner.com',
            ownerPassword: 'senha123'
        };
        
        // Simular req e res
        const req = { body: testStoreData };
        const res = {
            json: (data) => {
                console.log('📤 Resposta do controller:', data);
                return data;
            }
        };
        
        // Chamar o controller diretamente
        await createStore(req, res);
        
        // Buscar a loja criada para verificar
        const createdStore = await Store.findOne({ name: testStoreData.name });
        
        if (createdStore) {
            console.log('✅ Loja encontrada no banco:', createdStore.name);
            console.log('🖼️ Banner da loja:', createdStore.customization?.bannerImage);
            console.log('📂 Categorias padrão habilitadas:', createdStore.customization?.defaultCategories);
            
            // Verificar se as categorias foram criadas
            const categories = await categoryModel.find({ storeId: createdStore._id });
            console.log('📋 Categorias criadas:', categories.length);
            
            categories.forEach(category => {
                console.log(`  - ${category.name}: ${category.image}`);
            });
            
            if (createdStore.customization?.bannerImage === 'banner_principal.png') {
                console.log('✅ Banner padrão configurado corretamente!');
            } else {
                console.log('❌ Banner padrão não foi configurado');
            }
            
            if (categories.length > 0) {
                console.log('✅ Categorias padrão criadas com sucesso!');
            } else {
                console.log('❌ Categorias padrão não foram criadas');
            }
            
        } else {
            console.log('❌ Loja não foi encontrada no banco de dados');
        }
        
    } catch (error) {
        console.error('❌ Erro no teste:', error);
    } finally {
        // Fechar conexão apenas no final do teste
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar teste
const runTest = async () => {
    await connectDB();
    await testStoreCreation();
    process.exit(0);
};

runTest();