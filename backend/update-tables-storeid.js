import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const updateTablesStoreId = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        const targetStoreId = '676b4b7b8b8b8b8b8b8b8b8b';
        
        console.log('Atualizando todas as mesas para o storeId correto...');
        const result = await tableModel.updateMany(
            {}, // Atualizar todas as mesas
            { storeId: targetStoreId }
        );
        
        console.log(`Mesas atualizadas: ${result.modifiedCount}`);
        
        console.log('Verificando mesas após atualização...');
        const updatedTables = await tableModel.find({ storeId: targetStoreId });
        console.log(`Mesas encontradas para storeId ${targetStoreId}: ${updatedTables.length}`);
        
        updatedTables.forEach((table, index) => {
            console.log(`Mesa ${index + 1}: ${table.displayName} (${table.tableNumber}) - Ativa: ${table.isActive}`);
        });
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

updateTablesStoreId();