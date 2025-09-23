#!/usr/bin/env node
/**
 * Validador de Token do Telegram - Solução Alternativa
 * Este script valida tokens do Telegram diretamente com a API oficial
 */

import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class TelegramValidator {
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
                    'User-Agent': 'TelegramValidator/1.0',
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
     * Valida um token do Telegram fazendo uma requisição para getMe
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

    /**
     * Testa o envio de uma mensagem usando o token
     */
    async testSendMessage(token, chatId, message) {
        try {
            const url = `${this.baseUrl}${token}/sendMessage`;
            const response = await this.makeRequest(url, {
                method: 'POST',
                body: {
                    chat_id: chatId,
                    text: message
                }
            });
            
            if (response.statusCode === 200 && response.data.ok) {
                return {
                    success: true,
                    message: 'Mensagem enviada com sucesso',
                    messageId: response.data.result.message_id
                };
            } else {
                return {
                    success: false,
                    message: `Erro ao enviar mensagem: ${response.data.description || 'Erro desconhecido'}`,
                    statusCode: response.statusCode
                };
            }
        } catch (error) {
            return {
                success: false,
                message: `Erro ao enviar mensagem: ${error.message}`,
                error: error.code || error.message
            };
        }
    }
}

/**
 * Função principal para uso via linha de comando
 */
async function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 1) {
        console.log('Uso: node telegram_validator.js <token> [chat_id] [mensagem]');
        process.exit(1);
    }
    
    const token = args[0];
    const chatId = args[1];
    const message = args[2] || `🧪 Teste de conexão - ${new Date().toLocaleString('pt-BR')}`;
    
    const validator = new TelegramValidator();
    
    // Validar token
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
        
        // Teste de envio de mensagem se chat_id foi fornecido
        if (chatId) {
            console.log(`\n📤 Testando envio de mensagem para chat ${chatId}...`);
            const sendResult = await validator.testSendMessage(token, chatId, message);
            console.log(`Status: ${sendResult.success ? '✅ SUCESSO' : '❌ ERRO'}`);
            console.log(`Mensagem: ${sendResult.message}`);
        }
    }
    
    // Retornar código de saída apropriado
    process.exit(result.success ? 0 : 1);
}

// Executar se chamado diretamente
const isMainModule = import.meta.url.startsWith('file:') && 
                     process.argv[1] && 
                     import.meta.url.includes(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
    main().catch(error => {
        console.error('❌ Erro inesperado:', error.message);
        process.exit(1);
    });
}

export default TelegramValidator;