import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkAndCreateTables = async () => {
    try {
        console.log('Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB com sucesso!');
        
        console.log('Verificando mesas existentes...');
        const existingTables = await tableModel.find({});
        console.log(`Mesas encontradas: ${existingTables.length}`);
        
        if (existingTables.length === 0) {
            console.log('Criando mesas de teste...');
            const testTables = [
                {
                    tableNumber: '1',
                    displayName: 'Mesa 1',
                    capacity: 4,
                    isActive: true,
                    qrCode: 'table-1-qr',
                    storeId: '676b4b7b8b8b8b8b8b8b8b8b'
                },
                {
                    tableNumber: '2',
                    displayName: 'Mesa 2',
                    capacity: 2,
                    isActive: true,
                    qrCode: 'table-2-qr',
                    storeId: '676b4b7b8b8b8b8b8b8b8b8b'
                },
                {
                    tableNumber: '3',
                    displayName: 'Mesa 3',
                    capacity: 6,
                    isActive: true,
                    qrCode: 'table-3-qr',
                    storeId: '676b4b7b8b8b8b8b8b8b8b8b'
                },
                {
                    tableNumber: '4',
                    displayName: 'Mesa 4',
                    capacity: 4,
                    isActive: true,
                    qrCode: 'table-4-qr',
                    storeId: '676b4b7b8b8b8b8b8b8b8b8b'
                },
                {
                    tableNumber: '5',
                    displayName: 'Mesa 5',
                    capacity: 8,
                    isActive: true,
                    qrCode: 'table-5-qr',
                    storeId: '676b4b7b8b8b8b8b8b8b8b8b'
                }
            ];
            
            await tableModel.insertMany(testTables);
            console.log('Mesas de teste criadas com sucesso!');
        } else {
            console.log('Mesas já existem:');
            existingTables.forEach(table => {
                console.log(`- ${table.displayName || 'Mesa ' + table.tableNumber}: ${table.capacity} lugares (${table.isActive ? 'ativa' : 'inativa'})`);
            });
        }
        
        await mongoose.disconnect();
        console.log('Desconectado do MongoDB.');
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
};

checkAndCreateTables();