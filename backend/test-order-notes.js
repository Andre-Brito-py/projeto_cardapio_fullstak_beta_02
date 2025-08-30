import mongoose from 'mongoose';
import orderModel from './models/orderModel.js';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function testOrderNotes() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
        
        // Buscar pedidos com observações
        const ordersWithNotes = await orderModel.find({
            notes: { $exists: true, $ne: '', $ne: null }
        }).populate('tableId');
        
        console.log(`\n📝 Pedidos com observações encontrados: ${ordersWithNotes.length}`);
        
        if (ordersWithNotes.length > 0) {
            ordersWithNotes.forEach((order, index) => {
                console.log(`\n--- Pedido ${index + 1} ---`);
                console.log(`ID: ${order._id}`);
                console.log(`Mesa: ${order.tableId?.tableNumber || 'N/A'}`);
                console.log(`Status: ${order.status}`);
                console.log(`Observações: "${order.notes}"`);
                console.log(`Data: ${new Date(order.date).toLocaleString('pt-BR')}`);
                
                // Verificar observações nos itens
                const itemsWithObs = order.items.filter(item => item.observations);
                if (itemsWithObs.length > 0) {
                    console.log(`Itens com observações:`);
                    itemsWithObs.forEach(item => {
                        console.log(`  - ${item.name}: "${item.observations}"`);
                    });
                }
            });
        } else {
            console.log('⚠️ Nenhum pedido com observações encontrado');
            
            // Mostrar alguns pedidos recentes para verificar estrutura
            const recentOrders = await orderModel.find({})
                .sort({ date: -1 })
                .limit(3)
                .populate('tableId');
                
            console.log('\n📋 Últimos 3 pedidos (para verificar estrutura):');
            recentOrders.forEach((order, index) => {
                console.log(`${index + 1}. ID: ${order._id}`);
                console.log(`   Mesa: ${order.tableId?.tableNumber || 'N/A'}`);
                console.log(`   Notes field exists: ${order.notes !== undefined}`);
                console.log(`   Notes value: "${order.notes || 'vazio'}"`);
                console.log(`   Items count: ${order.items.length}`);
                
                // Verificar se algum item tem observações
                const hasItemObs = order.items.some(item => item.observations);
                console.log(`   Has item observations: ${hasItemObs}`);
                console.log('---');
            });
        }
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
    }
}

testOrderNotes();