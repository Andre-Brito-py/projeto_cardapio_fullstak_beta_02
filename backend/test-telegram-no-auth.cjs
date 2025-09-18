const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Rota de teste do Telegram sem autenticação
app.post('/api/test-telegram-no-auth', async (req, res) => {
    try {
        console.log('📨 Requisição recebida:', req.body);
        
        const { telegramBotToken, telegramAdminChatId } = req.body;
        
        if (!telegramBotToken) {
            console.log('❌ Token não fornecido');
            return res.status(400).json({
                success: false,
                message: 'Token do bot é obrigatório'
            });
        }
        
        console.log('🔍 Testando token:', telegramBotToken.substring(0, 10) + '...');
        
        // Testar a API obtendo informações do bot
        const botInfoResponse = await fetch(
            `https://api.telegram.org/bot${telegramBotToken}/getMe`
        );
        
        const botInfoData = await botInfoResponse.json();
        console.log('🤖 Resposta da API do Telegram:', botInfoData);
        
        if (!botInfoData.ok) {
            return res.status(400).json({
                success: false,
                message: 'Token do bot inválido',
                error: botInfoData.description
            });
        }
        
        // Se um chat ID de admin foi fornecido, testar envio de mensagem
        let testMessageResult = null;
        if (telegramAdminChatId) {
            try {
                console.log('📤 Enviando mensagem de teste para:', telegramAdminChatId);
                const testMessageResponse = await fetch(
                    `https://api.telegram.org/bot${telegramBotToken}/sendMessage`,
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            chat_id: telegramAdminChatId,
                            text: '🤖 Teste de conexão do Bot Liza realizado com sucesso!'
                        })
                    }
                );
                
                const testMessageData = await testMessageResponse.json();
                console.log('📨 Resultado do envio:', testMessageData);
                testMessageResult = {
                    success: testMessageData.ok,
                    message: testMessageData.ok ? 'Mensagem de teste enviada' : 'Erro ao enviar mensagem de teste'
                };
            } catch (error) {
                console.log('❌ Erro ao enviar mensagem:', error);
                testMessageResult = {
                    success: false,
                    message: 'Erro ao testar envio de mensagem'
                };
            }
        }
        
        const response = {
            success: true,
            message: 'Telegram Bot API configurado corretamente!',
            details: {
                botInfo: {
                    id: botInfoData.result.id,
                    username: botInfoData.result.username,
                    firstName: botInfoData.result.first_name,
                    canJoinGroups: botInfoData.result.can_join_groups,
                    canReadAllGroupMessages: botInfoData.result.can_read_all_group_messages,
                    supportsInlineQueries: botInfoData.result.supports_inline_queries
                },
                testMessage: testMessageResult
            }
        };
        
        console.log('✅ Resposta enviada:', response);
        res.json(response);
        
    } catch (error) {
        console.error('❌ Erro ao testar Telegram API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar Telegram Bot API',
            error: error.message
        });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de teste rodando na porta ${PORT}`);
    console.log(`📡 Teste via: POST http://localhost:${PORT}/api/test-telegram-no-auth`);
    console.log(`📝 Envie: {"telegramBotToken": "SEU_TOKEN", "telegramAdminChatId": "SEU_CHAT_ID"}`);
});