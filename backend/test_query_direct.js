import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao banco principal
await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');

console.log('=== TESTE DA QUERY DIRETA ===');

// Query exata que a API usa
const query = { 
    $or: [
        { storeId: { $exists: false } }, 
        { storeId: null }
    ], 
    isActive: true 
};

console.log('Query:', JSON.stringify(query, null, 2));

const foods = await foodModel.find(query).sort({ createdAt: -1 });

console.log('Resultado da query:');
console.log('Total de produtos encontrados:', foods.length);

foods.forEach((food, index) => {
    console.log(`${index + 1}. ${food.name} (storeId: ${food.storeId}, isActive: ${food.isActive})`);
});

// Verificar produtos de teste especificamente
const testProducts = foods.filter(f => f.name.toLowerCase().includes('teste'));
console.log('\nProdutos de teste encontrados:', testProducts.length);
testProducts.forEach(p => console.log('- ' + p.name));

mongoose.disconnect();