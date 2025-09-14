import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:123456@localhost:27017/pede_ai?authSource=admin';
        console.log('🔗 Conectando ao MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao MongoDB com sucesso!');
        
        // Verificar conexão
        const db = mongoose.connection.db;
        const collections = await db.listCollections().toArray();
        console.log('📋 Collections disponíveis:', collections.map(c => c.name));
        
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Função principal para remover duplicatas
const removeDuplicateCategories = async () => {
    try {
        console.log('🔍 Buscando categorias duplicadas...');
        
        // Buscar todas as categorias
        const allCategories = await categoryModel.find({}).sort({ createdAt: 1 });
        console.log(`📊 Total de categorias encontradas: ${allCategories.length}`);
        
        if (allCategories.length === 0) {
            console.log('❌ Nenhuma categoria encontrada no banco de dados!');
            return;
        }
        
        // Mostrar algumas categorias para debug
        console.log('\n🔍 Primeiras 5 categorias:');
        allCategories.slice(0, 5).forEach(cat => {
            console.log(`  - ${cat.name} (ID: ${cat._id}, StoreId: ${cat.storeId || 'null'}, Created: ${cat.createdAt})`);
        });
        
        // Agrupar por nome e storeId
        const categoryGroups = {};
        allCategories.forEach(category => {
            const key = `${category.name}-${category.storeId || 'null'}`;
            if (!categoryGroups[key]) {
                categoryGroups[key] = [];
            }
            categoryGroups[key].push({
                id: category._id,
                name: category.name,
                storeId: category.storeId,
                createdAt: category.createdAt
            });
        });
        
        console.log('\n📋 Grupos de categorias encontrados:');
        Object.keys(categoryGroups).forEach(key => {
            console.log(`  ${key}: ${categoryGroups[key].length} categoria(s)`);
        });
        
        let totalRemoved = 0;
        
        // Processar cada grupo
        for (const [key, categories] of Object.entries(categoryGroups)) {
            if (categories.length > 1) {
                console.log(`\n🔄 Processando duplicatas de '${categories[0].name}' (${categories.length} encontradas):`);
                
                // Manter a mais recente (última no array ordenado por createdAt)
                const toKeep = categories[categories.length - 1];
                const toRemove = categories.slice(0, -1);
                
                console.log(`  ✅ Mantendo: ${toKeep.id} (${toKeep.createdAt})`);
                
                // Remover as duplicatas
                for (const category of toRemove) {
                    try {
                        const result = await categoryModel.findByIdAndDelete(category.id);
                        if (result) {
                            console.log(`  🗑️ Removido: ${category.id} (${category.createdAt})`);
                            totalRemoved++;
                        } else {
                            console.log(`  ⚠️ Categoria ${category.id} não encontrada para remoção`);
                        }
                    } catch (deleteError) {
                        console.error(`  ❌ Erro ao remover ${category.id}:`, deleteError.message);
                    }
                }
            }
        }
        
        console.log(`\n🎉 Limpeza concluída! ${totalRemoved} categorias duplicadas removidas.`);
        
        // Verificar resultado final
        const finalCategories = await categoryModel.find().sort({ name: 1, storeId: 1 });
        console.log(`\n📊 Total de categorias restantes: ${finalCategories.length}`);
        
        // Agrupar por nome para verificar se ainda há duplicatas
        const finalGroups = {};
        finalCategories.forEach(cat => {
            const key = `${cat.name}-${cat.storeId || 'null'}`;
            if (!finalGroups[key]) {
                finalGroups[key] = [];
            }
            finalGroups[key].push(cat);
        });
        
        console.log('\n📋 Categorias finais por loja:');
        Object.keys(finalGroups).forEach(key => {
            const [name, storeId] = key.split('-');
            console.log(`  ${name} (Store: ${storeId}): ${finalGroups[key].length} categoria(s)`);
        });
        
    } catch (error) {
        console.error('❌ Erro ao remover categorias duplicadas:', error);
        console.error('Stack trace:', error.stack);
    }
};

// Função principal
const main = async () => {
    try {
        await connectDB();
        await removeDuplicateCategories();
    } catch (error) {
        console.error('❌ Erro na execução:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
        process.exit(0);
    }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { removeDuplicateCategories };