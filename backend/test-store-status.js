import axios from 'axios';

const testStoreStatus = async () => {
  try {
    console.log('🔐 Fazendo login como super admin...');
    
    // Login do super admin
    const loginResponse = await axios.post('http://localhost:4000/api/system/super-admin/login', {
      email: 'superadmin@sistema.com',
      password: 'superadmin123'
    });
    
    if (!loginResponse.data.success) {
      console.log('❌ Erro no login:', loginResponse.data.message);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login realizado com sucesso!');
    
    // Buscar lojas disponíveis
    console.log('\n📋 Buscando lojas disponíveis...');
    const storesResponse = await axios.get('http://localhost:4000/api/system/stores', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (!storesResponse.data.success) {
      console.log('❌ Erro ao buscar lojas:', storesResponse.data.message);
      return;
    }
    
    const stores = storesResponse.data.data.stores;
    console.log(`✅ Encontradas ${stores.length} lojas`);
    
    if (stores.length === 0) {
      console.log('⚠️ Nenhuma loja encontrada para testar');
      return;
    }
    
    // Testar mudança de status na primeira loja
    const testStore = stores[0];
    console.log(`\n🧪 Testando mudança de status na loja: ${testStore.name}`);
    console.log(`📊 Status atual: ${testStore.status}`);
    
    const newStatus = testStore.status === 'active' ? 'suspended' : 'active';
    console.log(`🔄 Tentando alterar para: ${newStatus}`);
    
    const updateResponse = await axios.put(`http://localhost:4000/api/system/stores/${testStore._id}/status`, {
      status: newStatus,
      reason: 'Teste de funcionalidade'
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (updateResponse.data.success) {
      console.log('✅ Status atualizado com sucesso!');
      console.log('📊 Resposta:', updateResponse.data);
      
      // Reverter o status
      console.log('\n🔄 Revertendo status...');
      const revertResponse = await axios.put(`http://localhost:4000/api/system/stores/${testStore._id}/status`, {
        status: testStore.status,
        reason: 'Revertendo teste'
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (revertResponse.data.success) {
        console.log('✅ Status revertido com sucesso!');
        console.log('🎉 Teste concluído - O endpoint está funcionando corretamente!');
      } else {
        console.log('❌ Erro ao reverter status:', revertResponse.data.message);
      }
    } else {
      console.log('❌ Erro ao atualizar status:', updateResponse.data.message);
    }
    
  } catch (error) {
    console.log('❌ Erro geral:', error.response?.data?.message || error.message);
    console.log('📋 Detalhes do erro:', error.response?.data || error.message);
  }
};

testStoreStatus();