import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:4001';

// Função para testar login do Super Admin
async function testSuperAdminLogin() {
    console.log('\n🔐 TESTANDO LOGIN DO SUPER ADMIN');
    console.log('================================');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/system/super-admin/login`, {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('🎉 LOGIN DO SUPER ADMIN FUNCIONOU!');
            return response.data.token;
        } else {
            console.log('❌ LOGIN DO SUPER ADMIN FALHOU:', response.data.message);
        }
    } catch (error) {
        console.log('❌ ERRO NO LOGIN DO SUPER ADMIN:');
        console.log('Status:', error.response?.status);
        console.log('Dados:', error.response?.data);
        console.log('Mensagem:', error.message);
    }
    
    return null;
}

// Função para testar login do Store Admin
async function testStoreAdminLogin() {
    console.log('\n🔐 TESTANDO LOGIN DO STORE ADMIN');
    console.log('===============================');
    
    try {
        const response = await axios.post(`${BASE_URL}/api/store/admin/login`, {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log('🎉 LOGIN DO STORE ADMIN FUNCIONOU!');
            return response.data.token;
        } else {
            console.log('❌ LOGIN DO STORE ADMIN FALHOU:', response.data.message);
        }
    } catch (error) {
        console.log('❌ ERRO NO LOGIN DO STORE ADMIN:');
        console.log('Status:', error.response?.status);
        console.log('Dados:', error.response?.data);
        console.log('Mensagem:', error.message);
    }
    
    return null;
}

// Função para testar login genérico (userController)
async function testGenericUserLogin() {
    console.log('\n🔐 TESTANDO LOGIN GENÉRICO (userController)');
    console.log('==========================================');
    
    try {
        // Testando com Super Admin
        console.log('\n--- Testando Super Admin no endpoint genérico ---');
        let response = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
        
        // Testando com Store Admin
        console.log('\n--- Testando Store Admin no endpoint genérico ---');
        response = await axios.post(`${BASE_URL}/api/user/login`, {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Resposta:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERRO NO LOGIN GENÉRICO:');
        console.log('Status:', error.response?.status);
        console.log('Dados:', error.response?.data);
        console.log('Mensagem:', error.message);
    }
}

// Função principal
async function main() {
    console.log('🚀 INICIANDO TESTES DE LOGIN');
    console.log('============================');
    console.log('Base URL:', BASE_URL);
    
    // Testar todos os endpoints
    await testSuperAdminLogin();
    await testStoreAdminLogin();
    await testGenericUserLogin();
    
    console.log('\n✅ TESTES CONCLUÍDOS');
}

// Executar testes
main().catch(console.error);