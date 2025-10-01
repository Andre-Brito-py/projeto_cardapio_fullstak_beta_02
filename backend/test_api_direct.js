import mongoose from 'mongoose';
import { listFood } from './controllers/foodController.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

// Simular um objeto de requisição sem store
const mockReq = {
    store: null,
    storeId: null
};

// Simular um objeto de resposta
const mockRes = {
    json: (data) => {
        console.log('\n📊 RESULTADO DO TESTE DIRETO:');
        console.log(`✅ Success: ${data.success}`);
        console.log(`📦 Total de produtos: ${data.data ? data.data.length : 0}`);
        
        if (data.data && Array.isArray(data.data)) {
            const testProducts = data.data.filter(food => 
                food.name && food.name.toLowerCase().includes('teste')
            );
            console.log(`🧪 Produtos de teste: ${testProducts.length}`);
            
            if (testProducts.length > 0) {
                console.log('🧪 Produtos de teste encontrados:');
                testProducts.forEach(product => {
                    console.log(`   - ${product.name} (ID: ${product._id})`);
                });
            }
        }
        
        console.log('\n📋 Dados completos:');
        console.log(JSON.stringify(data, null, 2));
        
        // Fechar conexão
        mongoose.connection.close();
    },
    status: (code) => ({
        json: (data) => {
            console.log(`❌ Erro ${code}:`, data);
            mongoose.connection.close();
        }
    })
};

console.log('🚀 Testando função listFood diretamente...');
console.log('📋 Simulando requisição sem store (req.store = null)');

// Executar o teste
listFood(mockReq, mockRes);