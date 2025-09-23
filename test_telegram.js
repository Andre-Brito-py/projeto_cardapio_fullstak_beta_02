import TelegramValidator from './telegram_validator.js';

async function testTelegram() {
    const token = "8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI";
    const validator = new TelegramValidator();
    
    console.log(`🔍 Validando token: ${token.substring(0, 20)}...`);
    const result = await validator.validateToken(token);
    
    console.log(`\n📊 Resultado da validação:`);
    console.log(`Status: ${result.success ? '✅ SUCESSO' : '❌ ERRO'}`);
    console.log(`Mensagem: ${result.message}`);
    
    if (result.success && result.botInfo) {
        const botInfo = result.botInfo;
        console.log(`\n🤖 Informações do Bot:`);
        console.log(`ID: ${botInfo.id}`);
        console.log(`Nome: ${botInfo.firstName}`);
        console.log(`Username: @${botInfo.username}`);
        console.log(`É Bot: ${botInfo.isBot}`);
        console.log(`Pode entrar em grupos: ${botInfo.canJoinGroups}`);
        console.log(`Pode ler mensagens de grupo: ${botInfo.canReadAllGroupMessages}`);
        console.log(`Suporte a consultas inline: ${botInfo.supportsInlineQueries}`);
    }
    
    if (result.error) {
        console.log(`\n🔍 Detalhes do erro: ${result.error}`);
    }
    
    return result;
}

testTelegram().catch(console.error);