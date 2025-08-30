import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkProducts = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        const storeId = '676b4b7b8b8b8b8b8b8b8b8b';
        
        console.log('Buscando produtos...');
        const products = await foodModel.find({ storeId });
        
        console.log(`Produtos encontrados: ${products.length}`);
        
        if (products.length > 0) {
            products.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} - R$ ${product.price} - Categoria: ${product.category}`);
            });
        } else {
            console.log('Nenhum produto encontrado para esta loja.');
        }
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

checkProducts();