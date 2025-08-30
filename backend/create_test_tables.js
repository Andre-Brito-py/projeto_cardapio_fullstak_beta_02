import mongoose from 'mongoose';
import tableModel from './models/tableModel.js';
import Store from './models/storeModel.js';
import { v4 as uuidv4 } from 'uuid';
import 'dotenv/config';

const createTestTables = async () => {
    try {
        // Conectar ao banco
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
        
        // Listar todas as lojas primeiro
        const allStores = await Store.find({});
        console.log('🏪 Lojas encontradas:', allStores.length);
        allStores.forEach(store => {
            console.log(`- ${store.name} (slug: ${store.slug}, ID: ${store._id})`);
        });
        
        // Buscar a primeira loja disponível
        const store = allStores[0];
        if (!store) {
            console.log('❌ Nenhuma loja encontrada');
            return;
        }
        
        console.log(`\n🏪 Usando loja: ${store.name} (ID: ${store._id})`);
        
        // Verificar se já existem mesas
        const existingTables = await tableModel.find({ storeId: store._id });
        console.log(`📋 Mesas existentes: ${existingTables.length}`);
        
        if (existingTables.length === 0) {
            console.log('\n🪑 Criando mesas de teste...');
            
            const testTables = [
                {
                    storeId: store._id,
                    tableNumber: '1',
                    displayName: 'Mesa 1',
                    capacity: 4,
                    location: 'Área principal',
                    isActive: true
                },
                {
                    storeId: store._id,
                    tableNumber: '2',
                    displayName: 'Mesa 2',
                    capacity: 2,
                    location: 'Área principal',
                    isActive: true
                },
                {
                    storeId: store._id,
                    tableNumber: '3',
                    displayName: 'Mesa 3',
                    capacity: 6,
                    location: 'Área VIP',
                    isActive: true
                }
            ];
            
            for (const tableData of testTables) {
                const qrCodeId = uuidv4();
                const table = new tableModel({
                    ...tableData,
                    qrCode: qrCodeId
                });
                // Gerar QR code URL
                table.qrCodeUrl = table.generateQRCodeUrl();
                await table.save();
                console.log(`✅ Mesa criada: ${table.displayName} (${table.tableNumber})`);
            }
            
            console.log('\n🎉 Todas as mesas de teste foram criadas!');
        } else {
            console.log('\n📋 Mesas já existem:');
            existingTables.forEach(table => {
                console.log(`- ${table.displayName} (${table.tableNumber}) - ${table.isActive ? 'Ativa' : 'Inativa'}`);
            });
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        mongoose.connection.close();
        console.log('🔌 Conexão fechada');
    }
};

createTestTables();