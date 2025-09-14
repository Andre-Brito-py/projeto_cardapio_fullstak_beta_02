import mongoose from 'mongoose';
import dotenv from 'dotenv';
import categoryModel from './models/categoryModel.js';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando teste de conexão...');

const testConnection = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:123456@localhost:27017/pede_ai?authSource=admin';
        console.log('🔗 Conectando ao MongoDB...');
        
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao MongoDB!');
        
        // Testar busca de categorias
        const categories = await categoryModel.find({});
        console.log(`📊 Total de categorias: ${categories.length}`);
        
        if (categories.length > 0) {
            console.log('\n📋 Primeiras 3 categorias:');
            categories.slice(0, 3).forEach(cat => {
                console.log(`  - ${cat.name} (ID: ${cat._id})`);
            });
        }
        
        // Contar por nome
        const categoryNames = {};
        categories.forEach(cat => {
            if (!categoryNames[cat.name]) {
                categoryNames[cat.name] = 0;
            }
            categoryNames[cat.name]++;
        });
        
        console.log('\n🔢 Contagem por nome:');
        Object.keys(categoryNames).forEach(name => {
            console.log(`  ${name}: ${categoryNames[name]} categoria(s)`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
};

testConnection();