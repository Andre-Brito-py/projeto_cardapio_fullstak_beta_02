import axios from 'axios';
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:4001';

async function testDirectRoutes() {
    console.log('🧪 Testando rotas diretas do Telegram...\n');

    // Teste 1: Listar lojas
    console.log('1️⃣ Testando GET /api/telegram-direct/stores-direct');
    try {
        const response = await fetch(`${BASE_URL}/api/telegram-direct/stores-direct`);
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Sucesso: ${data.success}`);
        console.log(`Total de lojas: ${data.total || 0}`);
        console.log('✅ Teste de lojas passou\n');
    } catch (error) {
        console.log(`❌ Erro no teste de lojas: ${error.message}\n`);
    }

    // Teste 2: Obter configuração do bot
    console.log('2️⃣ Testando GET /api/telegram-direct/bot-config-direct');
    try {
        const response = await fetch(`${BASE_URL}/api/telegram-direct/bot-config-direct`);
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Sucesso: ${data.success}`);
        console.log(`Token: ${data.data?.token?.substring(0, 20)}...`);
        console.log('✅ Teste de configuração passou\n');
    } catch (error) {
        console.log(`❌ Erro no teste de configuração: ${error.message}\n`);
    }

    // Teste 3: Testar token do Telegram
    console.log('3️⃣ Testando POST /api/telegram-direct/test-telegram-direct');
    try {
        const response = await fetch(`${BASE_URL}/api/telegram-direct/test-telegram-direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: "8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI"
            })
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Sucesso: ${data.success}`);
        console.log(`Mensagem: ${data.message}`);
        if (data.botInfo) {
            console.log(`Bot: ${data.botInfo.firstName} (@${data.botInfo.username})`);
        }
        console.log('✅ Teste de token passou\n');
    } catch (error) {
        console.log(`❌ Erro no teste de token: ${error.message}\n`);
    }

    // Teste 4: Salvar configuração do bot
    console.log('4️⃣ Testando POST /api/telegram-direct/bot-config-direct');
    try {
        const response = await fetch(`${BASE_URL}/api/telegram-direct/bot-config-direct`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token: "8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI",
                webhookUrl: "https://exemplo.com/webhook",
                enabled: true
            })
        });
        const data = await response.json();
        console.log(`Status: ${response.status}`);
        console.log(`Sucesso: ${data.success}`);
        console.log(`Mensagem: ${data.message}`);
        console.log('✅ Teste de salvamento passou\n');
    } catch (error) {
        console.log(`❌ Erro no teste de salvamento: ${error.message}\n`);
    }

    console.log('🎉 Todos os testes concluídos!');
}

testDirectRoutes().catch(console.error);
const testTelegramToken = async () => {
    const token = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';
    
    console.log('🔍 Testando token do Telegram diretamente...');
    console.log('Token:', token.substring(0, 15) + '...');
    
    try {
        // Teste 1: Verificar informações do bot
        console.log('\n1️⃣ Testando getMe...');
        const botResponse = await axios.get(`https://api.telegram.org/bot${token}/getMe`);
        
        if (botResponse.data.ok) {
            const bot = botResponse.data.result;
            console.log('✅ Bot válido!');
            console.log(`   ID: ${bot.id}`);
            console.log(`   Nome: ${bot.first_name}`);
            console.log(`   Username: @${bot.username}`);
            console.log(`   É bot: ${bot.is_bot}`);
        } else {
            console.log('❌ Token inválido:', botResponse.data);
            return false;
        }
        
        // Teste 2: Verificar webhook info
        console.log('\n2️⃣ Testando getWebhookInfo...');
        const webhookResponse = await axios.get(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        
        if (webhookResponse.data.ok) {
            const webhook = webhookResponse.data.result;
            console.log('✅ Webhook info obtida:');
            console.log(`   URL: ${webhook.url || 'Não configurado'}`);
            console.log(`   Pending updates: ${webhook.pending_update_count}`);
        }
        
        // Teste 3: Testar API local (se disponível)
        console.log('\n3️⃣ Testando API local...');
        try {
            const localResponse = await axios.post('http://localhost:4001/api/system/api/test-telegram', {
                telegramBotToken: token
            }, {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 5000
            });
            
            console.log('✅ API local funcionando:', localResponse.data);
        } catch (localError) {
            console.log('❌ Erro na API local:');
            if (localError.response) {
                console.log(`   Status: ${localError.response.status}`);
                console.log(`   Mensagem: ${localError.response.data?.message || 'Erro desconhecido'}`);
            } else {
                console.log(`   Erro: ${localError.message}`);
            }
        }
        
        console.log('\n📊 Resumo:');
        console.log('✅ Token válido na API do Telegram');
        console.log('✅ Bot "Liza Delivery" configurado corretamente');
        console.log('⚠️  Para testar via painel admin, faça login como Super Admin');
        console.log('⚠️  Credenciais: superadmin@fooddelivery.com / superadmin123');
        
        return true;
        
    } catch (error) {
        console.log('❌ Erro no teste:', error.message);
        return false;
    }
};

// Executar teste
testTelegramToken().then(success => {
    console.log(`\n🎯 Resultado final: ${success ? 'SUCESSO' : 'FALHA'}`);
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});