import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Categorias padrão
const defaultCategories = [
    { name: 'Hambúrgueres', image: 'menu_1-CpSfC1Ff.png' },
    { name: 'Pizzas', image: 'menu_2-6QL_uDtg.png' },
    { name: 'Sobremesas', image: 'menu_3-2xw_iDUH.png' },
    { name: 'Sanduíches', image: 'menu_4-CpXAwO71.png' },
    { name: 'Bolos', image: 'menu_5-BLqPAi9S.png' },
    { name: 'Pratos Vegetarianos', image: 'menu_6-BAKCTvIj.png' },
    { name: 'Massas', image: 'menu_7-Dbn_MJmR.png' },
    { name: 'Bebidas', image: 'menu_8-D3TIbU8x.png' }
];

// Função para copiar ícones
const copyIconsToUploads = () => {
    const iconsPath = path.join(__dirname, '..', 'icons');
    const uploadsPath = path.join(__dirname, 'uploads');
    
    console.log('📁 Caminho dos ícones:', iconsPath);
    console.log('📁 Caminho do uploads:', uploadsPath);
    
    // Verificar se a pasta icons existe
    if (!fs.existsSync(iconsPath)) {
        console.log('❌ Pasta icons não encontrada:', iconsPath);
        return;
    }
    
    // Criar pasta uploads se não existir
    if (!fs.existsSync(uploadsPath)) {
        fs.mkdirSync(uploadsPath, { recursive: true });
        console.log('📁 Pasta uploads criada');
    }
    
    // Copiar banner principal
    const bannerSource = path.join(iconsPath, 'banner_principal.png');
    const bannerDest = path.join(uploadsPath, 'banner_principal.png');
    
    if (fs.existsSync(bannerSource)) {
        fs.copyFileSync(bannerSource, bannerDest);
        console.log('✅ Banner principal copiado para uploads');
    } else {
        console.log('❌ Banner principal não encontrado:', bannerSource);
    }
    
    // Copiar ícones de categorias
    defaultCategories.forEach(category => {
        const iconSource = path.join(iconsPath, category.image);
        const iconDest = path.join(uploadsPath, category.image);
        
        console.log(`🔍 Verificando: ${iconSource}`);
        
        if (fs.existsSync(iconSource)) {
            fs.copyFileSync(iconSource, iconDest);
            console.log(`✅ Ícone ${category.image} copiado para uploads`);
        } else {
            console.log(`❌ Ícone ${category.image} não encontrado em: ${iconSource}`);
        }
    });
    
    // Listar arquivos na pasta uploads após cópia
    console.log('\n📋 Arquivos na pasta uploads:');
    const uploadedFiles = fs.readdirSync(uploadsPath);
    uploadedFiles.forEach(file => {
        console.log(`  - ${file}`);
    });
};

// Executar
copyIconsToUploads();