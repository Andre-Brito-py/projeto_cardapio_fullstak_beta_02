import mongoose from 'mongoose';
import Store from './models/storeModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin');
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Debug da criação de loja
const debugStoreCreation = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Testando criação de loja...');
        
        const testName = 'Loja Debug ' + Date.now();
        const slug = testName
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        console.log('📝 Nome:', testName);
        console.log('📝 Slug gerado:', slug);
        
        // Criar ObjectId temporário
        const tempOwnerId = new mongoose.Types.ObjectId();
        
        // Dados da loja
        const storeData = {
            name: testName,
            slug: slug,
            description: 'Loja de teste para debug',
            owner: tempOwnerId,
            domain: {
                subdomain: slug
            },
            subscription: {
                plan: 'Básico',
                status: 'trial'
            },
            settings: {
                restaurantAddress: 'Rua Teste, 123',
                address: {
                    street: 'Rua Teste',
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
            customization: {
                bannerImage: 'banner_principal.png',
                defaultCategories: true
            }
        };
        
        console.log('📋 Dados da loja antes de salvar:');
        console.log('- Nome:', storeData.name);
        console.log('- Slug:', storeData.slug);
        console.log('- Subdomain:', storeData.domain.subdomain);
        console.log('- Banner:', storeData.customization.bannerImage);
        
        // Criar instância do modelo
        const store = new Store(storeData);
        
        console.log('📋 Dados da instância antes de salvar:');
        console.log('- Nome:', store.name);
        console.log('- Slug:', store.slug);
        console.log('- Subdomain:', store.domain?.subdomain);
        console.log('- Banner:', store.customization?.bannerImage);
        
        // Salvar no banco
        await store.save();
        
        console.log('✅ Loja criada com sucesso!');
        console.log('📋 Dados da loja após salvar:');
        console.log('- ID:', store._id);
        console.log('- Nome:', store.name);
        console.log('- Slug:', store.slug);
        console.log('- Subdomain:', store.domain?.subdomain);
        console.log('- Banner:', store.customization?.bannerImage);
        
        // Buscar a loja no banco para confirmar
        const savedStore = await Store.findById(store._id);
        console.log('📋 Dados da loja no banco:');
        console.log('- Nome:', savedStore.name);
        console.log('- Slug:', savedStore.slug);
        console.log('- Subdomain:', savedStore.domain?.subdomain);
        console.log('- Banner:', savedStore.customization?.bannerImage);
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar debug
debugStoreCreation();