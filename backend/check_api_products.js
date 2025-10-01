import axios from 'axios';

async function checkAPIProducts() {
    try {
        console.log('🔍 Verificando produtos na API...');
        
        const response = await axios.get('http://localhost:4001/api/food/list');
        const products = response.data.data;
        
        console.log(`📊 Total de produtos na API: ${products.length}`);
        
        // Procurar produtos de teste
        const testProducts = products.filter(product => 
            product.name.toLowerCase().includes('teste')
        );
        
        console.log(`🧪 Produtos de teste encontrados: ${testProducts.length}`);
        
        testProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Preço: R$ ${product.price}`);
            console.log(`   Categoria: ${product.category}`);
            console.log(`   Ativo: ${product.isActive}`);
            console.log(`   Sistema antigo: ${product.useOldSystem}`);
            console.log(`   Extras: ${product.extras?.length || 0}`);
            console.log(`   Categorias de adicionais: ${product.inlineAddonCategories?.length || 0}`);
        });
        
        if (testProducts.length === 0) {
            console.log('\n❌ Nenhum produto de teste encontrado na API');
        } else {
            console.log('\n✅ Produtos de teste encontrados na API');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar API:', error.message);
    }
}

checkAPIProducts();