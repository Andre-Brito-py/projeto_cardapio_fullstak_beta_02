import axios from 'axios';

async function testAPIContext() {
    try {
        console.log('🔍 Testando API com diferentes contextos...');
        
        // Teste 1: Sem headers especiais
        console.log('\n1. Teste sem headers especiais:');
        try {
            const response1 = await axios.get('http://localhost:4001/api/food/list');
            console.log(`   Produtos encontrados: ${response1.data.data.length}`);
            const testProducts1 = response1.data.data.filter(p => p.name.toLowerCase().includes('teste'));
            console.log(`   Produtos de teste: ${testProducts1.length}`);
        } catch (error) {
            console.log(`   Erro: ${error.message}`);
        }
        
        // Teste 2: Com header X-Store-ID vazio
        console.log('\n2. Teste com X-Store-ID vazio:');
        try {
            const response2 = await axios.get('http://localhost:4001/api/food/list', {
                headers: { 'X-Store-ID': '' }
            });
            console.log(`   Produtos encontrados: ${response2.data.data.length}`);
            const testProducts2 = response2.data.data.filter(p => p.name.toLowerCase().includes('teste'));
            console.log(`   Produtos de teste: ${testProducts2.length}`);
        } catch (error) {
            console.log(`   Erro: ${error.message}`);
        }
        
        // Teste 3: Com host localhost (sem subdomínio)
        console.log('\n3. Teste com host localhost:');
        try {
            const response3 = await axios.get('http://localhost:4001/api/food/list', {
                headers: { 'Host': 'localhost:4001' }
            });
            console.log(`   Produtos encontrados: ${response3.data.data.length}`);
            const testProducts3 = response3.data.data.filter(p => p.name.toLowerCase().includes('teste'));
            console.log(`   Produtos de teste: ${testProducts3.length}`);
        } catch (error) {
            console.log(`   Erro: ${error.message}`);
        }
        
        // Teste 4: Verificar se há lojas no sistema
        console.log('\n4. Verificando lojas no sistema:');
        try {
            const response4 = await axios.get('http://localhost:4001/api/store/list');
            if (response4.data.success) {
                console.log(`   Lojas encontradas: ${response4.data.data?.length || 0}`);
                if (response4.data.data?.length > 0) {
                    response4.data.data.forEach((store, index) => {
                        console.log(`   ${index + 1}. ${store.name} (ID: ${store._id})`);
                    });
                }
            }
        } catch (error) {
            console.log(`   Erro ao buscar lojas: ${error.message}`);
        }
        
    } catch (error) {
        console.error('❌ Erro geral:', error.message);
    }
}

testAPIContext();