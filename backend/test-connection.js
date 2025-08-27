import axios from 'axios';

const testConnection = async () => {
  try {
    console.log('🔗 Testando conexão com o servidor...');
    
    // Testar rota pública primeiro
    const publicResponse = await axios.get('http://localhost:4000/api/system/stores/public');
    console.log('✅ Conexão com servidor OK');
    console.log('📊 Lojas públicas encontradas:', publicResponse.data.stores?.length || 0);
    
    // Testar login
    console.log('\n🔐 Testando login...');
    const loginResponse = await axios.post('http://localhost:4000/api/system/super-admin/login', {
      email: 'superadmin@sistema.com',
      password: 'admin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login realizado com sucesso!');
      console.log('👤 Usuário:', loginResponse.data.user.name);
      
      // Testar criação de loja
      console.log('\n🏪 Testando criação de loja...');
      const storeResponse = await axios.post('http://localhost:4000/api/system/stores', {
        name: `Loja Teste ${Date.now()}`,
        description: 'Loja criada via API para teste',
        restaurantAddress: 'Rua Teste, 123',
        ownerName: 'Proprietario Teste',
        ownerEmail: `teste${Date.now()}@email.com`,
        ownerPassword: '123456',
        subscriptionPlan: 'Premium'
      }, {
        headers: {
          'Authorization': `Bearer ${loginResponse.data.token}`
        }
      });
      
      if (storeResponse.data.success) {
        console.log('🎉 Loja criada com sucesso!');
        console.log('📋 Dados da loja:', {
          id: storeResponse.data.data?.store?._id,
          name: storeResponse.data.data?.store?.name,
          slug: storeResponse.data.data?.store?.slug
        });
        console.log('👤 Proprietário criado:', {
          id: storeResponse.data.data?.owner?._id,
          name: storeResponse.data.data?.owner?.name,
          email: storeResponse.data.data?.owner?.email
        });
      } else {
        console.log('❌ Erro ao criar loja:', storeResponse.data.message);
      }
    } else {
      console.log('❌ Erro no login:', loginResponse.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Servidor não está rodando na porta 4000');
    } else {
      console.log('❌ Erro:', error.message);
      if (error.response) {
        console.log('📄 Resposta do servidor:', error.response.data);
      }
    }
  }
};

testConnection();