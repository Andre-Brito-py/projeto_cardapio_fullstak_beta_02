import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Verificar produtos existentes
        const existingFoods = await foodModel.find({});
        console.log(`📊 Produtos encontrados no banco: ${existingFoods.length}`);
        
        if (existingFoods.length === 0) {
            console.log('📦 Populando produtos iniciais...');
            const initialFoods = [
                {
                    name: 'Pizza Margherita',
                    description: 'Pizza clássica com molho de tomate, mussarela e manjericão',
                    price: 25.99,
                    image: 'pizza.jpg',
                    category: 'Pizza',
                    extras: [],
                    isActive: true
                },
                {
                    name: 'Hambúrguer Clássico',
                    description: 'Hambúrguer com carne, alface, tomate e queijo',
                    price: 18.50,
                    image: 'burger.jpg',
                    category: 'Burger',
                    extras: [],
                    isActive: true
                },
                {
                    name: 'Salada Caesar',
                    description: 'Salada fresca com alface, croutons e molho caesar',
                    price: 15.00,
                    image: 'salad.jpg',
                    category: 'Salad',
                    extras: [],
                    isActive: true
                },
                {
                    name: 'Lasanha Bolonhesa',
                    description: 'Lasanha tradicional com molho bolonhesa e queijo',
                    price: 22.00,
                    image: 'lasagna.jpg',
                    category: 'Pasta',
                    extras: [],
                    isActive: true
                },
                {
                    name: 'Sushi Combo',
                    description: 'Combo de sushi com salmão, atum e camarão',
                    price: 35.00,
                    image: 'sushi.jpg',
                    category: 'Japanese',
                    extras: [],
                    isActive: true
                }
            ];
            
            const savedFoods = await foodModel.insertMany(initialFoods);
            console.log('✅ Produtos iniciais populados com sucesso!');
            console.log('🆔 IDs dos produtos criados:');
            savedFoods.forEach(food => {
                console.log(`   - ${food.name}: ${food._id}`);
            });
        } else {
            console.log('✅ Produtos já existem no banco de dados');
        }
        
        // Verificar novamente após inserção
        const allFoods = await foodModel.find({});
        console.log(`\n📊 Total de produtos após operação: ${allFoods.length}`);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();