import axios from 'axios';

async function testAuditWithAuth() {
  try {
    console.log('🧪 Testando sistema de auditoria com autenticação...');
    
    // Primeiro, fazer login como super admin
    console.log('🔐 Fazendo login como super admin...');
    const loginResponse = await axios.post('http://localhost:4001/api/system/super-admin/login', {
      email: 'superadmin@fooddelivery.com',
      password: 'superadmin123'
    });
    
    if (loginResponse.data.success) {
      console.log('✅ Login realizado com sucesso');
      const token = loginResponse.data.token;
      
      // Agora testar a rota /api/system/stats com token
      console.log('📊 Testando rota /api/system/stats com token...');
      const statsResponse = await axios.get('http://localhost:4001/api/system/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Stats obtidas com sucesso:', statsResponse.status);
      console.log('📊 Dados:', JSON.stringify(statsResponse.data, null, 2));
      
      // Testar rota de audit stats
      console.log('📈 Testando rota /api/system/audit/stats...');
      const auditStatsResponse = await axios.get('http://localhost:4001/api/system/audit/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Audit stats obtidas:', auditStatsResponse.status);
      console.log('📈 Dados de auditoria:', JSON.stringify(auditStatsResponse.data, null, 2));
      
    } else {
      console.log('❌ Falha no login:', loginResponse.data);
    }
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📄 Dados do erro:', error.response.data);
    }
  }
}

testAuditWithAuth();