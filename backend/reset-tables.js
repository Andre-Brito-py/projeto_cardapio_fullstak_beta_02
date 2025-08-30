import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const resetTables = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        const targetStoreId = '676b4b7b8b8b8b8b8b8b8b8b';
        
        console.log('Removendo todas as mesas existentes...');
        const deleteResult = await tableModel.deleteMany({});
        console.log(`Mesas removidas: ${deleteResult.deletedCount}`);
        
        console.log('Criando novas mesas para o storeId correto...');
        const newTables = [
            {
                tableNumber: '1',
                displayName: 'Mesa 1',
                capacity: 4,
                isActive: true,
                qrCode: 'table-1-qr-' + Date.now(),
                storeId: targetStoreId
            },
            {
                tableNumber: '2',
                displayName: 'Mesa 2',
                capacity: 2,
                isActive: true,
                qrCode: 'table-2-qr-' + Date.now(),
                storeId: targetStoreId
            },
            {
                tableNumber: '3',
                displayName: 'Mesa 3',
                capacity: 6,
                isActive: true,
                qrCode: 'table-3-qr-' + Date.now(),
                storeId: targetStoreId
            },
            {
                tableNumber: '4',
                displayName: 'Mesa 4',
                capacity: 4,
                isActive: true,
                qrCode: 'table-4-qr-' + Date.now(),
                storeId: targetStoreId
            },
            {
                tableNumber: '5',
                displayName: 'Mesa 5',
                capacity: 8,
                isActive: true,
                qrCode: 'table-5-qr-' + Date.now(),
                storeId: targetStoreId
            }
        ];
        
        const insertResult = await tableModel.insertMany(newTables);
        console.log(`Novas mesas criadas: ${insertResult.length}`);
        
        console.log('Verificando mesas criadas...');
        const createdTables = await tableModel.find({ storeId: targetStoreId });
        console.log(`Mesas encontradas para storeId ${targetStoreId}: ${createdTables.length}`);
        
        createdTables.forEach((table, index) => {
            console.log(`Mesa ${index + 1}: ${table.displayName} (${table.tableNumber}) - Capacidade: ${table.capacity} - Ativa: ${table.isActive}`);
        });
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

resetTables();