import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:4000';
const STORE_ID = '676b4b7b8b8b8b8b8b8b8b8b';

async function checkAdminOrders() {
    try {
        console.log('Verificando pedidos no admin...');
        
        // Buscar todos os pedidos da loja
        const response = await axios.get(`${BASE_URL}/api/order/list`, {
            headers: {
                'Content-Type': 'application/json'
            },
            params: {
                storeId: STORE_ID
            }
        });

        if (response.data.success) {
            console.log('✅ Pedidos encontrados:');
            console.log(`Total de pedidos: ${response.data.data.length}`);
            
            // Filtrar pedidos do tipo dine_in (garçom)
            const waiterOrders = response.data.data.filter(order => order.orderType === 'dine_in');
            console.log(`\nPedidos de garçom (dine_in): ${waiterOrders.length}`);
            
            waiterOrders.forEach((order, index) => {
                console.log(`\n--- Pedido ${index + 1} ---`);
                console.log(`ID: ${order._id}`);
                console.log(`Mesa: ${order.tableId}`);
                console.log(`Status: ${order.status}`);
                console.log(`Valor: R$ ${order.amount}`);
                console.log(`Cliente: ${order.address.firstName}`);
                console.log(`Telefone: ${order.address.phone}`);
                console.log(`Data: ${new Date(order.date).toLocaleString('pt-BR')}`);
                console.log(`Itens:`);
                order.items.forEach(item => {
                    console.log(`  - ${item.name} x${item.quantity} - R$ ${item.price}`);
                });
            });
        } else {
            console.log('❌ Erro ao buscar pedidos:', response.data.message);
        }
    } catch (error) {
        console.log('❌ Erro na requisição:', error.response?.data || error.message);
    }
}

checkAdminOrders();