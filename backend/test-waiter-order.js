import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const testWaiterOrder = async () => {
    try {
        const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdG9yZUlkIjoiNjc2YjRiN2I4YjhiOGI4YjhiOGI4YjhiIiwidHlwZSI6IndhaXRlciIsInRpbWVzdGFtcCI6MTc1NjU2NjU0MTM4MCwiaWF0IjoxNzU2NTY2NTQxLCJleHAiOjE3NTkxNTg1NDF9.GZqulOfhHcApW07S97xa2MnlGlSTcCueZn56b7TIHck';
        const apiUrl = 'http://localhost:4000';
        
        console.log('Testando envio de pedido do garçom...');
        
        const orderData = {
            tableId: '68b311f75da7f13e555c4611', // Mesa 1
            items: [
                {
                    _id: '68b313d41b8bfc1dc3c1f98b',
                    name: 'Hambúrguer Clássico',
                    price: 25.90,
                    quantity: 2
                },
                {
                    _id: '68b313d41b8bfc1dc3c1f98e',
                    name: 'Coca-Cola 350ml',
                    price: 5.50,
                    quantity: 1
                }
            ],
            customerName: 'Cliente Teste',
            customerPhone: '11999999999',
            notes: 'Pedido de teste via script'
        };
        
        console.log('Dados do pedido:', JSON.stringify(orderData, null, 2));
        
        const response = await axios.post(`${apiUrl}/api/waiter/place-order`, orderData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Pedido enviado com sucesso!');
        console.log('Resposta:', JSON.stringify(response.data, null, 2));
        
        // Testar busca de pedidos da mesa
        console.log('\nBuscando pedidos da mesa...');
        const ordersResponse = await axios.get(`${apiUrl}/api/waiter/table/68b311f75da7f13e555c4611/orders`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('Pedidos da mesa:', JSON.stringify(ordersResponse.data, null, 2));
        
    } catch (error) {
        console.error('❌ Erro ao testar pedido:', error.response?.data || error.message);
    }
};

testWaiterOrder();