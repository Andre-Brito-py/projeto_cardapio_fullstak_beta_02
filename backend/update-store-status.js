import mongoose from 'mongoose';
import storeModel from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateStoreStatus = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        console.log('Atualizando status da loja para active...');
        const result = await storeModel.findByIdAndUpdate(
            '676b4b7b8b8b8b8b8b8b8b8b',
            { status: 'active' },
            { new: true }
        );
        
        if (result) {
            console.log('Loja atualizada com sucesso:');
            console.log('- ID:', result._id);
            console.log('- Nome:', result.name);
            console.log('- Status:', result.status);
        } else {
            console.log('Loja não encontrada!');
        }
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

updateStoreStatus();