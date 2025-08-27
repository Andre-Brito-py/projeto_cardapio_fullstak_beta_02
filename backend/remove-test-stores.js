import axios from 'axios';

const removeTestStores = async () => {
  try {
    console.log('🔐 Fazendo login como super admin...');
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
    
    // Buscar todas as lojas públicas
    console.log('📋 Buscando lojas...');
    const storesResponse = await axios.get('http://localhost:4000/api/system/stores/public');
    
    if (!storesResponse.data.success) {
      console.log('❌ Erro ao buscar lojas:', storesResponse.data.message);
      return;
    }
    
    const stores = storesResponse.data.stores;
    const testStores = stores.filter(store => 
      store.name.includes('Test Store Debug') || 
      store.slug.includes('test-store-debug')
    );
    
    console.log(`🎯 Encontradas ${testStores.length} lojas de teste para remover:`);
    testStores.forEach(store => {
      console.log(`  - ${store.name} (${store.slug})`);
    });
    
    // Remover cada loja de teste
    for (const store of testStores) {
      try {
        console.log(`🗑️ Removendo loja: ${store.name}...`);
        
        // Primeiro, desativar a loja
        await axios.put(`http://localhost:4000/api/system/stores/${store.id}/status`, {
          status: 'inactive',
          reason: 'Loja de teste removida automaticamente'
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Depois, deletar a loja
        const deleteResponse = await axios.delete(`http://localhost:4000/api/system/stores/${store.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (deleteResponse.data.success) {
          console.log(`✅ Loja ${store.name} removida com sucesso!`);
        } else {
          console.log(`❌ Erro ao remover loja ${store.name}:`, deleteResponse.data.message);
        }
      } catch (error) {
        console.log(`❌ Erro ao remover loja ${store.name}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('🎉 Processo de limpeza concluído!');
    
  } catch (error) {
    console.log('❌ Erro geral:', error.response?.data?.message || error.message);
  }
};

removeTestStores();