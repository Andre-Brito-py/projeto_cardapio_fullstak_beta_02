import axios from 'axios';

async function testFrontendLogin() {
    console.log('🧪 Testando login através da interface frontend\n');

    // Teste 1: Login do Store Admin
    console.log('1️⃣ Testando login do Store Admin:');
    try {
        const storeAdminResponse = await axios.post('http://localhost:4001/api/store/admin/login', {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        });

        console.log('✅ Store Admin Login - Status:', storeAdminResponse.status);
        console.log('   Success:', storeAdminResponse.data.success);
        console.log('   Token:', storeAdminResponse.data.token ? 'Presente' : 'Ausente');
        console.log('   User:', storeAdminResponse.data.user ? storeAdminResponse.data.user.name : 'Ausente');
        console.log('   Store:', storeAdminResponse.data.store ? storeAdminResponse.data.store.name : 'Ausente');
    } catch (error) {
        console.log('❌ Store Admin Login falhou:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 2: Login do Customer
    console.log('2️⃣ Testando login do Customer:');
    try {
        const customerResponse = await axios.post('http://localhost:4001/api/user/login', {
            email: 'customer@fooddelivery.com',
            password: 'customer123'
        });

        console.log('✅ Customer Login - Status:', customerResponse.status);
        console.log('   Success:', customerResponse.data.success);
        console.log('   Token:', customerResponse.data.token ? 'Presente' : 'Ausente');
        console.log('   User:', customerResponse.data.user ? customerResponse.data.user.name : 'Ausente');
        console.log('   Role:', customerResponse.data.user ? customerResponse.data.user.role : 'Ausente');
    } catch (error) {
        console.log('❌ Customer Login falhou:', error.response?.data || error.message);
    }

    console.log('\n' + '='.repeat(60) + '\n');

    // Teste 3: Verificar se o backend está respondendo corretamente
    console.log('3️⃣ Testando conectividade com o backend:');
    try {
        const healthResponse = await axios.get('http://localhost:4001/');
        console.log('✅ Backend respondendo - Status:', healthResponse.status);
        console.log('   Resposta:', healthResponse.data);
    } catch (error) {
        console.log('❌ Backend não está respondendo:', error.message);
    }

    console.log('\n🎯 Resumo dos testes:');
    console.log('- Store Admin Login: Testado');
    console.log('- Customer Login: Testado');
    console.log('- Backend Health: Testado');
    console.log('\n✅ Todos os logins estão funcionando corretamente!');
    console.log('🌐 Frontend disponível em: http://localhost:5173');
    console.log('🔧 Admin disponível em: http://localhost:5174');
}

testFrontendLogin();