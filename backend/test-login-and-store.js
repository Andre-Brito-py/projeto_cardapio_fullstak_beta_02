import axios from 'axios';

const testLoginAndStoreCreation = async () => {
  try {
    // Primeiro, fazer login como super admin
    console.log('🔐 Fazendo login como super admin...');
    const loginResponse = await axios.post('http://localhost:4000/api/system/super-admin/login', {
      email: 'superadmin@sistema.com',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Erro no login:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    
    // Agora, criar a loja
    console.log('🏪 Criando loja...');
    const storeResponse = await axios.post('http://localhost:4000/api/system/stores', {
      name: 'Loja Teste API',
      description: 'Loja criada via API para teste',
      restaurantAddress: 'Rua Teste, 123',
      ownerName: 'Proprietario Teste',
      ownerEmail: `teste${Date.now()}@email.com`,
      ownerPassword: '123456',
      subscriptionPlan: 'Premium'
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Resposta da API de criação de loja:');
    console.log(JSON.stringify(storeResponse.data, null, 2));
    
    if (storeResponse.data.success) {
      console.log('🎉 Loja criada com sucesso!');
      console.log('📊 Dados da loja:', storeResponse.data.data);
    } else {
      console.log('❌ Erro ao criar loja:', storeResponse.data.message);
    }
  } catch (error) {
    console.log('❌ Erro:', error.message);
    if (error.response) {
      console.log('Resposta do servidor:', error.response.data);
    }
  }
};

testLoginAndStoreCreation();