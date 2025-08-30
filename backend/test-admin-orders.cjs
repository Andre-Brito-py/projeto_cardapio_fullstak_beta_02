const axios = require('axios');

// Teste da API de listagem de pedidos do admin
async function testAdminOrders() {
  try {
    // Primeiro, fazer login como admin para obter o token
    const loginResponse = await axios.post('http://localhost:4000/api/store/admin/login', {
      email: 'edgar@gmail.com',
      password: 'admin123'
    }, {
      headers: {
        'store-slug': 'loja-de-teste-gar-om' // usando a loja ativa
      }
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Erro no login do admin:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login do admin realizado com sucesso');
    
    // Agora buscar os pedidos com o token
    const ordersResponse = await axios.get('http://localhost:4000/api/order/list', {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'store-slug': 'loja-de-teste-gar-om'
      }
    });
    
    if (ordersResponse.data.success) {
      const orders = ordersResponse.data.data;
      console.log(`✅ Pedidos encontrados: ${orders.length}`);
      
      // Filtrar pedidos do tipo dine_in (garçom)
      const waiterOrders = orders.filter(order => order.orderType === 'dine_in');
      console.log(`🍽️ Pedidos do garçom (dine_in): ${waiterOrders.length}`);
      
      if (waiterOrders.length > 0) {
        console.log('\n📋 Detalhes dos pedidos do garçom:');
        waiterOrders.forEach((order, index) => {
          console.log(`${index + 1}. ID: ${order._id}`);
          console.log(`   Status: ${order.status}`);
          console.log(`   Valor: R$ ${order.amount}`);
          console.log(`   Data: ${new Date(order.date).toLocaleString('pt-BR')}`);
          console.log(`   Mesa: ${order.address?.table || 'N/A'}`);
          console.log('---');
        });
      } else {
        console.log('⚠️ Nenhum pedido do garçom encontrado');
      }
      
    } else {
      console.log('❌ Erro ao buscar pedidos:', ordersResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.data?.message || error.message);
  }
}

testAdminOrders();