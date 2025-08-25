import mongoose from 'mongoose';
import bannerModel from './models/bannerModel.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const createTestBanner = async () => {
    try {
        // Criar um banner de teste com productId
        const testBanner = new bannerModel({
            title: 'Banner Teste com Produto',
            description: 'Clique para ver a Pizza Margherita',
            image: 'test-banner.jpg',
            isActive: true,
            order: 1,
            productId: new mongoose.Types.ObjectId() // Criar um ObjectId válido
        });

        await testBanner.save();
        console.log('Banner de teste criado com sucesso:', testBanner);
        
        // Listar todos os banners para verificar
        const allBanners = await bannerModel.find({});
        console.log('Todos os banners:', allBanners);
        
        mongoose.connection.close();
    } catch (error) {
        console.error('Erro ao criar banner de teste:', error);
        mongoose.connection.close();
    }
};

createTestBanner();