/**
 * Serviço de Integração com IA Liza
 * 
 * Este serviço gerencia a comunicação entre o backend Node.js e o sistema
 * Python da IA Liza, permitindo processamento de mensagens, análise de
 * intenções e automação de atendimento.
 * 
 * Autor: Sistema IA Liza
 * Data: Janeiro 2025
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import EventEmitter from 'events';
import logger from '../utils/logger.js';
import dailyReportScheduler from './dailyReportScheduler.js';

class LizaIntegrationService extends EventEmitter {
    constructor() {
        super();
        this.pythonProcess = null;
        this.isInitialized = false;
        this.messageQueue = [];
        this.processingQueue = false;
        this.config = {
            pythonPath: 'python',
            scriptPath: path.join(process.cwd(), 'ai-assistant'),
            timeout: 30000,
            maxRetries: 3
        };
    }

    /**
     * Inicializar o serviço da IA Liza
     */
    async initialize() {
        try {
            logger.info('Inicializando serviço de integração IA Liza...');
            
            // Verificar se o diretório da IA existe
            await this.validatePythonEnvironment();
            
            // Inicializar processo Python se necessário
            await this.startPythonService();
            
            this.isInitialized = true;
            logger.info('Serviço IA Liza inicializado com sucesso');
            
            return true;
        } catch (error) {
            logger.error('Erro ao inicializar IA Liza:', error);
            return false;
        }
    }

    /**
     * Validar ambiente Python e dependências
     */
    async validatePythonEnvironment() {
        const aiAssistantPath = path.join(process.cwd(), 'ai-assistant');
        
        try {
            // Verificar se o diretório existe
            await fs.access(aiAssistantPath);
            
            // Verificar arquivos essenciais
            const requiredFiles = [
                'delivery_training/intent_classification.py',
                'delivery_training/api_integration.py',
                'whatsapp_integration/message_processor.py'
            ];
            
            for (const file of requiredFiles) {
                const filePath = path.join(aiAssistantPath, file);
                await fs.access(filePath);
            }
            
            logger.info('Ambiente Python validado com sucesso');
        } catch (error) {
            throw new Error(`Ambiente Python inválido: ${error.message}`);
        }
    }

    /**
     * Iniciar serviço Python (se necessário)
     */
    async startPythonService() {
        // Por enquanto, vamos usar chamadas diretas ao Python
        // Em produção, pode ser um serviço persistente
        logger.info('Serviço Python configurado para chamadas diretas');
    }

    /**
     * Processar mensagem através da IA Liza
     */
    async processMessage(messageData) {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }

            const { message, from, storeId, messageType = 'text' } = messageData;
            
            logger.info(`Processando mensagem via IA Liza:`, {
                from,
                storeId,
                messageType,
                messageLength: message?.length || 0
            });

            // Classificar intenção da mensagem
            const intent = await this.classifyIntent(message, storeId);
            
            // Processar baseado na intenção
            const response = await this.generateResponse({
                message,
                intent,
                from,
                storeId,
                messageType
            });

            return {
                success: true,
                intent: intent.intent,
                confidence: intent.confidence,
                response: response.text,
                actions: response.actions || [],
                metadata: {
                    processedAt: new Date().toISOString(),
                    processingTime: response.processingTime
                }
            };

        } catch (error) {
            logger.error('Erro ao processar mensagem na IA Liza:', error);
            return {
                success: false,
                error: error.message,
                fallbackResponse: this.getFallbackResponse(messageData)
            };
        }
    }

    /**
     * Classificar intenção da mensagem
     */
    async classifyIntent(message, storeId) {
        try {
            const result = await this.executePythonScript('classify_intent.py', {
                message,
                storeId
            });

            return {
                intent: result.intent || 'unknown',
                confidence: result.confidence || 0.5,
                entities: result.entities || []
            };
        } catch (error) {
            logger.error('Erro na classificação de intenção:', error);
            return {
                intent: 'unknown',
                confidence: 0.0,
                entities: []
            };
        }
    }

    /**
     * Gerar resposta baseada na intenção
     */
    async generateResponse(data) {
        const startTime = Date.now();
        
        try {
            const { intent, message, from, storeId } = data;
            
            // Verificar comandos especiais primeiro
            const specialResponse = await this.handleSpecialCommands(data);
            if (specialResponse) {
                return specialResponse;
            }

            // Diferentes estratégias baseadas na intenção
            switch (intent.intent) {
                case 'greeting':
                    return await this.handleGreeting(data);
                
                case 'menu_inquiry':
                    return await this.handleMenuInquiry(data);
                
                case 'order_intent':
                    return await this.handleOrderIntent(data);
                
                case 'order_status':
                    return await this.handleOrderStatus(data);
                
                case 'complaint':
                    return await this.handleComplaint(data);
                
                case 'goodbye':
                    return await this.handleGoodbye(data);
                
                default:
                    return await this.handleUnknownIntent(data);
            }
        } catch (error) {
            logger.error('Erro na geração de resposta:', error);
            return {
                text: 'Desculpe, ocorreu um erro. Pode repetir sua mensagem?',
                actions: [],
                processingTime: Date.now() - startTime
            };
        }
    }

    /**
     * Lidar com saudações
     */
    async handleGreeting(data) {
        const { storeId } = data;
        
        try {
            // Buscar informações da loja
            const storeInfo = await this.getStoreInfo(storeId);
            const storeName = storeInfo?.name || 'nossa loja';
            
            return {
                text: `Olá! Bem-vindo(a) ao ${storeName}! 🍕\n\nEu sou a Liza, sua assistente virtual. Posso te ajudar com:\n\n🍽️ Ver nosso cardápio\n📦 Fazer pedidos\n📍 Informações de entrega\n❓ Tirar dúvidas\n\nComo posso te ajudar hoje?`,
                actions: [
                    {
                        type: 'quick_reply',
                        options: ['Ver cardápio', 'Fazer pedido', 'Meus pedidos']
                    }
                ],
                processingTime: Date.now() - Date.now()
            };
        } catch (error) {
            return {
                text: 'Olá! Como posso te ajudar hoje? 😊',
                actions: [],
                processingTime: Date.now() - Date.now()
            };
        }
    }

    /**
     * Lidar com consultas ao cardápio
     */
    async handleMenuInquiry(data) {
        const { storeId, message } = data;
        
        try {
            // Buscar cardápio da loja
            const menu = await this.getStoreMenu(storeId);
            
            if (!menu || menu.categories.length === 0) {
                return {
                    text: 'Desculpe, não consegui carregar o cardápio no momento. Tente novamente em alguns instantes.',
                    actions: []
                };
            }

            // Se a mensagem contém uma categoria específica, filtrar
            const categoryKeywords = this.extractCategoryKeywords(message);
            let response = 'Aqui está nosso cardápio:\n\n';
            
            if (categoryKeywords.length > 0) {
                // Mostrar categoria específica
                const matchedCategories = menu.categories.filter(cat => 
                    categoryKeywords.some(keyword => 
                        cat.name.toLowerCase().includes(keyword.toLowerCase())
                    )
                );
                
                if (matchedCategories.length > 0) {
                    for (const category of matchedCategories) {
                        response += `🍽️ **${category.name}**\n`;
                        for (const product of category.products.slice(0, 5)) {
                            response += `• ${product.name} - R$ ${product.price.toFixed(2)}\n`;
                        }
                        response += '\n';
                    }
                } else {
                    response = 'Não encontrei essa categoria. Veja nossas opções:\n\n';
                    response += menu.categories.map(cat => `🍽️ ${cat.name}`).join('\n');
                }
            } else {
                // Mostrar resumo das categorias
                response += menu.categories.map(cat => 
                    `🍽️ **${cat.name}** (${cat.products.length} itens)`
                ).join('\n');
                response += '\n\nQual categoria te interessa?';
            }

            return {
                text: response,
                actions: [
                    {
                        type: 'quick_reply',
                        options: menu.categories.slice(0, 3).map(cat => cat.name)
                    }
                ]
            };
        } catch (error) {
            logger.error('Erro ao buscar cardápio:', error);
            return {
                text: 'Desculpe, não consegui carregar o cardápio. Pode tentar novamente?',
                actions: []
            };
        }
    }

    /**
     * Lidar com intenção de pedido
     */
    async handleOrderIntent(data) {
        const { message, from, storeId } = data;
        
        try {
            // Extrair produtos mencionados na mensagem
            const extractedProducts = await this.extractProductsFromMessage(message, storeId);
            
            if (extractedProducts.length === 0) {
                return {
                    text: 'Não consegui identificar produtos específicos na sua mensagem. Que tal ver nosso cardápio primeiro?',
                    actions: [
                        {
                            type: 'quick_reply',
                            options: ['Ver cardápio', 'Produtos populares']
                        }
                    ]
                };
            }

            let response = 'Encontrei estes produtos:\n\n';
            for (const product of extractedProducts) {
                response += `🍽️ ${product.name} - R$ ${product.price.toFixed(2)}\n`;
            }
            response += '\nGostaria de adicionar algum ao seu pedido?';

            return {
                text: response,
                actions: [
                    {
                        type: 'product_selection',
                        products: extractedProducts
                    }
                ]
            };
        } catch (error) {
            return {
                text: 'Vamos começar seu pedido! Que tal ver nosso cardápio?',
                actions: [
                    {
                        type: 'quick_reply',
                        options: ['Ver cardápio']
                    }
                ]
            };
        }
    }

    /**
     * Lidar com status de pedido
     */
    async handleOrderStatus(data) {
        const { from } = data;
        
        try {
            // Buscar pedidos recentes do cliente
            const customerOrders = await this.getCustomerOrders(from);
            
            if (!customerOrders || customerOrders.length === 0) {
                return {
                    text: 'Não encontrei pedidos recentes para este número. Gostaria de fazer um novo pedido?',
                    actions: [
                        {
                            type: 'quick_reply',
                            options: ['Fazer pedido', 'Ver cardápio']
                        }
                    ]
                };
            }

            const lastOrder = customerOrders[0];
            const statusText = this.getOrderStatusText(lastOrder.status);
            
            let response = `📦 **Seu último pedido:**\n\n`;
            response += `Pedido #${lastOrder.orderNumber}\n`;
            response += `Status: ${statusText}\n`;
            
            if (lastOrder.estimatedDeliveryTime) {
                response += `Previsão: ${lastOrder.estimatedDeliveryTime} minutos\n`;
            }
            
            response += `Total: R$ ${lastOrder.total.toFixed(2)}`;

            return {
                text: response,
                actions: [
                    {
                        type: 'order_tracking',
                        orderId: lastOrder._id
                    }
                ]
            };
        } catch (error) {
            return {
                text: 'Não consegui verificar seus pedidos no momento. Tente novamente em alguns instantes.',
                actions: []
            };
        }
    }

    /**
     * Lidar com reclamações
     */
    async handleComplaint(data) {
        const { message, from, storeId } = data;
        
        // Registrar reclamação para análise
        this.logComplaint({
            message,
            from,
            storeId,
            timestamp: new Date().toISOString()
        });

        return {
            text: 'Lamento muito pelo inconveniente! 😔\n\nSua reclamação foi registrada e nossa equipe será notificada imediatamente.\n\nPodemos resolver isso agora? Se preferir, um atendente humano pode entrar em contato.',
            actions: [
                {
                    type: 'escalate_to_human',
                    priority: 'high',
                    reason: 'complaint'
                }
            ]
        };
    }

    /**
     * Lidar com despedidas
     */
    async handleGoodbye(data) {
        return {
            text: 'Obrigada por entrar em contato! 😊\n\nFoi um prazer te atender. Volte sempre que precisar!\n\nTenha um ótimo dia! 🌟',
            actions: []
        };
    }

    /**
     * Lidar com intenções desconhecidas
     */
    async handleUnknownIntent(data) {
        return {
            text: 'Desculpe, não entendi muito bem. 🤔\n\nPosso te ajudar com:\n\n🍽️ Ver cardápio\n📦 Fazer pedidos\n📍 Status de entrega\n❓ Outras dúvidas\n\nO que você gostaria?',
            actions: [
                {
                    type: 'quick_reply',
                    options: ['Ver cardápio', 'Fazer pedido', 'Meus pedidos', 'Falar com atendente']
                }
            ]
        };
    }

    /**
     * Processar comandos especiais (relatórios, etc.)
     */
    async handleSpecialCommands(data) {
        const { message } = data;
        const text = message.toLowerCase();
        
        // Comandos de relatório
        if (text.includes('resumo de hoje') || text.includes('relatório diário') || text.includes('relatório de hoje')) {
            try {
                const report = await dailyReportScheduler.generateDailyReport();
                const formattedMessage = dailyReportScheduler.formatReportMessage(report);
                
                return {
                    text: formattedMessage,
                    actions: [],
                    processingTime: Date.now() - Date.now()
                };
            } catch (error) {
                return {
                    text: "Desculpe, não consegui gerar o relatório no momento. Tente novamente mais tarde.",
                    actions: [],
                    processingTime: Date.now() - Date.now()
                };
            }
        }
        
        // Comando para agendar relatório
        if (text.includes('agendar relatório') || text.includes('configurar relatório')) {
            const timeMatch = text.match(/(\d{1,2}):(\d{2})/);
            const time = timeMatch ? `${timeMatch[1]}:${timeMatch[2]}` : '18:00';
            
            const result = dailyReportScheduler.scheduleDailyReport(time);
            
            return {
                text: result.success 
                    ? `✅ Relatório diário agendado para ${time}. Você receberá um resumo automático todos os dias neste horário.`
                    : `❌ Erro ao agendar relatório: ${result.error}`,
                actions: [],
                processingTime: Date.now() - Date.now()
            };
        }
        
        // Status do agendamento
        if (text.includes('status do relatório') || text.includes('quando é o relatório')) {
            const status = dailyReportScheduler.getScheduleStatus();
            
            const statusText = status.isScheduled 
                ? `📅 Relatório diário está agendado para ${status.scheduledTime}\nPróxima execução: ${new Date(status.nextExecution).toLocaleString('pt-BR')}`
                : `❌ Nenhum relatório agendado. Digite "agendar relatório às 18:00" para configurar.`;
            
            return {
                text: statusText,
                actions: [],
                processingTime: Date.now() - Date.now()
            };
        }
        
        // Comandos de ajuda
        if (text.includes('ajuda') || text.includes('comandos') || text.includes('help')) {
            return {
                text: `🤖 **Comandos da Liza:**\n\n` +
                      `📊 **Relatórios:**\n` +
                      `• "Resumo de hoje" - Relatório completo do dia\n` +
                      `• "Agendar relatório às 18:00" - Configurar envio automático\n` +
                      `• "Status do relatório" - Ver configuração atual\n\n` +
                      `💬 **Conversação:**\n` +
                      `• "Olá" - Saudação\n` +
                      `• "Cardápio" - Ver produtos disponíveis\n` +
                      `• "Pedidos" - Status dos pedidos\n\n` +
                      `💡 **Dica:** Você pode conversar naturalmente comigo!`,
                actions: [],
                processingTime: Date.now() - Date.now()
            };
        }
        
        return null; // Não é um comando especial
    }

    /**
     * Executar script Python
     */
    async executePythonScript(scriptName, data) {
        return new Promise((resolve, reject) => {
            const scriptPath = path.join(this.config.scriptPath, 'delivery_training', scriptName);
            const pythonProcess = spawn(this.config.pythonPath, [scriptPath], {
                stdio: ['pipe', 'pipe', 'pipe']
            });

            let output = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                output += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code === 0) {
                    try {
                        const result = JSON.parse(output);
                        resolve(result);
                    } catch (parseError) {
                        reject(new Error(`Erro ao parsear saída Python: ${parseError.message}`));
                    }
                } else {
                    reject(new Error(`Script Python falhou: ${error}`));
                }
            });

            // Enviar dados para o script
            pythonProcess.stdin.write(JSON.stringify(data));
            pythonProcess.stdin.end();

            // Timeout
            setTimeout(() => {
                pythonProcess.kill();
                reject(new Error('Timeout na execução do script Python'));
            }, this.config.timeout);
        });
    }

    /**
     * Métodos auxiliares
     */
    
    async getStoreInfo(storeId) {
        // Implementar busca de informações da loja
        // Por enquanto, retornar dados mock
        return {
            _id: storeId,
            name: 'Restaurante Exemplo',
            description: 'Deliciosa comida caseira'
        };
    }

    async getStoreMenu(storeId) {
        // Implementar busca do cardápio
        // Integrar com a API existente
        return {
            categories: [
                {
                    name: 'Pizzas',
                    products: [
                        { name: 'Pizza Margherita', price: 25.90 },
                        { name: 'Pizza Calabresa', price: 28.90 }
                    ]
                }
            ]
        };
    }

    async getCustomerOrders(phone) {
        // Implementar busca de pedidos do cliente
        return [];
    }

    async extractProductsFromMessage(message, storeId) {
        // Implementar extração de produtos da mensagem
        return [];
    }

    extractCategoryKeywords(message) {
        const keywords = ['pizza', 'hamburguer', 'bebida', 'sobremesa', 'lanche'];
        return keywords.filter(keyword => 
            message.toLowerCase().includes(keyword)
        );
    }

    getOrderStatusText(status) {
        const statusMap = {
            'pending': '⏳ Aguardando confirmação',
            'confirmed': '✅ Confirmado',
            'preparing': '👨‍🍳 Preparando',
            'ready': '🎉 Pronto',
            'out_for_delivery': '🚚 Saiu para entrega',
            'delivered': '✅ Entregue',
            'cancelled': '❌ Cancelado'
        };
        return statusMap[status] || status;
    }

    logComplaint(complaintData) {
        logger.warn('Reclamação registrada:', complaintData);
        // Implementar sistema de notificação para equipe
    }

    getFallbackResponse(messageData) {
        return 'Desculpe, estou com dificuldades técnicas no momento. Um atendente humano pode te ajudar?';
    }

    /**
     * Limpar recursos
     */
    async cleanup() {
        if (this.pythonProcess) {
            this.pythonProcess.kill();
            this.pythonProcess = null;
        }
        this.isInitialized = false;
        logger.info('Serviço IA Liza finalizado');
    }
}

// Instância singleton
const lizaService = new LizaIntegrationService();

export default lizaService;
export { LizaIntegrationService };