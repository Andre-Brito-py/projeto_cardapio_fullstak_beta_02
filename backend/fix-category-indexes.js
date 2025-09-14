import mongoose from 'mongoose';
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

// Função para corrigir índices das categorias
const fixCategoryIndexes = async () => {
    try {
        console.log('🔍 Verificando índices existentes...');
        
        // Obter coleção de categorias
        const collection = mongoose.connection.db.collection('categories');
        
        // Listar índices existentes
        const indexes = await collection.indexes();
        console.log('📋 Índices existentes:');
        indexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        // Verificar se existe índice antigo apenas no campo 'name'
        const nameOnlyIndex = indexes.find(index => 
            index.key.name === 1 && 
            Object.keys(index.key).length === 1 && 
            index.name !== '_id_'
        );
        
        if (nameOnlyIndex) {
            console.log('🗑️ Removendo índice antigo apenas no campo "name"...');
            await collection.dropIndex(nameOnlyIndex.name);
            console.log('✅ Índice antigo removido');
        } else {
            console.log('ℹ️ Nenhum índice antigo encontrado');
        }
        
        // Verificar se o índice composto existe
        const compositeIndex = indexes.find(index => 
            index.key.name === 1 && 
            index.key.storeId === 1
        );
        
        if (!compositeIndex) {
            console.log('🔧 Criando índice composto (name + storeId)...');
            await collection.createIndex(
                { name: 1, storeId: 1 }, 
                { unique: true, name: 'name_1_storeId_1' }
            );
            console.log('✅ Índice composto criado');
        } else {
            console.log('✅ Índice composto já existe');
        }
        
        // Listar índices finais
        const finalIndexes = await collection.indexes();
        console.log('\n📋 Índices finais:');
        finalIndexes.forEach(index => {
            console.log(`  - ${index.name}: ${JSON.stringify(index.key)}`);
        });
        
        console.log('\n🎉 Correção de índices concluída!');
        
    } catch (error) {
        console.error('❌ Erro ao corrigir índices:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar
const run = async () => {
    await connectDB();
    await fixCategoryIndexes();
    process.exit(0);
};

run();