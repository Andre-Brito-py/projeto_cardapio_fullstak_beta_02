import axios from 'axios';

// Configurações
const BACKEND_URL = 'http://localhost:4001';
const TELEGRAM_BOT_TOKEN = '8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI';

// Credenciais do super admin (corretas)
const SUPER_ADMIN_EMAIL = 'superadmin@admin.com';
const SUPER_ADMIN_PASSWORD = 'admin123';

async function configureTelegramViaAPI() {
    try {
        console.log('🔐 Fazendo login como super admin...');
        
        // 1. Fazer login para obter o token JWT
        const loginResponse = await axios.post(`${BACKEND_URL}/api/user/login`, {
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Falha no login: ' + loginResponse.data.message);
        }
        
        const authToken = loginResponse.data.token;
        console.log('✅ Login realizado com sucesso');
        
        // 2. Configurar headers de autenticação
        const headers = {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
        };
        
        // 3. Configurar o bot do Telegram via API
        console.log('\n📱 Configurando bot do Telegram...');
        
        const botConfigData = {
            token: TELEGRAM_BOT_TOKEN,
            webhookUrl: '', // Será configurado depois
            adminChatId: '', // Será configurado depois
            isActive: true
        };
        
        const configResponse = await axios.post(
            `${BACKEND_URL}/api/telegram/bot-config`,
            botConfigData,
            { headers }
        );
        
        if (configResponse.data.success) {
            console.log('✅ Configuração do bot salva com sucesso!');
        } else {
            console.log('❌ Erro ao salvar configuração:', configResponse.data.message);
        }
        
        // 4. Testar a conexão do bot
        console.log('\n🧪 Testando conexão com o bot...');
        
        const testResponse = await axios.post(
            `${BACKEND_URL}/api/telegram/test-bot`,
            { token: TELEGRAM_BOT_TOKEN },
            { headers }
        );
        
        if (testResponse.data.success) {
            const botInfo = testResponse.data.botInfo;
            console.log('✅ Bot conectado com sucesso!');
            console.log(`   Nome: ${botInfo.first_name}`);
            console.log(`   Username: @${botInfo.username}`);
            console.log(`   ID: ${botInfo.id}`);
        } else {
            console.log('❌ Erro ao testar bot:', testResponse.data.message);
        }
        
        // 5. Verificar status das APIs
        console.log('\n📊 Verificando status das APIs...');
        
        try {
            const statusResponse = await axios.get(
                `${BACKEND_URL}/api/system/api-status`,
                { headers }
            );
            
            if (statusResponse.data.success) {
                const telegramStatus = statusResponse.data.status.telegram;
                console.log('📱 Status do Telegram:');
                console.log(`   Configurado: ${telegramStatus.configured ? '✅' : '❌'}`);
                console.log(`   Habilitado: ${telegramStatus.enabled ? '✅' : '❌'}`);
                console.log(`   Token: ${telegramStatus.botTokenConfigured ? '✅' : '❌'}`);
                console.log(`   Webhook: ${telegramStatus.webhookConfigured ? '✅' : '❌'}`);
                console.log(`   Admin Chat: ${telegramStatus.adminChatConfigured ? '✅' : '❌'}`);
            }
        } catch (error) {
            console.log('⚠️  Não foi possível verificar o status das APIs');
        }
        
        console.log('\n🎉 Configuração do Telegram concluída!');
        console.log('\n📋 Próximos passos:');
        console.log('   1. Configure a webhook URL (use ngrok para desenvolvimento local)');
        console.log('   2. Configure o Chat ID do admin');
        console.log('   3. Teste a integração completa com a Liza');
        
    } catch (error) {
        console.error('❌ Erro durante a configuração:', error.message);
        if (error.response) {
            console.error('   Resposta do servidor:', error.response.data);
        }
    }
}

// Executar a configuração
configureTelegramViaAPI();