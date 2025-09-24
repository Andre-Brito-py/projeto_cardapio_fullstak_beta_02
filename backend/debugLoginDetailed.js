import axios from 'axios';

const debugLoginDetailed = async () => {
    const baseURL = 'http://localhost:4001';
    
    console.log('🔍 Debug detalhado do login store admin\n');
    
    try {
        // Dados de login
        const loginData = {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        };
        
        console.log('📤 Enviando requisição de login:');
        console.log('   URL:', `${baseURL}/api/store/admin/login`);
        console.log('   Dados:', JSON.stringify(loginData, null, 2));
        
        const response = await axios.post(`${baseURL}/api/store/admin/login`, loginData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('\n📥 Resposta recebida:');
        console.log('   Status:', response.status);
        console.log('   Headers:', JSON.stringify(response.headers, null, 2));
        console.log('   Data:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('\n✅ Login bem-sucedido!');
            console.log('   Token:', response.data.token ? 'Presente' : 'Ausente');
            console.log('   Usuário:', response.data.user ? 'Presente' : 'Ausente');
        } else {
            console.log('\n❌ Login falhou:');
            console.log('   Mensagem:', response.data.message);
        }
        
    } catch (error) {
        console.error('\n❌ Erro na requisição:');
        if (error.response) {
            console.error('   Status:', error.response.status);
            console.error('   Data:', error.response.data);
        } else if (error.request) {
            console.error('   Sem resposta do servidor');
        } else {
            console.error('   Erro:', error.message);
        }
    }
};

debugLoginDetailed();