import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001';
const UPLOADS_DIR = './uploads';

// Função para verificar se os arquivos de imagem existem fisicamente
function checkPhysicalFiles() {
    console.log('\n🔍 Verificando arquivos físicos no diretório uploads...');
    
    try {
        const files = fs.readdirSync(UPLOADS_DIR);
        const imageFiles = files.filter(file => 
            file.toLowerCase().endsWith('.png') || 
            file.toLowerCase().endsWith('.jpg') || 
            file.toLowerCase().endsWith('.jpeg')
        );
        
        console.log(`📁 Total de arquivos no uploads: ${files.length}`);
        console.log(`🖼️ Arquivos de imagem encontrados: ${imageFiles.length}`);
        
        // Verificar arquivos específicos
        const bannerExists = files.includes('banner_principal.png');
        console.log(`🏷️ Banner principal: ${bannerExists ? '✅ Existe' : '❌ Não encontrado'}`);
        
        const menuImages = imageFiles.filter(file => file.startsWith('menu_'));
        console.log(`📋 Imagens de menu encontradas: ${menuImages.length}`);
        menuImages.forEach(img => console.log(`   - ${img}`));
        
        return { totalFiles: files.length, imageFiles: imageFiles.length, bannerExists, menuImages };
    } catch (error) {
        console.error('❌ Erro ao verificar arquivos físicos:', error.message);
        return { totalFiles: 0, imageFiles: 0, bannerExists: false, menuImages: [] };
    }
}

// Função para testar acesso HTTP às imagens
async function testImageHTTPAccess() {
    console.log('\n🌐 Testando acesso HTTP às imagens...');
    
    const testImages = [
        'banner_principal.png',
        'menu_1-BLqPAi9S.png',
        'menu_2-6QL_uDtg.png',
        'menu_3-2xw_iDUH.png'
    ];
    
    let accessibleCount = 0;
    
    for (const image of testImages) {
        try {
            const response = await fetch(`${BASE_URL}/images/${image}`);
            if (response.ok) {
                console.log(`✅ ${image} - Acessível (${response.status})`);
                accessibleCount++;
            } else {
                console.log(`❌ ${image} - Erro ${response.status}`);
            }
        } catch (error) {
            console.log(`❌ ${image} - Erro de conexão: ${error.message}`);
        }
    }
    
    return { tested: testImages.length, accessible: accessibleCount };
}

// Função para testar API de categorias
async function testCategoriesAPI() {
    console.log('\n📋 Testando API de categorias...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/category/active`);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API de categorias funcionando`);
            console.log(`📊 Categorias ativas encontradas: ${data.data ? data.data.length : 0}`);
            
            if (data.data && data.data.length > 0) {
                console.log('🏷️ Categorias com imagens:');
                data.data.forEach(cat => {
                    console.log(`   - ${cat.name}: ${cat.image || 'Sem imagem'}`);
                });
            }
            
            return { success: true, count: data.data ? data.data.length : 0 };
        } else {
            console.log(`❌ API de categorias - Erro ${response.status}`);
            return { success: false, count: 0 };
        }
    } catch (error) {
        console.log(`❌ API de categorias - Erro de conexão: ${error.message}`);
        return { success: false, count: 0 };
    }
}

// Função para testar API de banners
async function testBannersAPI() {
    console.log('\n🎯 Testando API de banners...');
    
    try {
        const response = await fetch(`${BASE_URL}/api/banner/list`);
        if (response.ok) {
            const data = await response.json();
            console.log(`✅ API de banners funcionando`);
            console.log(`📊 Banners encontrados: ${data.data ? data.data.length : 0}`);
            
            if (data.data && data.data.length > 0) {
                console.log('🎯 Banners com imagens:');
                data.data.forEach(banner => {
                    console.log(`   - ${banner.title || 'Sem título'}: ${banner.image || 'Sem imagem'}`);
                });
            }
            
            return { success: true, count: data.data ? data.data.length : 0 };
        } else {
            console.log(`❌ API de banners - Erro ${response.status}`);
            return { success: false, count: 0 };
        }
    } catch (error) {
        console.log(`❌ API de banners - Erro de conexão: ${error.message}`);
        return { success: false, count: 0 };
    }
}

// Função principal
async function main() {
    console.log('🚀 Iniciando teste completo de funcionalidade das imagens...');
    console.log(`🔗 URL base: ${BASE_URL}`);
    console.log(`📁 Diretório de uploads: ${UPLOADS_DIR}`);
    
    // Executar todos os testes
    const physicalFiles = checkPhysicalFiles();
    const httpAccess = await testImageHTTPAccess();
    const categoriesAPI = await testCategoriesAPI();
    const bannersAPI = await testBannersAPI();
    
    // Resumo final
    console.log('\n📊 RESUMO DOS TESTES:');
    console.log('='.repeat(50));
    console.log(`📁 Arquivos no uploads: ${physicalFiles.totalFiles}`);
    console.log(`🖼️ Imagens físicas: ${physicalFiles.imageFiles}`);
    console.log(`🏷️ Banner principal: ${physicalFiles.bannerExists ? 'Existe' : 'Não encontrado'}`);
    console.log(`📋 Imagens de menu: ${physicalFiles.menuImages.length}`);
    console.log(`🌐 Imagens acessíveis via HTTP: ${httpAccess.accessible}/${httpAccess.tested}`);
    console.log(`📋 API de categorias: ${categoriesAPI.success ? `OK (${categoriesAPI.count} categorias)` : 'Erro'}`);
    console.log(`🎯 API de banners: ${bannersAPI.success ? `OK (${bannersAPI.count} banners)` : 'Erro'}`);
    
    // Verificar se há problemas
    const hasProblems = !physicalFiles.bannerExists || 
                       physicalFiles.imageFiles === 0 || 
                       httpAccess.accessible === 0 || 
                       !categoriesAPI.success;
    
    console.log(`\n${hasProblems ? '⚠️ PROBLEMAS ENCONTRADOS' : '✅ TUDO FUNCIONANDO CORRETAMENTE'}`);
    
    if (hasProblems) {
        console.log('\n🔧 AÇÕES RECOMENDADAS:');
        if (!physicalFiles.bannerExists) {
            console.log('- Verificar se banner_principal.png existe no diretório uploads');
        }
        if (physicalFiles.imageFiles === 0) {
            console.log('- Copiar imagens para o diretório uploads');
        }
        if (httpAccess.accessible === 0) {
            console.log('- Verificar configuração do servidor de imagens');
        }
        if (!categoriesAPI.success) {
            console.log('- Verificar API de categorias e conexão com banco de dados');
        }
    }
}

// Executar o teste
main().catch(console.error);