import mongoose from 'mongoose';
import dotenv from 'dotenv';
import categoryModel from './models/categoryModel.js';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🚀 Iniciando remoção de categorias duplicadas...');

const fixDuplicates = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:123456@localhost:27017/pede_ai?authSource=admin';
        console.log('🔗 Conectando ao MongoDB...');
        
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao MongoDB!');
        
        // Buscar todas as categorias
        const allCategories = await categoryModel.find({}).sort({ createdAt: 1 });
        console.log(`📊 Total de categorias: ${allCategories.length}`);
        
        // Agrupar por nome
        const categoryGroups = {};
        allCategories.forEach(cat => {
            if (!categoryGroups[cat.name]) {
                categoryGroups[cat.name] = [];
            }
            categoryGroups[cat.name].push(cat);
        });
        
        let totalRemoved = 0;
        
        // Processar cada grupo
        for (const [name, categories] of Object.entries(categoryGroups)) {
            if (categories.length > 1) {
                console.log(`\n🔄 Processando '${name}' - ${categories.length} duplicatas encontradas`);
                
                // Manter apenas a primeira (mais antiga)
                const toKeep = categories[0];
                const toRemove = categories.slice(1);
                
                console.log(`  ✅ Mantendo: ${toKeep._id} (criada em: ${toKeep.createdAt})`);
                
                // Remover as duplicatas
                for (const category of toRemove) {
                    try {
                        await categoryModel.findByIdAndDelete(category._id);
                        console.log(`  🗑️ Removida: ${category._id} (criada em: ${category.createdAt})`);
                        totalRemoved++;
                    } catch (deleteError) {
                        console.error(`  ❌ Erro ao remover ${category._id}:`, deleteError.message);
                    }
                }
            } else {
                console.log(`✅ '${name}' - apenas 1 categoria, OK`);
            }
        }
        
        console.log(`\n🎉 Remoção concluída! ${totalRemoved} categorias duplicadas removidas.`);
        
        // Verificar resultado final
        const finalCategories = await categoryModel.find({});
        console.log(`📊 Total de categorias restantes: ${finalCategories.length}`);
        
        // Contar novamente por nome
        const finalCounts = {};
        finalCategories.forEach(cat => {
            if (!finalCounts[cat.name]) {
                finalCounts[cat.name] = 0;
            }
            finalCounts[cat.name]++;
        });
        
        console.log('\n📋 Contagem final por nome:');
        Object.keys(finalCounts).forEach(name => {
            console.log(`  ${name}: ${finalCounts[name]} categoria(s)`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Processo finalizado!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        console.error('Stack:', error.stack);
    }
};

fixDuplicates();