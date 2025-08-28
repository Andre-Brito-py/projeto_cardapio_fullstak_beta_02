const axios = require('axios');
const mongoose = require('mongoose');

// Configuração
const API_URL = 'http://localhost:4000';
const MONGO_URI = 'mongodb://localhost:27017/food-del';

async function testCartFunctionality() {
    console.log('🧪 Iniciando teste final do carrinho...');
    
    try {
        // 1. Testar conexão com API
        console.log('\n1. Testando conexão com API...');
        const healthCheck = await axios.get(`${API_URL}/api/food/list`);
        console.log(`✅ API respondendo: ${healthCheck.data.data.length} produtos encontrados`);
        
        // 2. Testar adição ao carrinho sem autenticação (localStorage)
        console.log('\n2. Testando adição ao carrinho (sem autenticação)...');
        const productId = healthCheck.data.data[0]._id;
        console.log(`📦 Produto de teste: ${healthCheck.data.data[0].name} (ID: ${productId})`);
        
        // Simular localStorage
        const localCart = {
            [productId]: {
                quantity: 2,
                itemId: productId,
                extras: [],
                observations: 'Teste sem autenticação',
                includeDisposables: false
            }
        };
        console.log('✅ Carrinho local simulado:', JSON.stringify(localCart, null, 2));
        
        // 3. Testar APIs do carrinho com token (simulando usuário autenticado)
        console.log('\n3. Testando APIs do carrinho com autenticação...');
        
        // Conectar ao MongoDB para criar usuário de teste
        await mongoose.connect(MONGO_URI);
        const User = (await import('./models/userModel.js')).default;
        
        // Criar ou encontrar usuário de teste
        let testUser = await User.findOne({ email: 'teste@carrinho.com' });
        if (!testUser) {
            testUser = new User({
                name: 'Teste Carrinho',
                email: 'teste@carrinho.com',
                password: 'hashedpassword',
                cartData: {}
            });
            await testUser.save();
            console.log('👤 Usuário de teste criado');
        } else {
            console.log('👤 Usuário de teste encontrado');
        }
        
        // Gerar token JWT simples (simulado)
        const jwt = require('jsonwebtoken');
        const token = jwt.sign({ id: testUser._id }, 'random#secret', { expiresIn: '1h' });
        console.log('🔑 Token JWT gerado');
        
        // Testar adição via API
        try {
            const addResponse = await axios.post(`${API_URL}/api/cart/add`, {
                itemId: productId,
                extras: [],
                observations: 'Teste via API',
                includeDisposables: true
            }, {
                headers: { token }
            });
            console.log('✅ Produto adicionado via API:', addResponse.data.success ? 'Sucesso' : 'Falha');
        } catch (error) {
            console.log('❌ Erro ao adicionar via API:', error.response?.data?.message || error.message);
        }
        
        // Testar recuperação do carrinho
        try {
            const getResponse = await axios.post(`${API_URL}/api/cart/get`, {}, {
                headers: { token }
            });
            console.log('✅ Carrinho recuperado via API:');
            console.log('   - Sucesso:', getResponse.data.success);
            console.log('   - Itens no carrinho:', Object.keys(getResponse.data.cartData || {}).length);
            if (getResponse.data.cartData) {
                console.log('   - Dados:', JSON.stringify(getResponse.data.cartData, null, 2));
            }
        } catch (error) {
            console.log('❌ Erro ao recuperar carrinho:', error.response?.data?.message || error.message);
        }
        
        console.log('\n🎉 Teste concluído!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.connection.close();
            console.log('🔌 Conexão com MongoDB fechada');
        }
    }
}

// Executar teste
testCartFunctionality();