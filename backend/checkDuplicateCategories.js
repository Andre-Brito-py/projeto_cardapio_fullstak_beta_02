import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import storeModel from './models/storeModel.js';
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

// Função para verificar duplicatas
const checkDuplicateCategories = async () => {
    await connectDB();
    
    try {
        console.log('🔍 VERIFICAÇÃO DE CATEGORIAS DUPLICADAS');
        console.log('======================================\n');
        
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`🏪 Verificando ${stores.length} lojas\n`);
        
        let totalDuplicates = 0;
        let duplicatesByStore = {};
        
        for (const store of stores) {
            console.log(`📂 Loja: ${store.name || store._id}`);
            console.log('─'.repeat(50));
            
            // Buscar todas as categorias da loja
            const categories = await categoryModel.find({ storeId: store._id });
            
            // Agrupar por nome para encontrar duplicatas
            const categoryGroups = {};
            categories.forEach(category => {
                if (!categoryGroups[category.name]) {
                    categoryGroups[category.name] = [];
                }
                categoryGroups[category.name].push(category);
            });
            
            // Identificar duplicatas
            const duplicates = {};
            let storeDuplicateCount = 0;
            
            Object.keys(categoryGroups).forEach(categoryName => {
                const group = categoryGroups[categoryName];
                if (group.length > 1) {
                    duplicates[categoryName] = group;
                    storeDuplicateCount += group.length - 1; // -1 porque vamos manter uma
                    console.log(`🔄 "${categoryName}": ${group.length} duplicatas encontradas`);
                    group.forEach((cat, index) => {
                        console.log(`   ${index + 1}. ID: ${cat._id} | Imagem: ${cat.image || 'SEM IMAGEM'} | Ativo: ${cat.isActive}`);
                    });
                } else {
                    console.log(`✅ "${categoryName}": única (OK)`);
                }
            });
            
            if (storeDuplicateCount > 0) {
                duplicatesByStore[store._id] = {
                    storeName: store.name || store._id,
                    duplicates: duplicates,
                    count: storeDuplicateCount
                };
                totalDuplicates += storeDuplicateCount;
                console.log(`⚠️  Total de duplicatas nesta loja: ${storeDuplicateCount}`);
            } else {
                console.log(`✅ Nenhuma duplicata encontrada nesta loja`);
            }
            console.log('');
        }
        
        // Relatório final
        console.log('📋 RELATÓRIO DE DUPLICATAS');
        console.log('==========================');
        console.log(`🏪 Lojas verificadas: ${stores.length}`);
        console.log(`🔄 Total de duplicatas encontradas: ${totalDuplicates}`);
        console.log(`🏪 Lojas com duplicatas: ${Object.keys(duplicatesByStore).length}`);
        
        if (totalDuplicates > 0) {
            console.log('\n⚠️  DETALHES DAS DUPLICATAS POR LOJA:');
            console.log('─'.repeat(50));
            
            Object.values(duplicatesByStore).forEach(storeData => {
                console.log(`\n🏪 ${storeData.storeName} (${storeData.count} duplicatas)`);
                Object.keys(storeData.duplicates).forEach(categoryName => {
                    const group = storeData.duplicates[categoryName];
                    console.log(`   📂 "${categoryName}": ${group.length} instâncias`);
                });
            });
            
            console.log('\n💡 RECOMENDAÇÃO:');
            console.log('Para cada categoria duplicada, será mantida apenas a primeira instância');
            console.log('e as demais serão removidas automaticamente.');
        } else {
            console.log('\n🎉 PERFEITO! Não há categorias duplicadas no sistema!');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar verificação
checkDuplicateCategories().catch(console.error);