import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB usando a mesma configuração do server.js
const connectDB = async () => {
    try {
        const mongoUri = 'mongodb://admin:admin123@localhost:27017/mern-food-delivery-app?authSource=admin';
        console.log('🔗 Tentando conectar ao MongoDB...');
        
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        console.log('✅ MongoDB conectado com sucesso!');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar MongoDB:', error.message);
        return false;
    }
};

// Função para limpar categorias duplicadas
const cleanDuplicateCategories = async () => {
    try {
        console.log('\n🔍 Iniciando limpeza de categorias duplicadas...');
        
        // Buscar todas as categorias
        const allCategories = await categoryModel.find({}).sort({ createdAt: 1 });
        console.log(`📊 Total de categorias encontradas: ${allCategories.length}`);
        
        // Agrupar por nome e storeId
        const categoryGroups = {};
        
        allCategories.forEach(category => {
            const key = `${category.name}-${category.storeId}`;
            if (!categoryGroups[key]) {
                categoryGroups[key] = [];
            }
            categoryGroups[key].push(category);
        });
        
        console.log(`\n📋 Grupos de categorias encontrados: ${Object.keys(categoryGroups).length}`);
        
        let totalRemoved = 0;
        
        // Processar cada grupo
        for (const [key, categories] of Object.entries(categoryGroups)) {
            if (categories.length > 1) {
                const [name, storeId] = key.split('-');
                console.log(`\n🔄 Processando: ${name} (Store: ${storeId}) - ${categories.length} duplicatas`);
                
                // Ordenar por data de criação (manter a mais recente)
                categories.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                // Manter a primeira (mais recente) e remover as outras
                const toKeep = categories[0];
                const toRemove = categories.slice(1);
                
                console.log(`  ✅ Mantendo: ${toKeep._id} (${toKeep.createdAt})`);
                
                // Remover as duplicatas
                for (const category of toRemove) {
                    try {
                        await categoryModel.findByIdAndDelete(category._id);
                        console.log(`  🗑️ Removido: ${category._id} (${category.createdAt})`);
                        totalRemoved++;
                    } catch (deleteError) {
                        console.error(`  ❌ Erro ao remover ${category._id}:`, deleteError.message);
                    }
                }
            }
        }
        
        console.log(`\n🎉 Limpeza concluída!`);
        console.log(`📊 Total de categorias removidas: ${totalRemoved}`);
        
        // Verificar resultado final
        const finalCategories = await categoryModel.find({});
        console.log(`📊 Total de categorias restantes: ${finalCategories.length}`);
        
        return { removed: totalRemoved, remaining: finalCategories.length };
        
    } catch (error) {
        console.error('❌ Erro durante a limpeza:', error);
        throw error;
    }
};

// Função principal
const main = async () => {
    console.log('🚀 Iniciando script de limpeza de categorias duplicadas...');
    
    try {
        // Conectar ao banco
        const connected = await connectDB();
        if (!connected) {
            console.error('❌ Não foi possível conectar ao MongoDB');
            process.exit(1);
        }
        
        // Executar limpeza
        const result = await cleanDuplicateCategories();
        
        console.log('\n✅ Script executado com sucesso!');
        console.log(`📊 Resultado: ${result.removed} removidas, ${result.remaining} restantes`);
        
    } catch (error) {
        console.error('❌ Erro na execução do script:', error);
        process.exit(1);
    } finally {
        // Fechar conexão
        try {
            await mongoose.connection.close();
            console.log('🔌 Conexão MongoDB fechada');
        } catch (closeError) {
            console.error('❌ Erro ao fechar conexão:', closeError);
        }
        
        process.exit(0);
    }
};

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

export { cleanDuplicateCategories };