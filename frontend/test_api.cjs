// Script para testar as APIs do frontend
const axios = require('axios');

async function testAPIs() {
    const baseURL = 'http://localhost:4000/api';
    
    try {
        console.log('🔍 Testando APIs...');
        
        // Teste 0: Categorias ativas
        console.log('\n0. Testando /category/active');
        const categoryResponse = await axios.get(`${baseURL}/category/active`);
        console.log(`✅ Categorias ativas encontradas: ${categoryResponse.data.data.length}`);
        categoryResponse.data.data.forEach((cat, index) => {
            console.log(`   ${index + 1}. ${cat.name} (${cat.isActive ? 'Ativa' : 'Inativa'})`);
        });
        
        // Teste 1: Listar produtos
        console.log('\n1. Testando /food/list');
        const foodResponse = await axios.get(`${baseURL}/food/list`);
        console.log(`✅ Produtos encontrados: ${foodResponse.data.data.length}`);
        foodResponse.data.data.forEach((item, index) => {
            console.log(`   ${index + 1}. ${item.name} - Categoria: ${item.category}`);
        });
        
        // Teste 2: Dados da loja
        console.log('\n2. Testando /store/public/loja-de-bolo');
        const storeResponse = await axios.get(`${baseURL}/store/public/loja-de-bolo`);
        console.log(`✅ Loja encontrada: ${storeResponse.data.store.name}`);
        console.log(`   Status: ${storeResponse.data.store.isOpen ? 'Aberta' : 'Fechada'}`);
        
        // Teste 3: Menu da loja
        console.log('\n3. Testando /store/public/loja-de-bolo/menu');
        const menuResponse = await axios.get(`${baseURL}/store/public/loja-de-bolo/menu`);
        
        const menuData = menuResponse.data.data; // Os dados estão dentro de 'data'
        
        if (menuData.categories) {
            console.log(`✅ Categorias no menu: ${menuData.categories.length}`);
            menuData.categories.forEach((cat, index) => {
                console.log(`   ${index + 1}. ${cat.name} (${cat.isActive ? 'Ativa' : 'Inativa'})`);
            });
        } else {
            console.log('❌ Nenhuma categoria encontrada na resposta');
        }
        
        if (menuData.foods) {
            console.log(`✅ Produtos no menu: ${menuData.foods.length}`);
            
            // Verificar especificamente produtos da categoria Deserts
            const desertsProducts = menuData.foods.filter(food => food.category === 'Deserts');
            console.log(`\n🍰 Produtos na categoria Deserts: ${desertsProducts.length}`);
            desertsProducts.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} - R$ ${item.price}`);
            });
        } else {
            console.log('❌ Nenhum produto encontrado na resposta');
        }
        
    } catch (error) {
        console.error('❌ Erro ao testar APIs:', error.message);
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        }
    }
}

testAPIs();