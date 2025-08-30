import mongoose from 'mongoose';
import orderModel from './models/orderModel.js';
import tableModel from './models/tableModel.js';
import dotenv from 'dotenv';

dotenv.config();

const STORE_ID = '676b4b7b8b8b8b8b8b8b8b8b';

async function checkOrdersDirect() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
        
        console.log('\n📋 Buscando todos os pedidos da loja...');
        const allOrders = await orderModel.find({ storeId: STORE_ID })
            .populate('tableId', 'tableNumber displayName capacity location')
            .sort({ date: -1 });
        
        console.log(`Total de pedidos encontrados: ${allOrders.length}`);
        
        if (allOrders.length === 0) {
            console.log('❌ Nenhum pedido encontrado para esta loja');
            return;
        }
        
        // Filtrar pedidos do tipo dine_in (garçom)
        const waiterOrders = allOrders.filter(order => order.orderType === 'dine_in');
        console.log(`\n🍽️ Pedidos de garçom (dine_in): ${waiterOrders.length}`);
        
        if (waiterOrders.length === 0) {
            console.log('❌ Nenhum pedido de garçom encontrado');
            console.log('\n📊 Tipos de pedidos encontrados:');
            const orderTypes = [...new Set(allOrders.map(order => order.orderType))];
            orderTypes.forEach(type => {
                const count = allOrders.filter(order => order.orderType === type).length;
                console.log(`  - ${type}: ${count} pedidos`);
            });
        } else {
            waiterOrders.forEach((order, index) => {
                console.log(`\n--- Pedido de Garçom ${index + 1} ---`);
                console.log(`ID: ${order._id}`);
                console.log(`Mesa ID: ${order.tableId}`);
                console.log(`Mesa Info: ${order.tableId ? `${order.tableId.displayName || order.tableId.tableNumber}` : 'N/A'}`);
                console.log(`Status: ${order.status}`);
                console.log(`Valor: R$ ${order.amount}`);
                console.log(`Cliente: ${order.address.firstName}`);
                console.log(`Telefone: ${order.address.phone}`);
                console.log(`Data: ${new Date(order.date).toLocaleString('pt-BR')}`);
                console.log(`Tipo: ${order.orderType}`);
                console.log(`Pagamento: ${order.payment ? 'Pago' : 'Pendente'}`);
                console.log(`Itens (${order.items.length}):`);
                order.items.forEach(item => {
                    console.log(`  - ${item.name} x${item.quantity} - R$ ${item.price}`);
                });
                if (order.notes) {
                    console.log(`Observações: ${order.notes}`);
                }
            });
        }
        
        // Mostrar também os pedidos mais recentes de qualquer tipo
        console.log('\n📅 Últimos 3 pedidos (qualquer tipo):');
        allOrders.slice(0, 3).forEach((order, index) => {
            console.log(`${index + 1}. ${order._id} - ${order.orderType} - R$ ${order.amount} - ${new Date(order.date).toLocaleString('pt-BR')}`);
        });
        
    } catch (error) {
        console.log('❌ Erro:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
    }
}

checkOrdersDirect();