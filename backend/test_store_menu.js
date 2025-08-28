import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import foodModel from './models/foodModel.js';
import categoryModel from './models/categoryModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        const storeSlug = 'loja-teste';
        console.log(`\n🔍 Testando menu da loja: ${storeSlug}`);
        
        // Buscar loja pelo slug
        const store = await Store.findOne({ slug: storeSlug, status: 'active' });
        if (!store) {
            console.log('❌ Loja não encontrada ou inativa');
            return;
        }
        
        console.log(`✅ Loja encontrada: ${store.name} (ID: ${store._id})`);
        
        // Buscar categorias ativas
        const categories = await categoryModel.find({ isActive: true });
        console.log(`\n📋 Categorias ativas: ${categories.length}`);
        categories.forEach((cat, index) => {
            console.log(`${index + 1}. ${cat.name}`);
        });
        
        // Buscar produtos da loja
        const foods = await foodModel.find({ 
            storeId: store._id, 
            isActive: true 
        });
        console.log(`\n🍕 Produtos da loja: ${foods.length}`);
        
        if (foods.length > 0) {
            console.log('\n📦 Lista de produtos:');
            foods.forEach((food, index) => {
                console.log(`${index + 1}. ${food.name}`);
                console.log(`   - Categoria: ${food.category}`);
                console.log(`   - Preço: R$ ${food.price}`);
                console.log(`   - StoreId: ${food.storeId}`);
                console.log('');
            });
            
            // Testar filtragem por categoria
            console.log('\n🔍 Testando filtragem por categoria:');
            const uniqueCategories = [...new Set(foods.map(f => f.category))];
            
            for (const category of uniqueCategories) {
                const filteredFoods = foods.filter(f => f.category === category);
                console.log(`\n📂 Categoria '${category}': ${filteredFoods.length} produtos`);
                filteredFoods.forEach((food, index) => {
                    console.log(`   ${index + 1}. ${food.name} - R$ ${food.price}`);
                });
            }
        } else {
            console.log('❌ Nenhum produto encontrado para esta loja');
        }
        
        // Simular resposta da API
        console.log('\n🌐 Simulando resposta da API /api/store/public/loja-teste/menu:');
        const apiResponse = {
            success: true,
            data: {
                store: {
                    _id: store._id,
                    name: store.name,
                    slug: store.slug,
                    status: store.status
                },
                categories: categories,
                foods: foods
            }
        };
        
        console.log('📊 Estrutura da resposta:');
        console.log(`   - success: ${apiResponse.success}`);
        console.log(`   - data.store.name: ${apiResponse.data.store.name}`);
        console.log(`   - data.categories.length: ${apiResponse.data.categories.length}`);
        console.log(`   - data.foods.length: ${apiResponse.data.foods.length}`);
        
        console.log('\n✅ Teste concluído! A API deve estar retornando os dados corretamente.');
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();