const axios = require('axios');

// Teste para reproduzir o problema do carrinho
async function testCartSyncIssue() {
    console.log('🧪 Testando problema de sincronização do carrinho\n');
    
    const API_BASE = 'http://localhost:4001';
    
    try {
        // 1. Buscar produtos disponíveis
        console.log('1️⃣ Buscando produtos disponíveis...');
        const foodResponse = await axios.get(`${API_BASE}/api/food/list`);
        
        if (!foodResponse.data.success || foodResponse.data.data.length === 0) {
            console.log('❌ Nenhum produto encontrado');
            return;
        }
        
        const products = foodResponse.data.data;
        const testProduct = products[0];
        console.log(`✅ Produto selecionado: ${testProduct.name} (ID: ${testProduct._id})`);
        
        // 2. Simular adição ao carrinho local (sem autenticação)
        console.log('\n2️⃣ Simulando adição ao carrinho local...');
        
        const cartKey = testProduct._id;
        const cartItem = {
            quantity: 2,
            itemId: testProduct._id,
            extras: [],
            observations: 'Teste de sincronização',
            includeDisposables: false
        };
        
        const cartData = {
            [cartKey]: cartItem
        };
        
        console.log('📦 Dados do carrinho simulado:');
        console.log(JSON.stringify(cartData, null, 2));
        
        // 3. Simular o que acontece no localStorage
        console.log('\n3️⃣ Simulando localStorage...');
        console.log('localStorage.setItem("cartItems", JSON.stringify(cartData))');
        console.log('Conteúdo salvo:', JSON.stringify(cartData));
        
        // 4. Simular recuperação do localStorage
        console.log('\n4️⃣ Simulando recuperação do localStorage...');
        const retrievedCart = JSON.parse(JSON.stringify(cartData)); // Simula JSON.parse(localStorage.getItem("cartItems"))
        console.log('Dados recuperados:', JSON.stringify(retrievedCart));
        console.log(`Itens no carrinho: ${Object.keys(retrievedCart).length}`);
        
        // 5. Verificar se há diferenças
        console.log('\n5️⃣ Verificando consistência...');
        const originalKeys = Object.keys(cartData);
        const retrievedKeys = Object.keys(retrievedCart);
        
        if (originalKeys.length === retrievedKeys.length) {
            console.log('✅ Número de itens consistente');
        } else {
            console.log('❌ Inconsistência no número de itens');
            console.log(`Original: ${originalKeys.length}, Recuperado: ${retrievedKeys.length}`);
        }
        
        // 6. Simular problema de timing
        console.log('\n6️⃣ Simulando problema de timing (React state vs localStorage)...');
        
        // Cenário: Estado React vazio, localStorage com dados
        const reactState = {}; // Estado inicial vazio
        const localStorageData = cartData; // localStorage com dados
        
        console.log('Estado React atual:', Object.keys(reactState).length, 'itens');
        console.log('localStorage atual:', Object.keys(localStorageData).length, 'itens');
        
        if (Object.keys(reactState).length === 0 && Object.keys(localStorageData).length > 0) {
            console.log('🚨 PROBLEMA IDENTIFICADO: Estado React vazio mas localStorage tem dados!');
            console.log('💡 Solução: Forçar sincronização do localStorage para o estado React');
        }
        
        // 7. Testar APIs do carrinho
        console.log('\n7️⃣ Testando APIs do carrinho...');
        
        try {
            // Teste sem autenticação (deve retornar sucesso mas não salvar no backend)
            const addResponse = await axios.post(`${API_BASE}/api/cart/add`, {
                itemId: testProduct._id,
                extras: [],
                observations: 'Teste sem auth',
                includeDisposables: false
            });
            
            console.log('Resposta add sem auth:', addResponse.data);
            
            // Teste get sem autenticação
            const getResponse = await axios.post(`${API_BASE}/api/cart/get`, {});
            console.log('Resposta get sem auth:', getResponse.data);
            
        } catch (error) {
            console.log('Erro nas APIs:', error.response?.data || error.message);
        }
        
        console.log('\n📋 RESUMO DO PROBLEMA:');
        console.log('- Usuário adiciona itens ao carrinho (salva no localStorage)');
        console.log('- Usuário navega para /cart ou clica no ícone da sacola');
        console.log('- Estado React pode estar vazio enquanto localStorage tem dados');
        console.log('- Resultado: Carrinho aparece vazio na interface');
        console.log('\n💡 SOLUÇÕES IMPLEMENTADAS:');
        console.log('- useEffect no Cart.jsx para forçar carregamento do localStorage');
        console.log('- useEffect no Navbar.jsx para sincronizar ícone do carrinho');
        console.log('- Logs de debug no StoreContext.jsx');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.message);
    }
}

// Executar teste
testCartSyncIssue();