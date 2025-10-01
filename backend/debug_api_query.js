import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function debugAPIQuery() {
    try {
        console.log('🔍 Debugando query da API...');
        
        // Simular a query atual da API (sem contexto de loja)
        const query = { 
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ],
            isActive: true 
        };
        
        console.log('📋 Query sendo executada:', JSON.stringify(query, null, 2));
        
        const foods = await foodModel.find(query);
        console.log(`📊 Produtos encontrados: ${foods.length}`);
        
        foods.forEach((food, index) => {
            console.log(`\n${index + 1}. ${food.name}`);
            console.log(`   ID: ${food._id}`);
            console.log(`   StoreId: ${food.storeId}`);
            console.log(`   Ativo: ${food.isActive}`);
        });
        
        // Testar query alternativa
        console.log('\n🔍 Testando query alternativa...');
        const alternativeQuery = { 
            storeId: { $in: [null, undefined] },
            isActive: true 
        };
        
        console.log('📋 Query alternativa:', JSON.stringify(alternativeQuery, null, 2));
        
        const alternativeFoods = await foodModel.find(alternativeQuery);
        console.log(`📊 Produtos encontrados (alternativa): ${alternativeFoods.length}`);
        
        // Testar query mais simples
        console.log('\n🔍 Testando query mais simples...');
        const simpleFoods = await foodModel.find({ isActive: true });
        console.log(`📊 Todos os produtos ativos: ${simpleFoods.length}`);
        
        const testProducts = simpleFoods.filter(p => p.name.toLowerCase().includes('teste'));
        console.log(`🧪 Produtos de teste nos ativos: ${testProducts.length}`);
        
        testProducts.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name} (storeId: ${product.storeId})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

debugAPIQuery();