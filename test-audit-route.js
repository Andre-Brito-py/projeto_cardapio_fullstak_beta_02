import axios from 'axios';

async function testAuditRoute() {
  try {
    console.log('🧪 Testando rota /api/system/stats...');
    
    const response = await axios.get('http://localhost:4001/api/system/stats', {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Resposta recebida:', response.status);
    console.log('📊 Dados:', response.data);
    
  } catch (error) {
    console.log('❌ Erro na requisição:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📄 Dados do erro:', error.response.data);
    }
  }
}

testAuditRoute();