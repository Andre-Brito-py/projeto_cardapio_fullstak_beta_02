import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const BASE_URL = 'http://localhost:4000';
const STORE_ID = '676b4b7b8b8b8b8b8b8b8b8b';

async function testAdminLogin() {
    try {
        console.log('🔐 Fazendo login como admin da loja...');
        
        // Tentar login com credenciais de teste
        const loginResponse = await axios.post(`${BASE_URL}/api/store/admin/login`, {
            email: 'admin@loja-teste.com',
            password: 'admin123'
        }, {
            headers: {
                'store-id': STORE_ID
            }
        });

        if (loginResponse.data.success) {
            console.log('✅ Login realizado com sucesso!');
            console.log('Token:', loginResponse.data.token);
            console.log('Usuário:', loginResponse.data.user);
            
            const token = loginResponse.data.token;
            
            // Agora testar a listagem de pedidos
            console.log('\n📋 Buscando pedidos da loja...');
            const ordersResponse = await axios.get(`${BASE_URL}/api/order/list`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'store-id': STORE_ID
                }
            });
            
            if (ordersResponse.data.success) {
                console.log('✅ Pedidos encontrados:');
                console.log(`Total de pedidos: ${ordersResponse.data.data.length}`);
                
                // Filtrar pedidos do tipo dine_in (garçom)
                const waiterOrders = ordersResponse.data.data.filter(order => order.orderType === 'dine_in');
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
                console.log('❌ Erro ao buscar pedidos:', ordersResponse.data.message);
            }
        } else {
            console.log('❌ Erro no login:', loginResponse.data.message);
            console.log('\n🔧 Vou tentar criar um admin de teste...');
            
            // Se o login falhar, tentar criar um admin de teste
            await createTestAdmin();
        }
    } catch (error) {
        console.log('❌ Erro na requisição:', error.response?.data || error.message);
        
        if (error.response?.status === 404) {
            console.log('\n🔧 Admin não encontrado, criando admin de teste...');
            await createTestAdmin();
        }
    }
}

async function createTestAdmin() {
    try {
        console.log('\n📦 Criando admin de teste...');
        
        // Primeiro verificar se a loja existe
        const storeResponse = await axios.get(`${BASE_URL}/api/store/public/loja-teste`);
        
        if (!storeResponse.data.success) {
            console.log('❌ Loja de teste não encontrada');
            return;
        }
        
        console.log('✅ Loja de teste encontrada:', storeResponse.data.store.name);
        console.log('\n⚠️ Para criar um admin, você precisa executar o script setup-test-data.js primeiro');
        console.log('Execute: node setup-test-data.js');
        
    } catch (error) {
        console.log('❌ Erro ao verificar loja:', error.response?.data || error.message);
    }
}

testAdminLogin();