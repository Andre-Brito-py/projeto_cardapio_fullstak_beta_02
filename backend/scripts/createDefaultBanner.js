import mongoose from 'mongoose';
import bannerModel from '../models/bannerModel.js';
import storeModel from '../models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Banner padrão
const defaultBanner = {
    title: 'Bem-vindo ao nosso delivery!',
    description: 'Peça sua comida favorita e receba em casa com rapidez e qualidade.',
    image: 'banner_principal.png',
    isActive: true,
    order: 0,
    isDefault: true
};

// Função para criar banner padrão para uma loja
const createDefaultBannerForStore = async (storeId) => {
    try {
        console.log(`Criando banner padrão para a loja: ${storeId}`);
        
        // Verificar se já existe um banner padrão para esta loja
        const existingBanner = await bannerModel.findOne({
            storeId: storeId,
            isDefault: true
        });

        if (!existingBanner) {
            const banner = new bannerModel({
                ...defaultBanner,
                storeId: storeId
            });
            
            await banner.save();
            console.log(`✓ Banner padrão criado para a loja ${storeId}`);
        } else {
            console.log(`- Banner padrão já existe para a loja ${storeId}`);
        }
    } catch (error) {
        console.error(`Erro ao criar banner para a loja ${storeId}:`, error);
    }
};

// Função principal
const main = async () => {
    await connectDB();
    
    try {
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`Encontradas ${stores.length} lojas. Criando banners padrão...`);
        
        for (const store of stores) {
            await createDefaultBannerForStore(store._id);
        }
        
        console.log('\n✅ Processo de criação de banners padrão concluído!');
    } catch (error) {
        console.error('Erro no processo principal:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Conexão com MongoDB fechada');
    }
};

// Executar o script
main().catch(console.error);