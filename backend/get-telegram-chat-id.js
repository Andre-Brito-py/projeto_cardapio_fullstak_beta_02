import fetch from 'node-fetch';

const BOT_TOKEN = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';

async function getTelegramUpdates() {
    try {
        console.log('🔍 Buscando atualizações do Telegram...\n');
        
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getUpdates`);
        const data = await response.json();
        
        if (!data.ok) {
            console.error('❌ Erro ao buscar atualizações:', data.description);
            return;
        }
        
        if (data.result.length === 0) {
            console.log('📝 INSTRUÇÕES PARA OBTER SEU CHAT ID:');
            console.log('1. Abra o Telegram');
            console.log('2. Procure pelo bot: @LizaDelivetybot');
            console.log('3. Envie a mensagem: /start');
            console.log('4. Execute este script novamente');
            console.log('\n⚠️  Nenhuma mensagem encontrada ainda.');
            return;
        }
        
        console.log('✅ Mensagens encontradas!\n');
        
        // Extrair Chat IDs únicos
        const chatIds = new Set();
        const userInfo = new Map();
        
        data.result.forEach(update => {
            if (update.message) {
                const chat = update.message.chat;
                const from = update.message.from;
                
                chatIds.add(chat.id);
                userInfo.set(chat.id, {
                    firstName: from.first_name,
                    lastName: from.last_name || '',
                    username: from.username || 'sem username',
                    chatType: chat.type,
                    text: update.message.text || 'sem texto'
                });
            }
        });
        
        console.log('👥 CHAT IDs ENCONTRADOS:');
        console.log('=' .repeat(50));
        
        chatIds.forEach(chatId => {
            const info = userInfo.get(chatId);
            console.log(`📱 Chat ID: ${chatId}`);
            console.log(`👤 Nome: ${info.firstName} ${info.lastName}`.trim());
            console.log(`🏷️  Username: @${info.username}`);
            console.log(`💬 Tipo: ${info.chatType}`);
            console.log(`📝 Última mensagem: "${info.text}"`);
            console.log('-'.repeat(30));
        });
        
        console.log('\n🎯 COMO USAR:');
        console.log('1. Copie o Chat ID da pessoa que será o administrador');
        console.log('2. Cole no campo "CHAT ID DO ADMIN" no painel');
        console.log('3. Teste novamente a configuração');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
    }
}

getTelegramUpdates();