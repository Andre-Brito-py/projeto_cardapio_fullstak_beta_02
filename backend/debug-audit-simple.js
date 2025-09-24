import axios from 'axios';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

console.log('🔍 TESTE SIMPLES DE DEBUG DO SISTEMA DE AUDITORIA');
console.log('='.repeat(60));

// Função para fazer login
async function loginSuperAdmin() {
    try {
        console.log('🔐 Fazendo login como super admin...');
        
        const response = await axios.post('http://localhost:4001/api/system/super-admin/login', {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        });
        
        if (response.data.success && response.data.token) {
            console.log('✅ Login realizado com sucesso!');
            console.log(`🔑 Token: ${response.data.token.substring(0, 50)}...`);
            return response.data.token;
        } else {
            console.log('❌ Falha no login:', response.data.message);
            return null;
        }
    } catch (error) {
        console.error('❌ Erro no login:', error.response?.data?.message || error.message);
        return null;
    }
}

// Função para testar uma rota específica
async function testRoute(token, method, url, description) {
    try {
        console.log(`\n🧪 Testando: ${description}`);
        console.log(`📍 ${method} ${url}`);
        
        const config = {
            method: method.toLowerCase(),
            url: `http://localhost:4001${url}`,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        };
        
        const response = await axios(config);
        console.log(`✅ Sucesso: ${response.status}`);
        
        // Aguardar um pouco para o middleware processar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        return true;
    } catch (error) {
        console.log(`❌ Erro: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        return false;
    }
}

// Função para verificar logs no banco
async function checkLogsInDatabase() {
    try {
        console.log('\n🔍 Verificando logs no banco de dados...');
        
        const mongoose = await import('mongoose');
        
        if (mongoose.default.connection.readyState !== 1) {
            await mongoose.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery');
        }
        
        const AuditLog = (await import('./models/auditLogModel.js')).default;
        
        const totalLogs = await AuditLog.countDocuments();
        console.log(`📊 Total de logs: ${totalLogs}`);
        
        if (totalLogs > 0) {
            const recentLogs = await AuditLog.find()
                .sort({ createdAt: -1 })
                .limit(3)
                .select('action category userId storeId createdAt details');
            
            console.log('📋 Últimos logs:');
            recentLogs.forEach((log, index) => {
                console.log(`  ${index + 1}. ${log.action} (${log.category}) - ${log.createdAt}`);
                console.log(`     User: ${log.userId} | Store: ${log.storeId}`);
                console.log(`     Details: ${log.details}`);
            });
        }
        
        return totalLogs;
    } catch (error) {
        console.error('❌ Erro ao verificar logs:', error.message);
        return 0;
    }
}

// Função principal
async function runSimpleTest() {
    try {
        // 1. Login
        const token = await loginSuperAdmin();
        if (!token) {
            console.log('❌ Não foi possível fazer login. Abortando teste.');
            return;
        }
        
        // 2. Verificar logs antes
        const logsBefore = await checkLogsInDatabase();
        
        // 3. Testar algumas rotas
        console.log('\n' + '='.repeat(40));
        console.log('🧪 TESTANDO ROTAS PARA GERAR LOGS');
        console.log('='.repeat(40));
        
        await testRoute(token, 'GET', '/api/system/stats', 'Estatísticas do Sistema');
        await testRoute(token, 'GET', '/api/system/audit/stats', 'Estatísticas de Auditoria');
        
        // 4. Verificar logs depois
        console.log('\n' + '='.repeat(40));
        const logsAfter = await checkLogsInDatabase();
        
        // 5. Resultado
        console.log('\n' + '='.repeat(40));
        console.log('📊 RESULTADO DO TESTE');
        console.log('='.repeat(40));
        console.log(`Logs antes: ${logsBefore}`);
        console.log(`Logs depois: ${logsAfter}`);
        console.log(`Novos logs criados: ${logsAfter - logsBefore}`);
        
        if (logsAfter > logsBefore) {
            console.log('🎉 SUCESSO! O sistema de auditoria está funcionando!');
        } else {
            console.log('⚠️  PROBLEMA: Nenhum log foi criado durante o teste.');
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error.message);
    }
}

// Executar teste
runSimpleTest();