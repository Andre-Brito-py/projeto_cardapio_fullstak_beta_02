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

// Função para verificação detalhada
const detailedCategoryCheck = async () => {
    await connectDB();
    
    try {
        console.log('🔍 VERIFICAÇÃO DETALHADA DE CATEGORIAS');
        console.log('=====================================\n');
        
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`🏪 Analisando ${stores.length} lojas\n`);
        
        let totalCategories = 0;
        let duplicatesFound = [];
        
        for (const store of stores) {
            console.log(`📂 LOJA: ${store.name || store._id}`);
            console.log(`   ID da Loja: ${store._id}`);
            console.log('─'.repeat(70));
            
            // Buscar todas as categorias da loja ordenadas por nome e data de criação
            const categories = await categoryModel.find({ storeId: store._id })
                .sort({ name: 1, createdAt: 1 });
            
            totalCategories += categories.length;
            console.log(`📊 Total de categorias: ${categories.length}\n`);
            
            // Agrupar por nome para análise detalhada
            const categoryGroups = {};
            categories.forEach(category => {
                if (!categoryGroups[category.name]) {
                    categoryGroups[category.name] = [];
                }
                categoryGroups[category.name].push(category);
            });
            
            // Analisar cada grupo
            Object.keys(categoryGroups).forEach(categoryName => {
                const group = categoryGroups[categoryName];
                
                if (group.length > 1) {
                    console.log(`🔄 DUPLICATA ENCONTRADA: "${categoryName}" (${group.length} instâncias)`);
                    duplicatesFound.push({
                        store: store.name || store._id,
                        storeId: store._id,
                        categoryName: categoryName,
                        count: group.length,
                        instances: group
                    });
                    
                    group.forEach((cat, index) => {
                        const createdDate = cat.createdAt ? new Date(cat.createdAt).toLocaleString('pt-BR') : 'N/A';
                        const updatedDate = cat.updatedAt ? new Date(cat.updatedAt).toLocaleString('pt-BR') : 'N/A';
                        
                        console.log(`   ${index + 1}. ID: ${cat._id}`);
                        console.log(`      Imagem: ${cat.image || 'SEM IMAGEM'}`);
                        console.log(`      Ativo: ${cat.isActive}`);
                        console.log(`      Criado: ${createdDate}`);
                        console.log(`      Atualizado: ${updatedDate}`);
                        console.log(`      Descrição: ${cat.description || 'N/A'}`);
                        console.log('');
                    });
                } else {
                    const cat = group[0];
                    const createdDate = cat.createdAt ? new Date(cat.createdAt).toLocaleString('pt-BR') : 'N/A';
                    console.log(`✅ "${categoryName}": única`);
                    console.log(`   ID: ${cat._id} | Imagem: ${cat.image || 'SEM IMAGEM'} | Criado: ${createdDate}`);
                }
            });
            console.log('\n' + '='.repeat(70) + '\n');
        }
        
        // Relatório final detalhado
        console.log('📋 RELATÓRIO DETALHADO FINAL');
        console.log('============================');
        console.log(`🏪 Lojas analisadas: ${stores.length}`);
        console.log(`📂 Total de categorias: ${totalCategories}`);
        console.log(`🔄 Duplicatas encontradas: ${duplicatesFound.length}`);
        
        if (duplicatesFound.length > 0) {
            console.log('\n⚠️  RESUMO DAS DUPLICATAS:');
            console.log('─'.repeat(50));
            
            duplicatesFound.forEach((duplicate, index) => {
                console.log(`${index + 1}. Loja: ${duplicate.store}`);
                console.log(`   Categoria: "${duplicate.categoryName}"`);
                console.log(`   Instâncias: ${duplicate.count}`);
                console.log(`   IDs: ${duplicate.instances.map(cat => cat._id).join(', ')}`);
                console.log('');
            });
            
            console.log('💡 AÇÃO RECOMENDADA:');
            console.log('Para cada duplicata, manter apenas a primeira instância (mais antiga)');
            console.log('e remover as demais automaticamente.');
            
            // Contar total de categorias a serem removidas
            const totalToRemove = duplicatesFound.reduce((sum, dup) => sum + (dup.count - 1), 0);
            console.log(`🗑️  Total de categorias a serem removidas: ${totalToRemove}`);
            
        } else {
            console.log('\n🎉 PERFEITO! Não há duplicatas no sistema!');
        }
        
        // Verificar se há categorias órfãs (sem loja)
        const orphanCategories = await categoryModel.find({ storeId: { $exists: false } });
        if (orphanCategories.length > 0) {
            console.log(`\n⚠️  CATEGORIAS ÓRFÃS ENCONTRADAS: ${orphanCategories.length}`);
            orphanCategories.forEach(cat => {
                console.log(`   - ID: ${cat._id} | Nome: ${cat.name} | Sem storeId`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro durante a verificação:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar verificação
detailedCategoryCheck().catch(console.error);