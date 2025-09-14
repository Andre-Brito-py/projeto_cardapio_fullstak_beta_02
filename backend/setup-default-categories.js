import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import categoryModel from './models/categoryModel.js';
import bannerModel from './models/bannerModel.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        // Verificar se já existe uma conexão ativa
        if (mongoose.connection.readyState === 1) {
            console.log('✅ Usando conexão MongoDB existente');
            return;
        }
        
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Categorias padrão baseadas nos ícones da pasta icons
const defaultCategories = [
    {
        name: 'Hambúrgueres',
        description: 'Hambúrgueres artesanais e tradicionais',
        image: 'menu_1-CpSfC1Ff.png'
    },
    {
        name: 'Pizzas',
        description: 'Pizzas tradicionais e especiais',
        image: 'menu_2-6QL_uDtg.png'
    },
    {
        name: 'Sobremesas',
        description: 'Doces e sobremesas deliciosas',
        image: 'menu_3-2xw_iDUH.png'
    },
    {
        name: 'Sanduíches',
        description: 'Sanduíches variados e saborosos',
        image: 'menu_4-CpXAwO71.png'
    },
    {
        name: 'Bolos',
        description: 'Bolos caseiros e especiais',
        image: 'menu_5-BLqPAi9S.png'
    },
    {
        name: 'Pratos Vegetarianos',
        description: 'Opções vegetarianas saudáveis',
        image: 'menu_6-BAKCTvIj.png'
    },
    {
        name: 'Massas',
        description: 'Massas italianas e caseiras',
        image: 'menu_7-Dbn_MJmR.png'
    },
    {
        name: 'Bebidas',
        description: 'Bebidas geladas e quentes',
        image: 'menu_8-D3TIbU8x.png'
    }
];

// Função para copiar ícones para a pasta uploads
const copyIconsToUploads = () => {
    const iconsPath = path.join(__dirname, '..', 'icons');
    const uploadsPath = path.join(__dirname, 'uploads');
    
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
    }
    
    // Copiar ícones de categorias
    defaultCategories.forEach(category => {
        const iconSource = path.join(iconsPath, category.image);
        const iconDest = path.join(uploadsPath, category.image);
        
        if (fs.existsSync(iconSource)) {
            fs.copyFileSync(iconSource, iconDest);
            console.log(`✅ Ícone ${category.image} copiado para uploads`);
        } else {
            console.log(`⚠️ Ícone ${category.image} não encontrado`);
        }
    });
};

// Função para criar categorias padrão
const createDefaultCategories = async (storeId = null) => {
    try {
        console.log('🔄 Verificando categorias padrão...');
        
        for (const categoryData of defaultCategories) {
            // Verificar se categoria já existe
            const query = { 
                name: { $regex: new RegExp(`^${categoryData.name}$`, 'i') }
            };
            
            if (storeId) {
                query.storeId = storeId;
            }
            
            const existingCategory = await categoryModel.findOne(query);
            
            if (!existingCategory) {
                const categoryDoc = {
                    name: categoryData.name,
                    description: categoryData.description,
                    image: categoryData.image,
                    isActive: true
                };
                
                if (storeId) {
                    categoryDoc.storeId = storeId;
                }
                
                const category = new categoryModel(categoryDoc);
                await category.save();
                console.log(`✅ Categoria '${categoryData.name}' criada`);
            } else {
                console.log(`ℹ️ Categoria '${categoryData.name}' já existe`);
            }
        }
        
        console.log('🎉 Configuração de categorias padrão concluída!');
    } catch (error) {
        console.error('❌ Erro ao criar categorias padrão:', error);
    }
};

// Criar banner padrão
const createDefaultBanner = async (storeId = null) => {
    try {
        console.log('🎨 Criando banner padrão...');
        
        const query = storeId ? { storeId: storeId } : {};
        const existingBanner = await bannerModel.findOne(query);
        
        if (!existingBanner) {
            const bannerDoc = {
                title: 'Bem-vindo ao nosso restaurante!',
                description: 'Descubra os sabores únicos da nossa cozinha. Peça já o seu prato favorito!',
                image: 'banner_principal.png',
                isActive: true,
                order: 1,
                isDefault: true
            };
            
            if (storeId) {
                bannerDoc.storeId = storeId;
            }
            
            const banner = new bannerModel(bannerDoc);
            await banner.save();
            console.log('✅ Banner padrão criado');
        } else {
            console.log('ℹ️ Banner padrão já existe');
        }
    } catch (error) {
        console.error('❌ Erro ao criar banner padrão:', error);
    }
};

// Função principal
const setupDefaultCategories = async (storeId = null, closeConnection = true) => {
    try {
        await connectDB();
        
        console.log('📋 Iniciando configuração de categorias padrão...');
        
        // Copiar ícones para uploads
        copyIconsToUploads();
        
        // Criar categorias padrão
        await createDefaultCategories(storeId);
        
        // Criar banner padrão
        await createDefaultBanner(storeId);
        
    } catch (error) {
        console.error('❌ Erro na configuração:', error);
    } finally {
        // Só fechar conexão se solicitado (quando executado diretamente)
        if (closeConnection) {
            mongoose.connection.close();
            console.log('🔌 Conexão com MongoDB fechada');
        }
    }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    setupDefaultCategories();
}

export { setupDefaultCategories, defaultCategories, createDefaultCategories, createDefaultBanner };