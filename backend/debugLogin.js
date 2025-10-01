import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

const BASE_URL = 'http://localhost:4001';

// Simular exatamente o que o painel admin faz
async function debugAdminLogin() {
    console.log('\n🔍 SIMULANDO LOGIN DO PAINEL ADMIN');
    console.log('==================================');
    
    // Testar Super Admin Login (como no SuperAdminLogin.jsx)
    console.log('\n--- Testando Super Admin (endpoint /api/system/super-admin/login) ---');
    try {
        const response = await axios.post(`${BASE_URL}/api/system/super-admin/login`, {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Headers:', response.headers);
        console.log('✅ Resposta completa:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERRO:');
        console.log('Status:', error.response?.status);
        console.log('Headers:', error.response?.headers);
        console.log('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.log('Mensagem:', error.message);
    }
    
    // Testar Store Admin Login (como no Login.jsx)
    console.log('\n--- Testando Store Admin (endpoint /api/store/admin/login) ---');
    try {
        const response = await axios.post(`${BASE_URL}/api/store/admin/login`, {
            email: 'admin@fooddelivery.com',
            password: 'admin123'
        }, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Status:', response.status);
        console.log('✅ Headers:', response.headers);
        console.log('✅ Resposta completa:', JSON.stringify(response.data, null, 2));
        
    } catch (error) {
        console.log('❌ ERRO:');
        console.log('Status:', error.response?.status);
        console.log('Headers:', error.response?.headers);
        console.log('Dados:', JSON.stringify(error.response?.data, null, 2));
        console.log('Mensagem:', error.message);
    }
    
    // Testar se o servidor está respondendo corretamente
    console.log('\n--- Testando conectividade básica ---');
    try {
        const response = await axios.get(`${BASE_URL}/api/system/super-admin/check`);
        console.log('✅ Servidor respondendo:', response.status);
        console.log('✅ Resposta check:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        console.log('❌ Erro de conectividade:', error.message);
    }
}

// Executar debug
debugAdminLogin().catch(console.error);