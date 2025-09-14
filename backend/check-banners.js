import mongoose from 'mongoose';
import bannerModel from './models/bannerModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkBanners = async () => {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB');
        
        // Buscar todos os banners
        const banners = await bannerModel.find({});
        
        console.log(`\n📊 Total de banners encontrados: ${banners.length}`);
        
        if (banners.length > 0) {
            console.log('\n🎨 Lista de banners:');
            banners.forEach((banner, index) => {
                console.log(`${index + 1}. ${banner.title}`);
                console.log(`   - ID: ${banner._id}`);
                console.log(`   - Loja: ${banner.storeId || 'Não definida'}`);
                console.log(`   - Imagem: ${banner.image}`);
                console.log(`   - Ativo: ${banner.isActive}`);
                console.log(`   - Ordem: ${banner.order}`);
                console.log('');
            });
        } else {
            console.log('\n❌ Nenhum banner encontrado no banco de dados');
        }
        
    } catch (error) {
        console.error('❌ Erro ao verificar banners:', error.message);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

checkBanners();