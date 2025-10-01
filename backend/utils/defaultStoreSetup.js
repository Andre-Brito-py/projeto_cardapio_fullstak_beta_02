import categoryModel from '../models/categoryModel.js';
import bannerModel from '../models/bannerModel.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapeamento das categorias padrão com suas respectivas imagens
const defaultCategories = [
    {
        name: 'Bolos',
        description: 'Deliciosos bolos caseiros',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Massas',
        description: 'Massas frescas e saborosas',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Pratos Executivos',
        description: 'Pratos completos para o almoço',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Refeições',
        description: 'Refeições completas e nutritivas',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Rolinhos',
        description: 'Rolinhos crocantes e saborosos',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Sanduíches Naturais',
        description: 'Sanduíches saudáveis e naturais',
        image: 'default-category.svg',
        isActive: true
    },
    {
        name: 'Sobremesas',
        description: 'Doces e sobremesas irresistíveis',
        image: 'default-category.svg',
        isActive: true
    }
];

/**
 * Cria as categorias padrão para uma nova loja
 * @param {string} storeId - ID da loja
 * @returns {Promise<Array>} Array com as categorias criadas
 */
export const createDefaultCategoriesForNewStore = async (storeId) => {
    try {
        console.log(`Criando categorias padrão para a loja ${storeId}...`);
        
        const createdCategories = [];
        
        for (const categoryData of defaultCategories) {
            const category = new categoryModel({
                name: categoryData.name,
                description: categoryData.description,
                image: categoryData.image,
                isActive: categoryData.isActive,
                storeId: storeId
            });
            
            const savedCategory = await category.save();
            createdCategories.push(savedCategory);
            console.log(`✅ Categoria criada: ${categoryData.name}`);
        }
        
        console.log(`✅ ${createdCategories.length} categorias padrão criadas com sucesso!`);
        return createdCategories;
        
    } catch (error) {
        console.error('Erro ao criar categorias padrão:', error);
        throw error;
    }
};

/**
 * Cria o banner padrão para uma nova loja
 * @param {string} storeId - ID da loja
 * @returns {Promise<Object>} Banner criado
 */
export const createDefaultBannerForNewStore = async (storeId) => {
    try {
        console.log(`Criando banner padrão para a loja ${storeId}...`);
        
        const defaultBanner = {
            title: 'Banner Principal',
            description: 'Banner promocional da loja',
            image: 'banner_principal.png',
            isActive: true,
            isDefault: true,
            storeId: storeId,
            link: '',
            order: 1
        };
        
        const banner = new bannerModel(defaultBanner);
        const savedBanner = await banner.save();
        
        console.log(`✅ Banner padrão criado: ${defaultBanner.title}`);
        return savedBanner;
        
    } catch (error) {
        console.error('Erro ao criar banner padrão:', error);
        throw error;
    }
};

/**
 * Configura todos os elementos padrão para uma nova loja (categorias + banner)
 * @param {string} storeId - ID da loja
 * @returns {Promise<Object>} Objeto com categorias e banner criados
 */
export const setupDefaultStoreContent = async (storeId) => {
    try {
        console.log(`🏪 Configurando conteúdo padrão para a loja ${storeId}...`);
        
        // Criar categorias padrão
        const categories = await createDefaultCategoriesForNewStore(storeId);
        
        // Criar banner padrão
        const banner = await createDefaultBannerForNewStore(storeId);
        
        console.log(`🎉 Configuração padrão concluída para a loja ${storeId}!`);
        
        return {
            categories,
            banner,
            success: true,
            message: `${categories.length} categorias e 1 banner criados com sucesso`
        };
        
    } catch (error) {
        console.error('Erro ao configurar conteúdo padrão da loja:', error);
        return {
            categories: [],
            banner: null,
            success: false,
            message: 'Erro ao criar conteúdo padrão',
            error: error.message
        };
    }
};

export default {
    createDefaultCategoriesForNewStore,
    createDefaultBannerForNewStore,
    setupDefaultStoreContent
};