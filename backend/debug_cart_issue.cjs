// Script para diagnosticar problema do carrinho
const axios = require('axios');
const mongoose = require('mongoose');
const userModel = require('./models/userModel.js');
const foodModel = require('./models/foodModel.js');

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const diagnoseProblem = async () => {
    console.log('🔍 DIAGNÓSTICO DO PROBLEMA DO CARRINHO\n');
    
    try {
        // 1. Verificar se há produtos ativos
        console.log('1️⃣ Verificando produtos disponíveis...');
        const products = await foodModel.find({ isActive: true }).limit(3);
        console.log(`   ✅ Produtos ativos encontrados: ${products.length}`);
        
        if (products.length === 0) {
            console.log('   ❌ PROBLEMA: Nenhum produto ativo encontrado!');
            return;
        }
        
        products.forEach(p => {
            console.log(`   - ${p.name} (ID: ${p._id})`);
        });
        
        // 2. Testar API de listagem de produtos
        console.log('\n2️⃣ Testando API de produtos...');
        try {
            const response = await axios.get('http://localhost:4000/api/food/list');
            console.log(`   ✅ API respondeu com ${response.data.data.length} produtos`);
        } catch (error) {
            console.log(`   ❌ PROBLEMA: API não responde - ${error.message}`);
            return;
        }
        
        // 3. Criar usuário de teste
        console.log('\n3️⃣ Criando usuário de teste...');
        let testUser = await userModel.findOne({ email: 'debug-test@example.com' });
        if (testUser) {
            await userModel.deleteOne({ email: 'debug-test@example.com' });
        }
        
        testUser = new userModel({
            name: 'Debug Test User',
            email: 'debug-test@example.com',
            password: 'hashedpassword',
            cartData: {}
        });
        await testUser.save();
        console.log(`   ✅ Usuário criado: ${testUser._id}`);
        
        // 4. Testar adição ao carrinho via API
        console.log('\n4️⃣ Testando adição ao carrinho via API...');
        const testProduct = products[0];
        
        try {
            const addResponse = await axios.post('http://localhost:4000/api/cart/add', {
                userId: testUser._id.toString(),
                itemId: testProduct._id.toString(),
                extras: [],
                observations: 'Teste de diagnóstico',
                includeDisposables: false
            });
            
            console.log(`   ✅ API add respondeu: ${addResponse.data.message}`);
        } catch (error) {
            console.log(`   ❌ PROBLEMA: Erro ao adicionar - ${error.message}`);
            return;
        }
        
        // 5. Verificar se foi salvo no banco
        console.log('\n5️⃣ Verificando dados no banco...');
        const updatedUser = await userModel.findById(testUser._id);
        const cartData = updatedUser.cartData || {};
        const cartKeys = Object.keys(cartData);
        
        console.log(`   📊 Itens no carrinho: ${cartKeys.length}`);
        
        if (cartKeys.length === 0) {
            console.log('   ❌ PROBLEMA: Carrinho vazio no banco de dados!');
        } else {
            cartKeys.forEach(key => {
                const item = cartData[key];
                console.log(`   - Key: ${key}`);
                console.log(`     ItemId: ${item.itemId}`);
                console.log(`     Quantity: ${item.quantity}`);
                console.log(`     Extras: ${JSON.stringify(item.extras)}`);
            });
        }
        
        // 6. Testar recuperação via API
        console.log('\n6️⃣ Testando recuperação do carrinho via API...');
        try {
            const getResponse = await axios.post('http://localhost:4000/api/cart/get', {}, {
                headers: { 
                    userId: testUser._id.toString() // Simulando como seria com JWT
                }
            });
            
            const retrievedCart = getResponse.data.cartData || {};
            console.log(`   ✅ API get respondeu com ${Object.keys(retrievedCart).length} itens`);
            
            if (Object.keys(retrievedCart).length === 0) {
                console.log('   ❌ PROBLEMA: API retorna carrinho vazio!');
            }
        } catch (error) {
            console.log(`   ❌ PROBLEMA: Erro ao recuperar - ${error.message}`);
        }
        
        // 7. Verificar estrutura de chaves do carrinho
        console.log('\n7️⃣ Analisando estrutura das chaves do carrinho...');
        
        // Simular como o frontend cria as chaves
        const frontendKey = testProduct._id.toString();
        const backendKey = testProduct._id.toString(); // Sem extras
        
        console.log(`   Frontend esperaria chave: ${frontendKey}`);
        console.log(`   Backend criou chave: ${cartKeys[0] || 'nenhuma'}`);
        
        if (cartKeys.length > 0 && cartKeys[0] !== frontendKey) {
            console.log('   ⚠️  POSSÍVEL PROBLEMA: Incompatibilidade de chaves!');
        }
        
        // 8. Diagnóstico final
        console.log('\n🎯 DIAGNÓSTICO FINAL:');
        
        if (products.length === 0) {
            console.log('❌ PROBLEMA: Produtos não disponíveis');
        } else if (cartKeys.length === 0) {
            console.log('❌ PROBLEMA: Carrinho não salva no banco de dados');
        } else if (cartKeys[0] !== frontendKey) {
            console.log('❌ PROBLEMA: Incompatibilidade entre chaves frontend/backend');
        } else {
            console.log('✅ Estrutura parece correta - problema pode ser no frontend');
            console.log('\n🔧 SUGESTÕES:');
            console.log('1. Verificar se o token JWT está sendo enviado corretamente');
            console.log('2. Verificar se o StoreContext está atualizando o estado');
            console.log('3. Verificar se há erros no console do navegador');
            console.log('4. Verificar se o localStorage está sendo usado quando não logado');
        }
        
        // Limpeza
        await userModel.deleteOne({ email: 'debug-test@example.com' });
        console.log('\n🧹 Usuário de teste removido');
        
    } catch (error) {
        console.error('❌ Erro durante diagnóstico:', error);
    } finally {
        mongoose.connection.close();
    }
};

diagnoseProblem();