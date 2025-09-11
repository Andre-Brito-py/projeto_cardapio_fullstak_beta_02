import axios from 'axios';

// Teste direto da API do Telegram
const testTelegramAPI = async () => {
  const token = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';
  
  try {
    console.log('🔍 Testando API do Telegram...');
    console.log('Token:', token.substring(0, 10) + '...');
    
    const response = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
    
    if (response.data.ok) {
      console.log('✅ API do Telegram funcionando!');
      console.log('Bot Info:', {
        id: response.data.result.id,
        first_name: response.data.result.first_name,
        username: response.data.result.username,
        is_bot: response.data.result.is_bot
      });
      return true;
    } else {
      console.log('❌ API retornou erro:', response.data);
      return false;
    }
  } catch (error) {
    console.log('❌ Erro ao testar API:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Response:', error.response?.data);
    return false;
  }
};

// Teste da rota local
const testLocalRoute = async () => {
  const token = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';
  
  try {
    console.log('\n🔍 Testando rota local /api/telegram/test-bot...');
    
    const response = await axios.post('http://localhost:4000/api/telegram/test-bot', {
      token: token
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Rota local funcionando!');
    console.log('Response:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Erro na rota local:');
    console.log('Status:', error.response?.status);
    console.log('Message:', error.message);
    console.log('Response:', error.response?.data);
    return false;
  }
};

// Executar testes
const runTests = async () => {
  console.log('🚀 Iniciando testes da API do Telegram\n');
  
  const apiTest = await testTelegramAPI();
  const routeTest = await testLocalRoute();
  
  console.log('\n📊 Resultados:');
  console.log('API Direta:', apiTest ? '✅' : '❌');
  console.log('Rota Local:', routeTest ? '✅' : '❌');
  
  if (apiTest && routeTest) {
    console.log('\n🎉 Todos os testes passaram! A API está funcionando corretamente.');
  } else {
    console.log('\n⚠️  Alguns testes falharam. Verifique a configuração.');
  }
};

runTests().catch(console.error);