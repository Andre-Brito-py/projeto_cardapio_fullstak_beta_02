import axios from 'axios';

// Configurações
const BACKEND_URL = 'http://localhost:4000';
const TELEGRAM_BOT_TOKEN = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';

// Para desenvolvimento local, você pode usar:
// 1. ngrok: https://ngrok.com/
// 2. localtunnel: https://localtunnel.github.io/www/
// 3. serveo: https://serveo.net/

// Exemplo de webhook URL (substitua pela sua URL pública)
const WEBHOOK_URL = 'https://your-ngrok-url.ngrok.io/api/telegram/webhook';

async function configureWebhook() {
    try {
        console.log('🔗 Configurando webhook do Telegram...');
        console.log('\n📋 INSTRUÇÕES PARA CONFIGURAR WEBHOOK:');
        console.log('=====================================');
        console.log('\n1. 📦 Instale uma ferramenta de túnel (escolha uma):');
        console.log('   • ngrok: https://ngrok.com/download');
        console.log('   • localtunnel: npm install -g localtunnel');
        console.log('   • serveo: ssh -R 80:localhost:4000 serveo.net');
        
        console.log('\n2. 🚀 Execute o túnel para o backend (porta 4000):');
        console.log('   • ngrok: ngrok http 4000');
        console.log('   • localtunnel: lt --port 4000');
        console.log('   • serveo: ssh -R 80:localhost:4000 serveo.net');
        
        console.log('\n3. 📝 Copie a URL pública gerada (ex: https://abc123.ngrok.io)');
        
        console.log('\n4. 🔧 Configure a webhook no Telegram:');
        console.log('   Acesse: https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/setWebhook');
        console.log('   Parâmetros:');
        console.log('   • url: SUA_URL_PUBLICA/api/telegram/webhook');
        console.log('   • allowed_updates: ["message", "callback_query"]');
        
        console.log('\n5. ✅ Verifique a configuração:');
        console.log('   https://api.telegram.org/bot' + TELEGRAM_BOT_TOKEN + '/getWebhookInfo');
        
        console.log('\n🤖 TESTE DO BOT:');
        console.log('===============');
        console.log('1. Abra o Telegram e procure por: @' + await getBotUsername());
        console.log('2. Envie /start para o bot');
        console.log('3. Verifique se o bot responde');
        
        console.log('\n📱 CONFIGURAÇÃO NO PAINEL ADMIN:');
        console.log('=================================');
        console.log('1. Acesse: http://localhost:5174');
        console.log('2. Faça login como Super Admin');
        console.log('3. Vá em Configurações > Telegram');
        console.log('4. Configure:');
        console.log('   • Token: ' + TELEGRAM_BOT_TOKEN);
        console.log('   • Webhook URL: SUA_URL_PUBLICA/api/telegram/webhook');
        console.log('   • Admin Chat ID: (obtenha enviando /start para o bot)');
        
        console.log('\n🎉 Configuração concluída!');
        console.log('\n⚠️  IMPORTANTE:');
        console.log('• Mantenha o túnel ativo durante o desenvolvimento');
        console.log('• Para produção, use um domínio real com HTTPS');
        console.log('• Configure o Chat ID do admin para receber notificações');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

async function getBotUsername() {
    try {
        const response = await axios.get(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`);
        if (response.data.ok) {
            return response.data.result.username;
        }
    } catch (error) {
        return 'SEU_BOT_USERNAME';
    }
    return 'SEU_BOT_USERNAME';
}

// Executar configuração
configureWebhook();