import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

// Simular a função listFood diretamente
async function testListFoodFunction() {
    try {
        console.log('🔍 Testando função listFood diretamente...');
        
        // Simular req sem store (como na API pública)
        const req = { store: null };
        
        // Replicar a lógica exata da função listFood
        const query = req.store 
            ? { storeId: req.store._id, isActive: true } 
            : { 
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                isActive: true 
            };
            
        console.log('📋 Query executada:', JSON.stringify(query, null, 2));
        
        const foods = await foodModel.find(query).populate('storeId', 'name slug');
        
        console.log(`📊 Total de produtos encontrados: ${foods.length}`);
        
        // Filtrar produtos de teste
        const testProducts = foods.filter(food => 
            food.name.toLowerCase().includes('teste')
        );
        
        console.log(`🧪 Produtos de teste encontrados: ${testProducts.length}`);
        
        testProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Preço: R$ ${product.price}`);
            console.log(`   Categoria: ${product.category}`);
            console.log(`   Ativo: ${product.isActive}`);
            console.log(`   Sistema antigo: ${product.useOldSystem}`);
            console.log(`   StoreId: ${product.storeId}`);
        });
        
        // Simular resposta da API
        const response = { success: true, data: foods };
        console.log(`\n✅ Resposta simulada da API: ${response.data.length} produtos`);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

testListFoodFunction();