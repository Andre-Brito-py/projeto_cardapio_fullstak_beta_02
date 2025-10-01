import mongoose from 'mongoose';
import categoryModel from '../models/categoryModel.js';
import storeModel from '../models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Lista de imagens problemáticas identificadas
const buggedImages = [
    'menu_4.png',
    'menu_5.png', 
    'menu_6.png',
    'menu_7.png',
    '/images/categoria-pratos.jpg'
];

// Lista de categorias problemáticas por nome
const buggedCategoryNames = [
    'Sanduíches',
    'Bolos', 
    'Vegetariano',
    'Massas',
    'Pratos Principais'
];

// Função principal para limpeza
const cleanupBuggedCategories = async () => {
    await connectDB();
    
    try {
        console.log('🧹 LIMPEZA DE CATEGORIAS COM IMAGENS BUGADAS');
        console.log('=============================================\n');
        
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`🏪 Processando ${stores.length} lojas\n`);
        
        let totalRemoved = 0;
        
        for (const store of stores) {
            console.log(`📂 Processando loja: ${store.name || store._id}`);
            
            // Remover categorias por imagem bugada
            const removedByImage = await categoryModel.deleteMany({
                storeId: store._id,
                image: { $in: buggedImages }
            });
            
            // Remover categorias por nome problemático
            const removedByName = await categoryModel.deleteMany({
                storeId: store._id,
                name: { $in: buggedCategoryNames }
            });
            
            const storeTotal = removedByImage.deletedCount + removedByName.deletedCount;
            totalRemoved += storeTotal;
            
            if (storeTotal > 0) {
                console.log(`✅ Removidas ${storeTotal} categorias com problemas`);
                if (removedByImage.deletedCount > 0) {
                    console.log(`   - ${removedByImage.deletedCount} por imagem bugada`);
                }
                if (removedByName.deletedCount > 0) {
                    console.log(`   - ${removedByName.deletedCount} por nome problemático`);
                }
            } else {
                console.log(`⏭️  Nenhuma categoria problemática encontrada`);
            }
            console.log('');
        }
        
        console.log('📋 RESULTADO DA LIMPEZA');
        console.log('========================');
        console.log(`🗑️  Total de categorias removidas: ${totalRemoved}`);
        
        if (totalRemoved > 0) {
            console.log('\n🎉 Limpeza concluída com sucesso!');
            console.log('✅ Todas as categorias com imagens bugadas foram removidas');
            console.log('✅ Sistema agora contém apenas categorias funcionais');
        } else {
            console.log('\n✨ Sistema já estava limpo!');
            console.log('✅ Nenhuma categoria problemática foi encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar a limpeza
cleanupBuggedCategories().catch(console.error);