import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';
import categoryModel from './models/categoryModel.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestProducts = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        const storeId = '676b4b7b8b8b8b8b8b8b8b8b';
        
        // Verificar se já existem categorias
        let categories = await categoryModel.find();
        
        if (categories.length === 0) {
            console.log('Criando categorias de teste...');
            const testCategories = [
                { name: 'Pratos Principais', image: 'main-dishes.jpg', isActive: true },
                { name: 'Bebidas', image: 'drinks.jpg', isActive: true },
                { name: 'Sobremesas', image: 'desserts.jpg', isActive: true }
            ];
            
            categories = await categoryModel.insertMany(testCategories);
            console.log(`Categorias criadas: ${categories.length}`);
        }
        
        // Criar produtos de teste
        console.log('Criando produtos de teste...');
        const testProducts = [
            {
                name: 'Hambúrguer Clássico',
                description: 'Hambúrguer com carne, queijo, alface e tomate',
                price: 25.90,
                image: 'hamburger.jpg',
                category: categories[0].name,
                storeId,
                isActive: true
            },
            {
                name: 'Pizza Margherita',
                description: 'Pizza com molho de tomate, mussarela e manjericão',
                price: 32.50,
                image: 'pizza.jpg',
                category: categories[0].name,
                storeId,
                isActive: true
            },
            {
                name: 'Batata Frita',
                description: 'Porção de batata frita crocante',
                price: 12.90,
                image: 'fries.jpg',
                category: categories[0].name,
                storeId,
                isActive: true
            },
            {
                name: 'Coca-Cola 350ml',
                description: 'Refrigerante Coca-Cola lata 350ml',
                price: 5.50,
                image: 'coca.jpg',
                category: categories[1].name,
                storeId,
                isActive: true
            },
            {
                name: 'Suco de Laranja',
                description: 'Suco natural de laranja 300ml',
                price: 8.90,
                image: 'orange-juice.jpg',
                category: categories[1].name,
                storeId,
                isActive: true
            },
            {
                name: 'Pudim de Leite',
                description: 'Pudim de leite condensado com calda de caramelo',
                price: 9.90,
                image: 'pudding.jpg',
                category: categories[2].name,
                storeId,
                isActive: true
            }
        ];
        
        const products = await foodModel.insertMany(testProducts);
        console.log(`Produtos criados: ${products.length}`);
        
        console.log('Verificando produtos criados...');
        const createdProducts = await foodModel.find({ storeId });
        console.log(`Total de produtos para a loja: ${createdProducts.length}`);
        
        createdProducts.forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - R$ ${product.price} - Categoria: ${product.category}`);
        });
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

createTestProducts();