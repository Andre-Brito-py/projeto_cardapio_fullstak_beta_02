import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const testQueries = async () => {
    console.log('🔍 TESTANDO DIFERENTES QUERIES\n');
    
    // Query 1: Sem store (como deveria ser no servidor principal)
    const query1 = { 
        $or: [
            { storeId: { $exists: false } },
            { storeId: null }
        ],
        isActive: true 
    };
    
    console.log('📋 Query 1 (sem store):');
    console.log(JSON.stringify(query1, null, 2));
    const result1 = await foodModel.find(query1);
    console.log(`📊 Resultados: ${result1.length}`);
    const test1 = result1.filter(f => f.name.toLowerCase().includes('teste'));
    console.log(`🧪 Produtos de teste: ${test1.length}`);
    if (test1.length > 0) {
        test1.forEach(p => console.log(`   - ${p.name} (storeId: ${p.storeId})`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Query 2: Apenas isActive (como no listFoodWithAddonInfo quando não há store)
    const query2 = { isActive: true };
    
    console.log('📋 Query 2 (apenas isActive):');
    console.log(JSON.stringify(query2, null, 2));
    const result2 = await foodModel.find(query2);
    console.log(`📊 Resultados: ${result2.length}`);
    const test2 = result2.filter(f => f.name.toLowerCase().includes('teste'));
    console.log(`🧪 Produtos de teste: ${test2.length}`);
    if (test2.length > 0) {
        test2.forEach(p => console.log(`   - ${p.name} (storeId: ${p.storeId})`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Query 3: Todos os produtos
    const query3 = {};
    
    console.log('📋 Query 3 (todos os produtos):');
    console.log(JSON.stringify(query3, null, 2));
    const result3 = await foodModel.find(query3);
    console.log(`📊 Resultados: ${result3.length}`);
    const test3 = result3.filter(f => f.name.toLowerCase().includes('teste'));
    console.log(`🧪 Produtos de teste: ${test3.length}`);
    if (test3.length > 0) {
        test3.forEach(p => console.log(`   - ${p.name} (storeId: ${p.storeId}, isActive: ${p.isActive})`));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Verificar se há produtos de teste inativos
    const inactiveTestProducts = await foodModel.find({ 
        name: { $regex: 'teste', $options: 'i' },
        isActive: false 
    });
    
    console.log('❌ Produtos de teste INATIVOS:');
    console.log(`📊 Resultados: ${inactiveTestProducts.length}`);
    if (inactiveTestProducts.length > 0) {
        inactiveTestProducts.forEach(p => console.log(`   - ${p.name} (isActive: ${p.isActive})`));
    }
    
    mongoose.connection.close();
};

testQueries().catch(console.error);