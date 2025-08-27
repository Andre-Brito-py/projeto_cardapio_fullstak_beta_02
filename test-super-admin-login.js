const testSuperAdminLogin = async () => {
  const url = 'http://localhost:4000';
  const credentials = {
    email: 'superadmin@sistema.com',
    password: 'admin123'
  };

  console.log('🔍 Testando login do Super Admin...');
  console.log('📧 Email:', credentials.email);
  console.log('🔑 Senha:', credentials.password);
  console.log('🌐 URL:', `${url}/api/system/super-admin/login`);
  console.log('\n' + '='.repeat(50));

  try {
    const response = await fetch(`${url}/api/system/super-admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    console.log('✅ Status da resposta:', response.status);
    console.log('📦 Dados da resposta:', data);
    
    if (data.success) {
      console.log('🎉 LOGIN REALIZADO COM SUCESSO!');
      console.log('🔐 Token recebido:', data.token ? 'Sim' : 'Não');
      console.log('🔐 Token (primeiros 50 chars):', data.token?.substring(0, 50) + '...');
    } else {
      console.log('❌ FALHA NO LOGIN');
      console.log('📝 Mensagem:', data.message);
    }
  } catch (error) {
    console.log('💥 ERRO NA REQUISIÇÃO');
    console.log('📝 Mensagem:', error.message);
    console.log('🔍 Detalhes do erro:', error);
  }
};

testSuperAdminLogin();