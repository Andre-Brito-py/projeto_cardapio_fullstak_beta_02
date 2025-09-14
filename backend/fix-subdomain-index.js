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

// Corrigir problema do índice subdomain
const fixSubdomainIndex = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Verificando índices da coleção stores...');
        
        // Listar índices existentes
        const indexes = await Store.collection.getIndexes();
        console.log('📋 Índices existentes:', Object.keys(indexes));
        
        // Verificar se existe o índice subdomain_1
        if (indexes.subdomain_1) {
            console.log('🗑️ Removendo índice subdomain_1 problemático...');
            await Store.collection.dropIndex('subdomain_1');
            console.log('✅ Índice subdomain_1 removido');
        }
        
        // Verificar se existe o índice domain.subdomain_1
        if (indexes['domain.subdomain_1']) {
            console.log('🗑️ Removendo índice domain.subdomain_1 problemático...');
            await Store.collection.dropIndex('domain.subdomain_1');
            console.log('✅ Índice domain.subdomain_1 removido');
        }
        
        // Remover todas as lojas existentes para limpar o banco
        console.log('🧹 Limpando todas as lojas existentes...');
        const deleteResult = await Store.deleteMany({});
        console.log(`🗑️ ${deleteResult.deletedCount} lojas removidas`);
        
        // Recriar o índice correto
        console.log('🔧 Recriando índice correto para domain.subdomain...');
        await Store.collection.createIndex(
            { 'domain.subdomain': 1 }, 
            { unique: true, sparse: true }
        );
        console.log('✅ Índice domain.subdomain criado corretamente');
        
        // Listar índices após correção
        const newIndexes = await Store.collection.getIndexes();
        console.log('📋 Índices após correção:', Object.keys(newIndexes));
        
    } catch (error) {
        console.error('❌ Erro ao corrigir índice:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar correção
fixSubdomainIndex();