import mongoose from 'mongoose';
import storeModel from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

const testConnection = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        console.log('Buscando loja com ID: 676b4b7b8b8b8b8b8b8b8b8b');
        const store = await storeModel.findById('676b4b7b8b8b8b8b8b8b8b8b');
        
        if (store) {
            console.log('Loja encontrada:');
            console.log('- ID:', store._id);
            console.log('- Nome:', store.name);
            console.log('- Ativa:', store.isActive);
            console.log('- Slug:', store.slug);
        } else {
            console.log('Loja não encontrada!');
            
            // Listar todas as lojas
            console.log('\nListando todas as lojas:');
            const allStores = await storeModel.find({});
            allStores.forEach(s => {
                console.log(`- ${s._id}: ${s.name} (ativa: ${s.isActive})`);
            });
        }
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

testConnection();