import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkTables = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        console.log('Buscando todas as mesas...');
        const tables = await tableModel.find({});
        console.log(`Total de mesas encontradas: ${tables.length}`);
        
        tables.forEach((table, index) => {
            console.log(`Mesa ${index + 1}:`);
            console.log(`  ID: ${table._id}`);
            console.log(`  StoreId: ${table.storeId}`);
            console.log(`  Tipo do StoreId: ${typeof table.storeId}`);
            console.log(`  TableNumber: ${table.tableNumber}`);
            console.log(`  DisplayName: ${table.displayName}`);
            console.log(`  IsActive: ${table.isActive}`);
            console.log('---');
        });
        
        console.log('\nBuscando mesas com storeId específico...');
        const targetStoreId = '676b4b7b8b8b8b8b8b8b8b8b';
        const tablesForStore = await tableModel.find({ storeId: targetStoreId });
        console.log(`Mesas encontradas para storeId ${targetStoreId}: ${tablesForStore.length}`);
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

checkTables();