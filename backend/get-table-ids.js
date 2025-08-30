import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const getTableIds = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        const storeId = '676b4b7b8b8b8b8b8b8b8b8b';
        
        console.log('Buscando mesas...');
        const tables = await tableModel.find({ storeId });
        
        console.log(`Mesas encontradas: ${tables.length}`);
        tables.forEach((table, index) => {
            console.log(`${index + 1}. ID: ${table._id} - Mesa ${table.tableNumber} - Capacidade: ${table.capacity}`);
        });
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

getTableIds();