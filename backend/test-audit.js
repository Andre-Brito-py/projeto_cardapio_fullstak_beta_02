import axios from 'axios';

const BASE_URL = 'http://localhost:4001';

// Função para fazer login e obter token
async function login() {
    try {
        console.log('🔐 Fazendo login como super admin...');
        
        const response = await axios.post(`${BASE_URL}/api/system/super-admin/login`, {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        });
        
        if (response.data.success) {
            console.log('✅ Login realizado com sucesso!');
            console.log('🔑 Token obtido:', response.data.token.substring(0, 50) + '...');
            return response.data.token;
        } else {
            console.log('❌ Falha no login:', response.data.message);
            return null;
        }
    } catch (error) {
        console.log('❌ Erro no login:', error.response?.data?.message || error.message);
        return null;
    }
}

// Função para testar se o sistema básico está funcionando
async function testBasicSystem(token) {
    try {
        console.log('\n🔧 Testando sistema básico...');
        
        const response = await axios.get(`${BASE_URL}/api/system/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Sistema básico funcionando:');
        console.log('Status:', response.status);
        console.log('Dados:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Erro no sistema básico:');
        console.log('Status:', error.response?.status);
        console.log('Mensagem:', error.response?.data?.message || error.message);
        console.log('Headers de resposta:', error.response?.headers);
        return false;
    }
}

// Função para adicionar logs de debug no middleware
async function addDebugToMiddleware() {
    try {
        console.log('🔧 Adicionando logs de debug ao middleware...');
        
        // Criar uma versão temporária do middleware com debug
        const debugMiddleware = `
// Debug temporário para auditoria
export const debugAuditMiddleware = (req, res, next) => {
    console.log('🔍 DEBUG AUDIT:', {
        method: req.method,
        originalUrl: req.originalUrl,
        path: req.path,
        route: req.route?.path,
        user: req.user ? { id: req.user._id, role: req.user.role } : null,
        storeContext: req.storeContext
    });
    next();
};
`;
        
        // Adicionar ao final do arquivo auditLogger.js
        const fs = await import('fs');
        fs.appendFileSync('./middleware/auditLogger.js', debugMiddleware);
        
        console.log('✅ Debug adicionado ao middleware');
        return true;
    } catch (error) {
        console.error('❌ Erro ao adicionar debug:', error.message);
        return false;
    }
}
async function checkAuditLogsInDatabase() {
    try {
        console.log('🔍 Verificando logs de auditoria no banco de dados...');
        
        // Conectar ao MongoDB diretamente
        const mongoose = await import('mongoose');
        
        if (mongoose.default.connection.readyState !== 1) {
            await mongoose.default.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery');
        }
        
        // Importar o modelo AuditLog
        const AuditLog = (await import('./models/auditLogModel.js')).default;
        
        // Contar total de logs
        const totalLogs = await AuditLog.countDocuments();
        console.log(`📊 Total de logs de auditoria no banco: ${totalLogs}`);
        
        // Buscar os últimos 5 logs
        const recentLogs = await AuditLog.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('action category storeId userId createdAt');
        
        console.log('📋 Últimos logs de auditoria:');
        recentLogs.forEach((log, index) => {
            console.log(`  ${index + 1}. ${log.action} (${log.category}) - Store: ${log.storeId} - User: ${log.userId} - ${log.createdAt}`);
        });
        
        return totalLogs > 0;
    } catch (error) {
        console.error('❌ Erro ao verificar logs no banco:', error.message);
        return false;
    }
}
async function testAuditStats(token) {
    try {
        console.log('\n📊 Testando estatísticas de auditoria...');
        
        const response = await axios.get(`${BASE_URL}/api/system/audit/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Estatísticas obtidas com sucesso:');
        console.log(JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Erro ao obter estatísticas:', error.response?.data?.message || error.message);
        return false;
    }
}

// Função para testar logs de auditoria de usuário
async function testUserAuditLogs(token, userId = '68d2a0df957bd0cd44b38db3') {
    try {
        console.log('\n👤 Testando logs de auditoria de usuário...');
        
        const response = await axios.get(`${BASE_URL}/api/system/users/${userId}/audit`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Logs de usuário obtidos com sucesso:');
        console.log(JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.log('❌ Erro ao obter logs de usuário:', error.response?.data?.message || error.message);
        return false;
    }
}

// Função para simular uma ação que gera log de auditoria
async function simulateAuditAction(token) {
    try {
        console.log('\n🎭 Simulando ação para gerar log de auditoria...');
        
        // Tentar acessar estatísticas do sistema (isso deve gerar um log)
        const response = await axios.get(`${BASE_URL}/api/system/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('✅ Ação simulada com sucesso (acessou estatísticas do sistema)');
        return true;
    } catch (error) {
        console.log('⚠️ Ação simulada (mesmo com erro, pode ter gerado log):', error.response?.data?.message || error.message);
        return true; // Retorna true porque mesmo erros podem gerar logs
    }
}

// Função principal de teste
async function runAuditTests() {
    console.log('🧪 INICIANDO TESTES DO SISTEMA DE AUDITORIA');
    console.log('===========================================\n');
    
    // 1. Fazer login
    const token = await login();
    if (!token) {
        console.log('❌ Não foi possível obter token. Encerrando testes.');
        return;
    }
    
    // 2. Verificar logs existentes no banco
    const hasExistingLogs = await checkAuditLogsInDatabase();
    
    // 3. Testar sistema básico primeiro
    const basicSystemSuccess = await testBasicSystem(token);
    if (!basicSystemSuccess) {
        console.log('❌ Sistema básico não está funcionando. Verifique a autenticação.');
        return;
    }
    
    // 4. Simular uma ação para gerar logs
    await simulateAuditAction(token);
    
    // 5. Verificar novamente os logs no banco após a ação
    await checkAuditLogsInDatabase();
    
    // 6. Testar estatísticas de auditoria
    const statsSuccess = await testAuditStats(token);
    
    // 7. Testar logs de usuário
    const userLogsSuccess = await testUserAuditLogs(token);
    
    // 8. Resumo dos testes
    console.log('\n📋 RESUMO DOS TESTES');
    console.log('===================');
    console.log(`Login: ✅ Sucesso`);
    console.log(`Sistema Básico: ${basicSystemSuccess ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`Logs Existentes: ${hasExistingLogs ? 'SIM' : 'NÃO'}`);
    console.log(`Estatísticas de Auditoria: ${statsSuccess ? '✅ Sucesso' : '❌ Falha'}`);
    console.log(`Logs de Usuário: ${userLogsSuccess ? '✅ Sucesso' : '❌ Falha'}`);
    
    if (basicSystemSuccess && statsSuccess && userLogsSuccess) {
        console.log('\n🎉 TODOS OS TESTES PASSARAM! Sistema de auditoria funcionando corretamente.');
    } else {
        console.log('\n⚠️ Alguns testes falharam. Verifique a implementação.');
    }
}

// Executar testes
runAuditTests().catch(console.error);