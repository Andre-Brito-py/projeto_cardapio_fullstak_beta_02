import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import storeModel from './models/storeModel.js';
import dotenv from 'dotenv';
import fetch from 'node-fetch';

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

// Função para testar acessibilidade das imagens
const testImageAccessibility = async (imageName) => {
    try {
        const imageUrl = `http://localhost:4001/images/${imageName}`;
        const response = await fetch(imageUrl);
        return {
            image: imageName,
            status: response.status,
            accessible: response.status === 200
        };
    } catch (error) {
        return {
            image: imageName,
            status: 'ERROR',
            accessible: false,
            error: error.message
        };
    }
};

// Função principal de teste
const testCategoriesAfterFix = async () => {
    await connectDB();
    
    try {
        console.log('🔍 TESTE DE CATEGORIAS APÓS CORREÇÃO');
        console.log('====================================\n');
        
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`🏪 Testando categorias em ${stores.length} lojas\n`);
        
        let totalCategories = 0;
        let categoriesWithImages = 0;
        let accessibleImages = 0;
        let problematicCategories = [];
        
        for (const store of stores) {
            console.log(`📂 Loja: ${store.name || store._id}`);
            console.log('─'.repeat(50));
            
            // Buscar categorias da loja
            const categories = await categoryModel.find({ storeId: store._id });
            totalCategories += categories.length;
            
            console.log(`📊 Total de categorias: ${categories.length}`);
            
            for (const category of categories) {
                if (category.image) {
                    categoriesWithImages++;
                    
                    // Testar acessibilidade da imagem
                    const imageTest = await testImageAccessibility(category.image);
                    
                    if (imageTest.accessible) {
                        accessibleImages++;
                        console.log(`✅ ${category.name}: ${category.image} (OK)`);
                    } else {
                        console.log(`❌ ${category.name}: ${category.image} (ERRO - Status: ${imageTest.status})`);
                        problematicCategories.push({
                            store: store.name || store._id,
                            category: category.name,
                            image: category.image,
                            status: imageTest.status
                        });
                    }
                } else {
                    console.log(`⚠️  ${category.name}: SEM IMAGEM`);
                }
            }
            console.log('');
        }
        
        // Relatório final
        console.log('📋 RELATÓRIO FINAL');
        console.log('==================');
        console.log(`🏪 Lojas processadas: ${stores.length}`);
        console.log(`📂 Total de categorias: ${totalCategories}`);
        console.log(`🖼️  Categorias com imagens: ${categoriesWithImages}`);
        console.log(`✅ Imagens acessíveis: ${accessibleImages}`);
        console.log(`❌ Imagens problemáticas: ${problematicCategories.length}`);
        
        if (problematicCategories.length > 0) {
            console.log('\n⚠️  CATEGORIAS COM PROBLEMAS:');
            console.log('─'.repeat(50));
            problematicCategories.forEach(item => {
                console.log(`• Loja: ${item.store}`);
                console.log(`  Categoria: ${item.category}`);
                console.log(`  Imagem: ${item.image}`);
                console.log(`  Status: ${item.status}\n`);
            });
        } else {
            console.log('\n🎉 SUCESSO! Todas as imagens estão funcionando corretamente!');
        }
        
        // Verificar se ainda existem categorias "Sobremesas"
        const sobremesasCount = await categoryModel.countDocuments({ name: 'Sobremesas' });
        if (sobremesasCount > 0) {
            console.log(`\n⚠️  ATENÇÃO: Ainda existem ${sobremesasCount} categorias "Sobremesas" no banco!`);
        } else {
            console.log('\n✅ Confirmado: Todas as categorias "Sobremesas" foram removidas');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar o teste
testCategoriesAfterFix().catch(console.error);