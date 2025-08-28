import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Verificar produtos
        const foods = await foodModel.find({});
        console.log(`\n📊 Total de produtos no banco: ${foods.length}`);
        
        if (foods.length > 0) {
            console.log('\n🍕 Lista de produtos:');
            foods.forEach((food, index) => {
                console.log(`${index + 1}. ${food.name}`);
                console.log(`   - ID: ${food._id}`);
                console.log(`   - isActive: ${food.isActive}`);
                console.log(`   - storeId: ${food.storeId || 'null'}`);
                console.log(`   - categoria: ${food.category}`);
                console.log(`   - preço: R$ ${food.price}`);
                console.log('');
            });
        } else {
            console.log('❌ Nenhum produto encontrado no banco de dados');
        }
        
        // Verificar produtos ativos
        const activeFoods = await foodModel.find({ isActive: true });
        console.log(`\n✅ Produtos ativos: ${activeFoods.length}`);
        
        // Verificar produtos por loja
        const foodsByStore = await foodModel.aggregate([
            { $group: { _id: '$storeId', count: { $sum: 1 } } }
        ]);
        console.log('\n🏪 Produtos por loja:');
        foodsByStore.forEach(store => {
            console.log(`   - Loja ${store._id || 'sem loja'}: ${store.count} produtos`);
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