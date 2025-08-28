const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:4000';

// Função para aguardar
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Função para gerar email único
const generateUniqueEmail = () => {
    const timestamp = Date.now();
    return `test_${timestamp}@example.com`;
};

async function runFinalTest() {
    console.log('\n=== TESTE FINAL DE DIAGNÓSTICO DO CARRINHO ===\n');
    
    try {
        // 1. Verificar se API está online
        console.log('1. Verificando se API está online...');
        const healthCheck = await axios.get(`${BASE_URL}/api/food/list`);
        console.log('✅ API está online');
        
        // 2. Obter produtos disponíveis
        console.log('\n2. Obtendo produtos disponíveis...');
        const productsResponse = await axios.get(`${BASE_URL}/api/food/list`);
        const products = productsResponse.data.data;
        
        if (!products || products.length === 0) {
            console.log('❌ Nenhum produto encontrado');
            return;
        }
        
        const testProduct = products[0];
        console.log(`✅ Produto de teste: ${testProduct.name} (ID: ${testProduct._id})`);
        
        // 3. Teste do carrinho SEM autenticação (localStorage simulation)
        console.log('\n3. Testando carrinho SEM autenticação...');
        
        // Simular adição ao carrinho sem token
        const addWithoutAuthResponse = await axios.post(`${BASE_URL}/api/cart/add`, {
            itemId: testProduct._id,
            extras: [],
            observations: 'Teste sem auth',
            includeDisposables: false
        });
        
        console.log('Resposta da adição sem auth:', addWithoutAuthResponse.data);
        
        // Tentar obter carrinho sem token
        const getWithoutAuthResponse = await axios.post(`${BASE_URL}/api/cart/get`, {});
        console.log('Carrinho sem auth:', getWithoutAuthResponse.data);
        
        // 4. Registrar usuário de teste
        console.log('\n4. Registrando usuário de teste...');
        const testEmail = generateUniqueEmail();
        const registerData = {
            name: 'Teste User',
            email: testEmail,
            password: 'teste123'
        };
        
        const registerResponse = await axios.post(`${BASE_URL}/api/user/register`, registerData);
        
        if (!registerResponse.data.success) {
            console.log('❌ Falha no registro:', registerResponse.data.message);
            return;
        }
        
        const token = registerResponse.data.token;
        console.log('✅ Usuário registrado com sucesso');
        console.log('Token recebido:', token ? 'SIM' : 'NÃO');
        
        if (!token) {
            console.log('❌ PROBLEMA IDENTIFICADO: Token não retornado no registro!');
            return;
        }
        
        // 5. Teste do carrinho COM autenticação
        console.log('\n5. Testando carrinho COM autenticação...');
        
        // Adicionar item ao carrinho com token
        const addWithAuthResponse = await axios.post(`${BASE_URL}/api/cart/add`, {
            itemId: testProduct._id,
            extras: [],
            observations: 'Teste com auth',
            includeDisposables: false
        }, {
            headers: { token }
        });
        
        console.log('Resposta da adição com auth:', addWithAuthResponse.data);
        
        // Obter carrinho com token
        const getWithAuthResponse = await axios.post(`${BASE_URL}/api/cart/get`, {}, {
            headers: { token }
        });
        
        console.log('Carrinho com auth:', getWithAuthResponse.data);
        
        // 6. Verificar persistência no banco
        console.log('\n6. Verificando persistência no banco de dados...');
        
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/food-delivery');
        
        const User = mongoose.model('User', new mongoose.Schema({
            name: String,
            email: String,
            password: String,
            cartData: { type: Object, default: {} }
        }));
        
        const user = await User.findOne({ email: testEmail });
        
        if (user) {
            console.log('✅ Usuário encontrado no banco');
            console.log('Dados do carrinho no banco:', JSON.stringify(user.cartData, null, 2));
            
            const cartKeys = Object.keys(user.cartData || {});
            console.log(`Itens no carrinho (banco): ${cartKeys.length}`);
            
            if (cartKeys.length > 0) {
                console.log('✅ Carrinho persistido corretamente no banco');
            } else {
                console.log('⚠️ Carrinho vazio no banco');
            }
        } else {
            console.log('❌ Usuário não encontrado no banco');
        }
        
        // 7. Teste de login
        console.log('\n7. Testando login...');
        
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: testEmail,
            password: 'teste123'
        });
        
        if (loginResponse.data.success) {
            console.log('✅ Login realizado com sucesso');
            console.log('Token do login:', loginResponse.data.token ? 'SIM' : 'NÃO');
            
            // Obter carrinho após login
            const cartAfterLogin = await axios.post(`${BASE_URL}/api/cart/get`, {}, {
                headers: { token: loginResponse.data.token }
            });
            
            console.log('Carrinho após login:', cartAfterLogin.data);
        } else {
            console.log('❌ Falha no login:', loginResponse.data.message);
        }
        
        // 8. Conclusões
        console.log('\n=== CONCLUSÕES DO DIAGNÓSTICO ===\n');
        
        const cartWithAuth = getWithAuthResponse.data.cartData || {};
        const cartKeysWithAuth = Object.keys(cartWithAuth);
        
        if (cartKeysWithAuth.length > 0) {
            console.log('✅ CARRINHO COM AUTENTICAÇÃO: Funcionando corretamente');
        } else {
            console.log('❌ CARRINHO COM AUTENTICAÇÃO: Não está funcionando');
        }
        
        if (token) {
            console.log('✅ TOKEN NO REGISTRO: Sendo retornado corretamente');
        } else {
            console.log('❌ TOKEN NO REGISTRO: NÃO está sendo retornado');
        }
        
        console.log('\n=== DIAGNÓSTICO FINAL ===\n');
        
        if (cartKeysWithAuth.length > 0 && token) {
            console.log('🎉 SISTEMA FUNCIONANDO: O problema não está no backend!');
            console.log('\n📋 POSSÍVEIS CAUSAS NO FRONTEND:');
            console.log('   1. Problema na sincronização do StoreContext');
            console.log('   2. Token não sendo definido corretamente após login/registro');
            console.log('   3. Componentes não re-renderizando após mudança do carrinho');
            console.log('   4. localStorage não sendo limpo após login');
            console.log('\n🔧 SOLUÇÕES RECOMENDADAS:');
            console.log('   1. Adicionar logs no StoreContext para debug');
            console.log('   2. Verificar se setToken está sendo chamado corretamente');
            console.log('   3. Verificar se os componentes estão usando o contexto corretamente');
            console.log('   4. Testar em modo incógnito para eliminar cache/localStorage');
        } else {
            console.log('❌ PROBLEMA NO BACKEND IDENTIFICADO!');
            if (!token) {
                console.log('   - Token não está sendo retornado no registro');
            }
            if (cartKeysWithAuth.length === 0) {
                console.log('   - Carrinho não está sendo persistido no backend');
            }
        }
        
        console.log('\n🌐 EM UM PROVEDOR ONLINE:');
        if (cartKeysWithAuth.length > 0 && token) {
            console.log('   ✅ O problema NÃO persistiria (backend está funcionando)');
            console.log('   ✅ É um problema específico do frontend/sincronização');
        } else {
            console.log('   ❌ O problema PERSISTIRIA (problema no backend)');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
        if (error.response) {
            console.error('Resposta do servidor:', error.response.data);
        }
    } finally {
        if (mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
    }
}

// Executar o teste
runFinalTest().then(() => {
    console.log('\n=== TESTE FINALIZADO ===');
    process.exit(0);
}).catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
});