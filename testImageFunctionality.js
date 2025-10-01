// Script para testar funcionalidade de imagens no frontend
const testImageFunctionality = async () => {
    console.log('🧪 Testando funcionalidade de imagens...\n');

    const baseUrl = 'http://localhost:4001';
    const storeId = '68c2de4c7690c6c039b67494';

    try {
        // 1. Testar API de banners
        console.log('1. Testando API de banners...');
        const bannerResponse = await fetch(`${baseUrl}/api/banner/list`, {
            headers: {
                'X-Store-ID': storeId
            }
        });
        
        if (bannerResponse.ok) {
            const bannerData = await bannerResponse.json();
            console.log(`✅ API de banners funcionando - ${bannerData.data.length} banners encontrados`);
            
            // Testar acesso às imagens de banner
            for (const banner of bannerData.data) {
                const imageUrl = `${baseUrl}/images/${banner.image}`;
                try {
                    const imageResponse = await fetch(imageUrl);
                    if (imageResponse.ok) {
                        console.log(`✅ Imagem do banner acessível: ${banner.image}`);
                    } else {
                        console.log(`❌ Erro ao acessar imagem do banner: ${banner.image} - Status: ${imageResponse.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Erro de rede ao acessar imagem do banner: ${banner.image}`);
                }
            }
        } else {
            console.log(`❌ Erro na API de banners - Status: ${bannerResponse.status}`);
        }

        // 2. Testar API de categorias
        console.log('\n2. Testando API de categorias...');
        const categoryResponse = await fetch(`${baseUrl}/api/category/list`, {
            headers: {
                'X-Store-ID': storeId
            }
        });
        
        if (categoryResponse.ok) {
            const categoryData = await categoryResponse.json();
            console.log(`✅ API de categorias funcionando - ${categoryData.data.length} categorias encontradas`);
            
            // Testar acesso às imagens de categoria
            for (const category of categoryData.data) {
                const imageUrl = `${baseUrl}/images/${category.image}`;
                try {
                    const imageResponse = await fetch(imageUrl);
                    if (imageResponse.ok) {
                        console.log(`✅ Imagem da categoria acessível: ${category.name} - ${category.image}`);
                    } else {
                        console.log(`❌ Erro ao acessar imagem da categoria: ${category.name} - ${category.image} - Status: ${imageResponse.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Erro de rede ao acessar imagem da categoria: ${category.name} - ${category.image}`);
                }
            }
        } else {
            console.log(`❌ Erro na API de categorias - Status: ${categoryResponse.status}`);
        }

        // 3. Testar API de produtos
        console.log('\n3. Testando API de produtos...');
        const foodResponse = await fetch(`${baseUrl}/api/food/list`, {
            headers: {
                'X-Store-ID': storeId
            }
        });
        
        if (foodResponse.ok) {
            const foodData = await foodResponse.json();
            console.log(`✅ API de produtos funcionando - ${foodData.data.length} produtos encontrados`);
            
            // Testar acesso às imagens de produtos (apenas alguns para não sobrecarregar)
            const sampleProducts = foodData.data.slice(0, 3);
            for (const product of sampleProducts) {
                const imageUrl = `${baseUrl}/images/${product.image}`;
                try {
                    const imageResponse = await fetch(imageUrl);
                    if (imageResponse.ok) {
                        console.log(`✅ Imagem do produto acessível: ${product.name} - ${product.image}`);
                    } else {
                        console.log(`❌ Erro ao acessar imagem do produto: ${product.name} - ${product.image} - Status: ${imageResponse.status}`);
                    }
                } catch (error) {
                    console.log(`❌ Erro de rede ao acessar imagem do produto: ${product.name} - ${product.image}`);
                }
            }
        } else {
            console.log(`❌ Erro na API de produtos - Status: ${foodResponse.status}`);
        }

        // 4. Testar imagens específicas que foram copiadas
        console.log('\n4. Testando imagens específicas copiadas...');
        const testImages = [
            'banner_principal.png',
            'menu_1-BLqPAi9S.png',
            'menu_2-6QL_uDtg.png',
            'menu_3-2xw_iDUH.png',
            'menu_4-CpXAwO71.png',
            'menu_5-BLqPAi9S.png',
            'menu_6-BAKCTvIj.png',
            'menu_7-Dbn_MJmR.png',
            'menu_8-D3TIbU8x.png'
        ];

        for (const imageName of testImages) {
            const imageUrl = `${baseUrl}/images/${imageName}`;
            try {
                const imageResponse = await fetch(imageUrl);
                if (imageResponse.ok) {
                    console.log(`✅ Imagem específica acessível: ${imageName}`);
                } else {
                    console.log(`❌ Erro ao acessar imagem específica: ${imageName} - Status: ${imageResponse.status}`);
                }
            } catch (error) {
                console.log(`❌ Erro de rede ao acessar imagem específica: ${imageName}`);
            }
        }

        console.log('\n🎉 Teste de funcionalidade de imagens concluído!');

    } catch (error) {
        console.error('❌ Erro geral no teste:', error);
    }
};

// Executar o teste
testImageFunctionality();