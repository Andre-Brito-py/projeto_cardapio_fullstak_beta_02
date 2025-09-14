import mongoose from 'mongoose';
import Store from './models/storeModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin');
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Limpar lojas com subdomain null
const cleanNullSubdomains = async () => {
    try {
        await connectDB();
        
        console.log('🔍 Procurando lojas com subdomain null...');
        
        // Buscar lojas com subdomain null ou undefined
        const storesWithNullSubdomain = await Store.find({
            $or: [
                { 'domain.subdomain': null },
                { 'domain.subdomain': { $exists: false } }
            ]
        });
        
        console.log(`📊 Encontradas ${storesWithNullSubdomain.length} lojas com subdomain null`);
        
        if (storesWithNullSubdomain.length > 0) {
            // Deletar lojas com subdomain null
            const result = await Store.deleteMany({
                $or: [
                    { 'domain.subdomain': null },
                    { 'domain.subdomain': { $exists: false } }
                ]
            });
            
            console.log(`🗑️ ${result.deletedCount} lojas com subdomain null foram removidas`);
        } else {
            console.log('✅ Nenhuma loja com subdomain null encontrada');
        }
        
    } catch (error) {
        console.error('❌ Erro ao limpar subdomains null:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar limpeza
cleanNullSubdomains();