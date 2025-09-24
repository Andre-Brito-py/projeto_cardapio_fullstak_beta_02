import fetch from 'node-fetch';

// Lista de imagens das categorias padrão
const categoryImages = [
    'menu_1-BLqPAi9S.png',
    'menu_2-6QL_uDtg.png', 
    'menu_3-2xw_iDUH.png',
    'menu_4-CpXAwO71.png',
    'menu_5-BLqPAi9S.png',
    'menu_6-BAKCTvIj.png',
    'menu_7-Dbn_MJmR.png',
    'menu_8-D3TIbU8x.png'
];

// Imagens disponíveis na pasta (baseado na cópia anterior)
const availableImages = [
    'banner_principal.png',
    'menu_1-CpSfC1Ff.png',  // DIFERENTE do script padrão
    'menu_2-6QL_uDtg.png',
    'menu_3-2xw_iDUH.png',
    'menu_5-BLqPAi9S.png',  // Faltando menu_4-CpXAwO71.png
    'menu_6-BAKCTvIj.png',
    'menu_7-Dbn_MJmR.png',
    'menu_8-D3TIbU8x.png'
];

const baseUrl = 'http://localhost:4001/images';

async function testImageAccessibility() {
    console.log('🔍 Testando acessibilidade das imagens de categoria...\n');
    
    const workingImages = [];
    const brokenImages = [];
    
    for (const image of categoryImages) {
        try {
            const response = await fetch(`${baseUrl}/${image}`);
            
            if (response.ok) {
                console.log(`✅ ${image} - Acessível (${response.status})`);
                workingImages.push(image);
            } else {
                console.log(`❌ ${image} - Erro ${response.status}`);
                brokenImages.push(image);
            }
        } catch (error) {
            console.log(`❌ ${image} - Erro de conexão: ${error.message}`);
            brokenImages.push(image);
        }
    }
    
    console.log('\n📊 RESUMO:');
    console.log(`✅ Imagens funcionais: ${workingImages.length}`);
    console.log(`❌ Imagens com problema: ${brokenImages.length}`);
    
    if (workingImages.length > 0) {
        console.log('\n✅ IMAGENS FUNCIONAIS:');
        workingImages.forEach(img => console.log(`  - ${img}`));
    }
    
    if (brokenImages.length > 0) {
        console.log('\n❌ IMAGENS COM PROBLEMA:');
        brokenImages.forEach(img => console.log(`  - ${img}`));
    }
    
    console.log('\n🔍 COMPARAÇÃO COM IMAGENS DISPONÍVEIS:');
    console.log('Imagens no script padrão que NÃO estão disponíveis:');
    categoryImages.forEach(img => {
        if (!availableImages.includes(img)) {
            console.log(`  ❌ ${img} - NÃO DISPONÍVEL`);
        }
    });
    
    console.log('\nImagens disponíveis que NÃO estão no script padrão:');
    availableImages.forEach(img => {
        if (!categoryImages.includes(img) && img !== 'banner_principal.png') {
            console.log(`  ⚠️  ${img} - DISPONÍVEL MAS NÃO USADA`);
        }
    });
    
    return { workingImages, brokenImages };
}

testImageAccessibility().catch(console.error);