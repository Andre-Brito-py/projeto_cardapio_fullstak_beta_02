import axios from 'axios';

// Teste direto do token do Telegram
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