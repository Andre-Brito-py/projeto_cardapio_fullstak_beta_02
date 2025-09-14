import mongoose from 'mongoose';
import Store from './models/storeModel.js';

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

// Função para ativar a loja mais recente
const activateLatestStore = async () => {
    try {
        // Buscar a loja mais recente criada
        const latestStore = await Store.findOne({
            name: { $regex: /^Loja Teste Categorias/ }
        }).sort({ createdAt: -1 });
        
        if (!latestStore) {
            console.log('❌ Nenhuma loja de teste encontrada');
            return;
        }
        
        console.log(`🏪 Loja encontrada: ${latestStore.name}`);
        console.log(`📊 Status atual: ${latestStore.status}`);
        
        // Ativar a loja
        latestStore.status = 'active';
        latestStore.subscription.status = 'trial';
        await latestStore.save();
        
        console.log('✅ Loja ativada com sucesso!');
        console.log(`📊 Novo status: ${latestStore.status}`);
        console.log(`💳 Assinatura: ${latestStore.subscription.plan} (${latestStore.subscription.status})`);
        
        return latestStore;
        
    } catch (error) {
        console.error('❌ Erro ao ativar loja:', error);
    }
};

// Função para verificar se aparece na listagem pública
const checkPublicListing = async () => {
    try {
        console.log('\n🔍 Verificando listagem pública...');
        
        // Buscar lojas públicas (mesmo critério da API)
        const publicStores = await Store.find({
            status: 'active',
            'subscription.status': { $in: ['trial', 'active'] }
        }).select('name slug bannerImage status subscription createdAt');
        
        console.log(`📋 Total de lojas públicas: ${publicStores.length}`);
        
        if (publicStores.length > 0) {
            console.log('\n🏪 Lojas na listagem pública:');
            publicStores.forEach((store, index) => {
                console.log(`  ${index + 1}. ${store.name}`);
                console.log(`     - Slug: ${store.slug}`);
                console.log(`     - Status: ${store.status}`);
                console.log(`     - Assinatura: ${store.subscription.plan} (${store.subscription.status})`);
                console.log(`     - Banner: ${store.bannerImage}`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhuma loja encontrada na listagem pública');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar listagem pública:', error);
    }
};

// Executar
const run = async () => {
    await connectDB();
    await activateLatestStore();
    await checkPublicListing();
    
    await mongoose.connection.close();
    console.log('🔌 Conexão MongoDB fechada');
    process.exit(0);
};

run();