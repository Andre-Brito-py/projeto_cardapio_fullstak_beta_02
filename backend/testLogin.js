import axios from 'axios';

const testLogin = async () => {
    try {
        console.log('🔍 Testando login do Super Admin...\n');

        const response = await axios.post('http://localhost:4001/api/system/super-admin/login', {
            email: 'superadmin@fooddelivery.com',
            password: 'admin123'
        });

        console.log('✅ Resposta da API:');
        console.log(JSON.stringify(response.data, null, 2));

        if (response.data.success) {
            console.log('\n🎉 LOGIN BEM-SUCEDIDO!');
            console.log('Token:', response.data.token.substring(0, 20) + '...');
        } else {
            console.log('\n❌ FALHA NO LOGIN');
            console.log('Mensagem:', response.data.message);
        }

    } catch (error) {
        console.error('❌ Erro ao testar login:', error.message);
        if (error.response) {
            console.log('Resposta do servidor:', error.response.data);
        }
    }
};

testLogin();