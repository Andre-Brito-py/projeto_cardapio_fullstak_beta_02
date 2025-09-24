import mongoose from 'mongoose';
import categoryModel from '../models/categoryModel.js';
import storeModel from '../models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Categorias padrão com suas respectivas imagens
const defaultCategories = [
    {
        name: 'Hambúrgueres',
        description: 'Deliciosos hambúrgueres artesanais',
        image: 'menu_1-BLqPAi9S.png'
    },
    {
        name: 'Pizzas',
        description: 'Pizzas tradicionais e especiais',
        image: 'menu_2-6QL_uDtg.png'
    },
    {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e bebidas geladas',
        image: 'menu_3-2xw_iDUH.png'
    },
    {
        name: 'Sobremesas',
        description: 'Doces e sobremesas irresistíveis',
        image: 'menu_4-CpXAwO71.png'
    },
    {
        name: 'Saladas',
        description: 'Saladas frescas e saudáveis',
        image: 'menu_5-BLqPAi9S.png'
    },
    {
        name: 'Pratos Executivos',
        description: 'Refeições completas e nutritivas',
        image: 'menu_6-BAKCTvIj.png'
    },
    {
        name: 'Lanches',
        description: 'Lanches rápidos e saborosos',
        image: 'menu_7-Dbn_MJmR.png'
    },
    {
        name: 'Açaí',
        description: 'Açaí cremoso com diversos acompanhamentos',
        image: 'menu_8-D3TIbU8x.png'
    }
];

// Função para criar categorias padrão para uma loja
const createDefaultCategoriesForStore = async (storeId) => {
    try {
        console.log(`Criando categorias padrão para a loja: ${storeId}`);
        
        for (const categoryData of defaultCategories) {
            // Verificar se a categoria já existe para esta loja
            const existingCategory = await categoryModel.findOne({
                name: categoryData.name,
                storeId: storeId
            });

            if (!existingCategory) {
                const category = new categoryModel({
                    ...categoryData,
                    storeId: storeId,
                    isActive: true
                });
                
                await category.save();
                console.log(`✓ Categoria '${categoryData.name}' criada para a loja ${storeId}`);
            } else {
                console.log(`- Categoria '${categoryData.name}' já existe para a loja ${storeId}`);
            }
        }
    } catch (error) {
        console.error(`Erro ao criar categorias para a loja ${storeId}:`, error);
    }
};

// Função principal
const main = async () => {
    await connectDB();
    
    try {
        // Buscar todas as lojas que têm defaultCategories = true
        const stores = await storeModel.find({ 'settings.defaultCategories': true });
        
        if (stores.length === 0) {
            console.log('Nenhuma loja encontrada com defaultCategories = true');
            
            // Buscar todas as lojas para criar categorias padrão
            const allStores = await storeModel.find({});
            console.log(`Encontradas ${allStores.length} lojas. Criando categorias padrão para todas...`);
            
            for (const store of allStores) {
                await createDefaultCategoriesForStore(store._id);
            }
        } else {
            console.log(`Encontradas ${stores.length} lojas com defaultCategories = true`);
            
            for (const store of stores) {
                await createDefaultCategoriesForStore(store._id);
            }
        }
        
        console.log('\n✅ Processo de criação de categorias padrão concluído!');
    } catch (error) {
        console.error('Erro no processo principal:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexão com MongoDB fechada');
    }
};

// Executar o script
main().catch(console.error);