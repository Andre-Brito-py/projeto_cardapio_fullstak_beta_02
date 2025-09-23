import express from 'express';
import https from 'https';
import http from 'http';

const router = express.Router();

/**
 * Classe para validação direta do Telegram
 */
class DirectTelegramValidator {
    constructor() {
        this.baseUrl = 'https://api.telegram.org/bot';
    }

    /**
     * Faz uma requisição HTTP/HTTPS
     */
    makeRequest(url, options = {}) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;
            
            const requestOptions = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: options.method || 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'DirectTelegramValidator/1.0',
                    ...options.headers
                },
                timeout: 10000
            };

            const req = client.request(requestOptions, (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        resolve({
                            statusCode: res.statusCode,
                            data: jsonData,
                            headers: res.headers
                        });
                    } catch (error) {
                        resolve({
                            statusCode: res.statusCode,
                            data: data,
                            headers: res.headers,
                            parseError: error.message
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(error);
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.end();
        });
    }

    /**
     * Valida um token do Telegram
     */
    async validateToken(token) {
        try {
            const url = `${this.baseUrl}${token}/getMe`;
            const response = await this.makeRequest(url);
            
            if (response.statusCode === 200 && response.data.ok) {
                const botInfo = response.data.result;
                return {
                    success: true,
                    message: 'Token válido',
                    botInfo: {
                        id: botInfo.id,
                        isBot: botInfo.is_bot,
                        firstName: botInfo.first_name,
                        username: botInfo.username,
                        canJoinGroups: botInfo.can_join_groups,
                        canReadAllGroupMessages: botInfo.can_read_all_group_messages,
                        supportsInlineQueries: botInfo.supports_inline_queries
                    }
                };
            } else {
                return {
                    success: false,
                    message: `Erro da API: ${response.data.description || 'Erro desconhecido'}`,
                    statusCode: response.statusCode
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Erro de conexão: ${error.message}`,
                error: error.code || error.message
            };
        }
    }
}

// Instância do validador
const validator = new DirectTelegramValidator();

/**
 * Rota para testar token do Telegram diretamente
 */
router.post('/test-telegram-direct', async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({
                success: false,
                message: 'Token é obrigatório'
            });
        }

        console.log(`[DirectTelegram] Testando token: ${token.substring(0, 20)}...`);
        
        const result = await validator.validateToken(token);
        
        console.log(`[DirectTelegram] Resultado: ${result.success ? 'SUCESSO' : 'ERRO'} - ${result.message}`);
        
        return res.json(result);
        
    } catch (error) {
        console.error('[DirectTelegram] Erro inesperado:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

/**
 * Rota para obter configuração do bot (simulada)
 */
router.get('/bot-config-direct', async (req, res) => {
    try {
        console.log('[DirectTelegram] Obtendo configuração do bot...');
        
        // Configuração simulada com token real
        const config = {
            token: "8337588749:AAGxcGgyw3qpKEgvzwEUYeW0PWexJrFuMGI",
            webhookUrl: "https://seu-dominio.com/api/telegram/webhook",
            enabled: true
        };
        
        return res.json({
            success: true,
            data: config
        });
        
    } catch (error) {
        console.error('[DirectTelegram] Erro ao obter configuração:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao obter configuração do bot',
            error: error.message
        });
    }
});

/**
 * Rota para salvar configuração do bot (simulada)
 */
router.post('/bot-config-direct', async (req, res) => {
    try {
        const { token, webhookUrl, enabled } = req.body;
        
        console.log('[DirectTelegram] Salvando configuração do bot...');
        
        // Validar token se fornecido
        if (token) {
            const validation = await validator.validateToken(token);
            if (!validation.success) {
                return res.status(400).json({
                    success: false,
                    message: `Token inválido: ${validation.message}`
                });
            }
        }
        
        return res.json({
            success: true,
            message: 'Configuração salva com sucesso'
        });
        
    } catch (error) {
        console.error('[DirectTelegram] Erro ao salvar configuração:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao salvar configuração do bot',
            error: error.message
        });
    }
});

/**
 * Rota para listar lojas (simulada)
 */
router.get('/stores-direct', async (req, res) => {
    try {
        console.log('[DirectTelegram] Obtendo lista de lojas...');
        
        // Lista simulada de lojas
        const stores = [
            {
                id: 1,
                name: "Loja Centro",
                address: "Rua Principal, 123 - Centro",
                phone: "(11) 1234-5678",
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                name: "Loja Shopping",
                address: "Shopping Center, Loja 45",
                phone: "(11) 8765-4321",
                active: true,
                createdAt: new Date().toISOString()
            },
            {
                id: 3,
                name: "Loja Bairro",
                address: "Av. Secundária, 456 - Bairro",
                phone: "(11) 5555-5555",
                active: false,
                createdAt: new Date().toISOString()
            }
        ];
        
        return res.json({
            success: true,
            data: stores,
            total: stores.length
        });
        
    } catch (error) {
        console.error('[DirectTelegram] Erro ao obter lojas:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao obter lista de lojas',
            error: error.message
        });
    }
});

export default router;