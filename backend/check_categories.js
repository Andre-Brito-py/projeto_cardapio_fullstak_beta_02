import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Verificar categorias existentes
        const existingCategories = await categoryModel.find({});
        console.log(`\n📊 Categorias existentes no banco: ${existingCategories.length}`);
        
        if (existingCategories.length > 0) {
            console.log('\n📋 Lista de categorias:');
            existingCategories.forEach((category, index) => {
                console.log(`${index + 1}. ${category.name}`);
                console.log(`   - Ativa: ${category.isActive}`);
                console.log(`   - ID: ${category._id}`);
                console.log('');
            });
        }
        
        // Verificar categorias dos produtos
        const products = await foodModel.find({});
        const productCategories = [...new Set(products.map(p => p.category))];
        console.log(`\n🍕 Categorias usadas pelos produtos: ${productCategories.join(', ')}`);
        
        // Verificar quais categorias dos produtos não existem na tabela de categorias
        const existingCategoryNames = existingCategories.map(c => c.name);
        const missingCategories = productCategories.filter(cat => !existingCategoryNames.includes(cat));
        
        if (missingCategories.length > 0) {
            console.log(`\n❌ Categorias faltando: ${missingCategories.join(', ')}`);
            
            // Criar categorias faltantes
            console.log('\n📦 Criando categorias faltantes...');
            
            for (const categoryName of missingCategories) {
                const newCategory = new categoryModel({
                    name: categoryName,
                    description: `Categoria ${categoryName}`,
                    image: 'default-category.png', // Imagem padrão
                    isActive: true
                });
                
                try {
                    await newCategory.save();
                    console.log(`✅ Categoria '${categoryName}' criada com sucesso`);
                } catch (error) {
                    console.log(`❌ Erro ao criar categoria '${categoryName}':`, error.message);
                }
            }
        } else {
            console.log('\n✅ Todas as categorias dos produtos já existem!');
        }
        
        // Verificar novamente após criação
        const finalCategories = await categoryModel.find({});
        console.log(`\n📊 Total de categorias após verificação: ${finalCategories.length}`);
        
        console.log('\n📋 Lista final de categorias:');
        finalCategories.forEach((category, index) => {
            console.log(`${index + 1}. ${category.name} (Ativa: ${category.isActive})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();