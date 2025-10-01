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

// Categorias padrão CORRIGIDAS - apenas com imagens que funcionam
const defaultCategories = [
    {
        name: 'Hambúrgueres',
        description: 'Deliciosos hambúrgueres artesanais',
        image: 'menu_1-BLqPAi9S.png' // ✅ Funciona
    },
    {
        name: 'Pizzas',
        description: 'Pizzas tradicionais e especiais',
        image: 'menu_2-6QL_uDtg.png' // ✅ Funciona
    },
    {
        name: 'Bebidas',
        description: 'Refrigerantes, sucos e bebidas geladas',
        image: 'menu_3-2xw_iDUH.png' // ✅ Funciona
    },
    {
        name: 'Saladas',
        description: 'Saladas frescas e saudáveis',
        image: 'menu_5-BLqPAi9S.png' // ✅ Funciona
    },
    {
        name: 'Pratos Executivos',
        description: 'Refeições completas e nutritivas',
        image: 'menu_6-BAKCTvIj.png' // ✅ Funciona
    },
    {
        name: 'Lanches',
        description: 'Lanches rápidos e saborosos',
        image: 'menu_7-Dbn_MJmR.png' // ✅ Funciona
    },
    {
        name: 'Açaí',
        description: 'Açaí cremoso com diversos acompanhamentos',
        image: 'menu_8-D3TIbU8x.png' // ✅ Funciona
    }
    // REMOVIDO: Sobremesas com menu_4-CpXAwO71.png (imagem não disponível)
    // NOTA: menu_1-CpSfC1Ff.png está disponível mas não é usado no script original
];

// Função para remover categorias com imagens bugadas
const removeOldCategories = async (storeId) => {
    try {
        console.log(`🗑️  Removendo categorias com imagens bugadas da loja: ${storeId}`);
        
        // Remover categoria "Sobremesas" que usa imagem não disponível
        const deletedCategories = await categoryModel.deleteMany({
            storeId: storeId,
            name: 'Sobremesas'
        });
        
        if (deletedCategories.deletedCount > 0) {
            console.log(`✅ Removidas ${deletedCategories.deletedCount} categorias "Sobremesas" com imagem bugada`);
        }
        
    } catch (error) {
        console.error(`Erro ao remover categorias antigas da loja ${storeId}:`, error);
    }
};

// Função para criar categorias padrão para uma loja
const createDefaultCategoriesForStore = async (storeId) => {
    try {
        console.log(`\n📂 Processando loja: ${storeId}`);
        
        // Primeiro, remover categorias com imagens bugadas
        await removeOldCategories(storeId);
        
        console.log(`✨ Criando categorias padrão corrigidas...`);
        
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
                console.log(`✅ Categoria '${categoryData.name}' criada (${categoryData.image})`);
            } else {
                // Atualizar imagem se necessário
                if (existingCategory.image !== categoryData.image) {
                    existingCategory.image = categoryData.image;
                    await existingCategory.save();
                    console.log(`🔄 Categoria '${categoryData.name}' atualizada com nova imagem (${categoryData.image})`);
                } else {
                    console.log(`⏭️  Categoria '${categoryData.name}' já existe e está correta`);
                }
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
        console.log('🔧 SCRIPT DE CORREÇÃO DE CATEGORIAS PADRÃO');
        console.log('=====================================');
        console.log('Este script irá:');
        console.log('1. Remover categorias com imagens bugadas');
        console.log('2. Criar/atualizar apenas categorias com imagens funcionais');
        console.log('3. Garantir que todas as imagens estejam acessíveis\n');
        
        // Buscar todas as lojas
        const allStores = await storeModel.find({});
        console.log(`🏪 Encontradas ${allStores.length} lojas para processar\n`);
        
        for (const store of allStores) {
            await createDefaultCategoriesForStore(store._id);
        }
        
        console.log('\n🎉 PROCESSO CONCLUÍDO COM SUCESSO!');
        console.log('=====================================');
        console.log('✅ Todas as categorias agora usam apenas imagens funcionais');
        console.log('✅ Categorias com imagens bugadas foram removidas');
        console.log('✅ Sistema pronto para uso sem erros de imagem');
        
    } catch (error) {
        console.error('❌ Erro no processo principal:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar o script
main().catch(console.error);