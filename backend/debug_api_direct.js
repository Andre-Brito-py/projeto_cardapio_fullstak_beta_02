import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';
import storeModel from './models/storeModel.js';
import ProductSuggestion from './models/productSuggestionModel.js';

// Conectar ao banco principal
await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');

console.log('=== TESTE DIRETO DA FUNÇÃO listFoodWithAddonInfo ===');

// Simular req sem store (como na API)
const req = { store: null };

try {
    const query = req.store 
        ? { storeId: req.store._id, isActive: true } 
        : { 
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ],
            isActive: true 
        };
    
    console.log('Query usada:', JSON.stringify(query, null, 2));
    
    const foods = await foodModel.find(query)
        .populate('storeId', 'name slug')
        .sort({ createdAt: -1 });

    console.log('Produtos encontrados após query:', foods.length);
    foods.forEach((food, index) => {
        console.log(`${index + 1}. ${food.name}`);
    });

    // Adicionar contagem de sugestões para cada produto
    console.log('\n=== Processando sugestões ===');
    const foodsWithSuggestionCount = await Promise.all(
        foods.map(async (food) => {
            let suggestionCount = 0;
            
            console.log(`Processando produto: ${food.name} (storeId: ${food.storeId})`);
            
            // Só buscar sugestões se o produto tiver storeId
            if (food.storeId) {
                console.log(`  - Buscando sugestões para produto com storeId`);
                suggestionCount = await ProductSuggestion.countDocuments({
                    productId: food._id,
                    storeId: food.storeId,
                    isActive: true
                });
            } else {
                console.log(`  - Produto sem storeId, pulando sugestões`);
            }

            return {
                ...food.toObject(),
                suggestionCount
            };
        })
    );

    console.log('\n=== RESULTADO FINAL ===');
    console.log('Total de produtos no resultado final:', foodsWithSuggestionCount.length);
    foodsWithSuggestionCount.forEach((food, index) => {
        console.log(`${index + 1}. ${food.name} (suggestionCount: ${food.suggestionCount})`);
    });

} catch (error) {
    console.error('Erro:', error);
}

mongoose.disconnect();