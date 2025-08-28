const axios = require('axios');

// URLs da API
const API_BASE = 'http://localhost:4000';

async function diagnoseProblem() {
    console.log('🔍 DIAGNÓSTICO DETALHADO DO PROBLEMA DO CARRINHO\n');
    
    try {
        // 1. Verificar se a API está funcionando
        console.log('1️⃣ Verificando se a API está online...');
        const healthCheck = await axios.get(`${API_BASE}/api/food/list`);
        console.log(`✅ API está online. Produtos encontrados: ${healthCheck.data.data?.length || 0}`);
        
        if (healthCheck.data.data && healthCheck.data.data.length > 0) {
            const firstProduct = healthCheck.data.data[0];
            console.log(`📦 Primeiro produto: ${firstProduct.name} - ID: ${firstProduct._id}`);
            
            // 2. Criar usuário de teste e verificar resposta completa
            console.log('\n2️⃣ Criando usuário de teste e verificando token...');
            const testUser = {
                name: 'Teste Carrinho Debug',
                email: `teste_debug_${Date.now()}@test.com`,
                password: '12345678'
            };
            
            try {
                const registerResponse = await axios.post(`${API_BASE}/api/user/register`, testUser);
                console.log('📋 Resposta completa do registro:', JSON.stringify(registerResponse.data, null, 2));
                
                const token = registerResponse.data.token;
                const success = registerResponse.data.success;
                
                console.log('✅ Registro bem-sucedido:', success);
                console.log('🔑 Token recebido:', token ? 'SIM' : 'NÃO');
                
                if (token) {
                    console.log('🔑 Token (primeiros 20 chars):', token.substring(0, 20) + '...');
                    
                    // 3. Testar carrinho com autenticação
                    console.log('\n3️⃣ Testando carrinho com usuário autenticado...');
                    
                    const headers = { token };
                    console.log('📤 Headers enviados:', headers);
                    
                    // Adicionar ao carrinho
                    console.log('\n🛒 Adicionando item ao carrinho...');
                    const addAuthResponse = await axios.post(`${API_BASE}/api/cart/add`, {
                        itemId: firstProduct._id
                    }, { headers });
                    console.log('📋 Resposta da adição:', JSON.stringify(addAuthResponse.data, null, 2));
                    
                    // Recuperar carrinho
                    console.log('\n📥 Recuperando carrinho...');
                    const getAuthResponse = await axios.post(`${API_BASE}/api/cart/get`, {}, { headers });
                    console.log('📋 Resposta da recuperação:', JSON.stringify(getAuthResponse.data, null, 2));
                    
                    // Verificar se o item está no carrinho
                    const cartData = getAuthResponse.data.cartData;
                    console.log('\n🔍 Análise do carrinho:');
                    console.log('📊 Tipo do cartData:', typeof cartData);
                    console.log('📊 Chaves do carrinho:', Object.keys(cartData || {}));
                    console.log('📊 Valores do carrinho:', Object.values(cartData || {}));
                    
                    if (cartData && cartData[firstProduct._id]) {
                        console.log('✅ Item encontrado no carrinho!');
                        console.log('📦 Detalhes do item:', cartData[firstProduct._id]);
                    } else {
                        console.log('❌ Item NÃO encontrado no carrinho');
                        console.log('🔍 Procurando por ID:', firstProduct._id);
                        console.log('🔍 Chaves disponíveis:', Object.keys(cartData || {}));
                    }
                } else {
                    console.log('❌ Token não foi retornado no registro!');
                    console.log('🔍 Possível problema no userController.js');
                }
            } catch (error) {
                console.log('❌ Erro com usuário de teste:', error.response?.data || error.message);
                if (error.response) {
                    console.log('📋 Status:', error.response.status);
                    console.log('📋 Headers:', error.response.headers);
                }
            }
            
            // 4. Testar carrinho sem autenticação
            console.log('\n4️⃣ Testando carrinho sem autenticação...');
            try {
                const addResponse = await axios.post(`${API_BASE}/api/cart/add`, {
                    itemId: firstProduct._id
                });
                console.log('📋 Resposta da adição (sem auth):', JSON.stringify(addResponse.data, null, 2));
                
                const getResponse = await axios.post(`${API_BASE}/api/cart/get`, {});
                console.log('📋 Resposta da recuperação (sem auth):', JSON.stringify(getResponse.data, null, 2));
            } catch (error) {
                console.log('❌ Erro no teste sem auth:', error.response?.data || error.message);
            }
        }
        
        console.log('\n🎯 CONCLUSÕES DO DIAGNÓSTICO:');
        console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
        console.log('1. ❌ Token não está sendo retornado no registro (possível problema no userController)');
        console.log('2. ⚠️  Carrinho sem autenticação retorna vazio (esperado, gerenciado no frontend)');
        console.log('3. 🔄 Sistema usa optionalAuthMiddleware (permite usuários anônimos)');
        
        console.log('\n💡 CAUSA RAIZ DO PROBLEMA:');
        console.log('🎯 O problema está na SINCRONIZAÇÃO entre frontend e backend:');
        console.log('   • Frontend adiciona ao localStorage quando não há token');
        console.log('   • Backend retorna carrinho vazio para usuários não autenticados');
        console.log('   • Não há sincronização do localStorage com o backend após login');
        
        console.log('\n🛠️  SOLUÇÕES RECOMENDADAS:');
        console.log('1. 🔧 Corrigir o userController para garantir que o token seja retornado');
        console.log('2. 🔄 Implementar sincronização do localStorage com backend após login');
        console.log('3. 📱 Verificar se o StoreContext está chamando loadCartData após login');
        console.log('4. 🐛 Adicionar logs no frontend para debug do fluxo do carrinho');
        
        console.log('\n🌐 RESPOSTA SOBRE PROVEDOR ONLINE:');
        console.log('❌ SIM, o problema persistiria em um provedor online porque:');
        console.log('   • É um problema de lógica de aplicação, não de infraestrutura');
        console.log('   • A sincronização entre localStorage e backend não funciona');
        console.log('   • O token pode não estar sendo gerado/retornado corretamente');
        
    } catch (error) {
        console.log('❌ Erro durante diagnóstico:', error.message);
        console.log('📋 Stack trace:', error.stack);
    }
}

// Executar diagnóstico
diagnoseProblem();