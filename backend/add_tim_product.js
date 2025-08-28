import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';
import Store from './models/storeModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Buscar a loja 'Loja Teste' (que representa a 'Loja de Bolos')
        const store = await Store.findOne({ slug: 'loja-teste' });
        if (!store) {
            console.log('❌ Loja não encontrada!');
            return;
        }
        
        console.log(`✅ Loja encontrada: ${store.name} (ID: ${store._id})`);
        
        // Verificar se o produto 'TIM' já existe
        const existingTim = await foodModel.findOne({ 
            name: 'TIM', 
            storeId: store._id 
        });
        
        if (existingTim) {
            console.log('✅ Produto "TIM" já existe!');
            console.log(`   - ID: ${existingTim._id}`);
            console.log(`   - Categoria: ${existingTim.category}`);
            console.log(`   - Ativo: ${existingTim.isActive}`);
        } else {
            console.log('📦 Criando produto "TIM" na categoria "Deserts"...');
            
            const timProduct = new foodModel({
                name: 'TIM',
                description: 'Delicioso bolo TIM com cobertura especial',
                price: 28.50,
                image: 'tim-cake.jpg',
                category: 'Deserts',
                storeId: store._id,
                extras: [],
                isActive: true
            });
            
            try {
                await timProduct.save();
                console.log('✅ Produto "TIM" criado com sucesso!');
                console.log(`   - ID: ${timProduct._id}`);
                console.log(`   - Categoria: ${timProduct.category}`);
                console.log(`   - Preço: R$ ${timProduct.price}`);
                console.log(`   - StoreId: ${timProduct.storeId}`);
            } catch (error) {
                console.log('❌ Erro ao criar produto "TIM":', error.message);
            }
        }
        
        // Listar todos os produtos da categoria 'Deserts' da loja
        const desertsProducts = await foodModel.find({ 
            category: 'Deserts', 
            storeId: store._id,
            isActive: true 
        });
        
        console.log(`\n🍰 Produtos na categoria "Deserts" da ${store.name}: ${desertsProducts.length}`);
        desertsProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - R$ ${product.price}`);
        });
        
        // Listar todos os produtos da loja
        const allProducts = await foodModel.find({ 
            storeId: store._id,
            isActive: true 
        });
        
        console.log(`\n📦 Total de produtos da ${store.name}: ${allProducts.length}`);
        console.log('\n📋 Lista completa:');
        allProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} (${product.category}) - R$ ${product.price}`);
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