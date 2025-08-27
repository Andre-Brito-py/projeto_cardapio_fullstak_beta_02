import axios from 'axios';

const testStoreCreation = async () => {
  try {
    const response = await axios.post('http://localhost:4000/api/system/stores', {
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
        'token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY3NzU5YzNkNzE1YzE4YzI4YzI5YzE0YyIsImlhdCI6MTczNTc0NzY0NX0.Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7Ej7E'
      }
    });
    
    console.log('✅ Resposta da API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 Loja criada com sucesso!');
    } else {
      console.log('❌ Erro ao criar loja:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    if (error.response) {
      console.log('Resposta do servidor:', error.response.data);
    }
  }
};

testStoreCreation();