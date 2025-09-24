import axios from 'axios';

async function testCustomerLogin() {
    console.log('🔍 Debug detalhado do login customer\n');
    
    const loginData = {
        email: 'customer@fooddelivery.com',
        password: 'customer123'
    };
    
    console.log('📤 Enviando requisição de login:');
    console.log('   URL: http://localhost:4001/api/user/login');
    console.log('   Dados:', JSON.stringify(loginData, null, 2));
    console.log('');
    
    try {
        const response = await axios.post('http://localhost:4001/api/user/login', loginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📥 Resposta recebida:');
        console.log('   Status:', response.status);
        console.log('   Headers:', JSON.stringify(response.headers, null, 2));
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        console.log('');
        
        if (response.data.success) {
            console.log('✅ Login bem-sucedido!');
            console.log('   Token:', response.data.token ? 'Presente' : 'Ausente');
            console.log('   Usuário:', response.data.user ? 'Presente' : 'Ausente');
        } else {
            console.log('❌ Login falhou!');
            console.log('   Mensagem:', response.data.message);
        }
        
    } catch (error) {
        console.log('💥 Erro na requisição:');
        if (error.response) {
            console.log('   Status:', error.response.status);
            console.log('   Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('   Erro:', error.message);
        }
    }
}

testCustomerLogin();