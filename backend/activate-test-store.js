import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import categoryModel from './models/categoryModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/mern-food-delivery-app?authSource=admin');
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Função para ativar loja de teste e verificar configurações
const activateTestStore = async () => {
    try {
        console.log('🔍 Buscando loja de teste mais recente...');
        
        // Buscar a loja de teste mais recente
        const testStore = await Store.findOne({ 
            name: { $regex: /teste|test/i } 
        }).sort({ createdAt: -1 });
        
        if (!testStore) {
            console.log('❌ Nenhuma loja de teste encontrada');
            return;
        }
        
        console.log('📋 Loja encontrada:', testStore.name);
        console.log('📋 Status atual:', testStore.status);
        console.log('📋 Banner:', testStore.customization?.bannerImage);
        console.log('📋 Categorias padrão habilitadas:', testStore.customization?.defaultCategories);
        
        // Ativar a loja
        testStore.status = 'active';
        testStore.subscription.status = 'trial';
        await testStore.save();
        
        console.log('✅ Loja ativada com sucesso!');
        
        // Verificar categorias criadas para esta loja
        const categories = await categoryModel.find({ storeId: testStore._id });
        console.log('\n📂 Categorias encontradas:', categories.length);
        
        categories.forEach(category => {
            console.log(`  - ${category.name}: ${category.image} (Ativa: ${category.isActive})`);
        });
        
        // Verificar se o banner padrão está configurado
        if (testStore.customization?.bannerImage === 'banner_principal.png') {
            console.log('\n✅ Banner padrão configurado corretamente!');
        } else {
            console.log('\n❌ Banner padrão não configurado. Valor atual:', testStore.customization?.bannerImage);
        }
        
        // Verificar se as categorias padrão estão habilitadas
        if (testStore.customization?.defaultCategories === true) {
            console.log('✅ Categorias padrão habilitadas!');
        } else {
            console.log('❌ Categorias padrão não habilitadas. Valor atual:', testStore.customization?.defaultCategories);
        }
        
        // Verificar se as categorias foram criadas
        if (categories.length >= 8) {
            console.log('✅ Todas as categorias padrão foram criadas!');
        } else {
            console.log(`❌ Apenas ${categories.length} categorias foram criadas (esperado: 8)`);
        }
        
        console.log('\n📋 Informações da loja ativada:');
        console.log('- ID:', testStore._id);
        console.log('- Nome:', testStore.name);
        console.log('- Slug:', testStore.slug);
        console.log('- Status:', testStore.status);
        console.log('- Subscription Status:', testStore.subscription?.status);
        
    } catch (error) {
        console.error('❌ Erro ao ativar loja de teste:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar
const run = async () => {
    await connectDB();
    await activateTestStore();
    process.exit(0);
};

run();