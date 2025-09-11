import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import axios from 'axios';
import SystemSettings from '../models/systemSettingsModel.js';
import Store from '../models/storeModel.js';
import Food from '../models/foodModel.js';
import Category from '../models/categoryModel.js';

class LisaService {
    constructor() {
        this.lisaProcess = null;
        this.isRunning = false;
        this.settings = null;
    }

    /**
     * Inicializar o serviço da Lisa
     */
    async initialize() {
        try {
            this.settings = await SystemSettings.getInstance();
            
            if (!this.settings.lisaEnabled) {
                console.log('Lisa AI Assistant está desabilitada');
                return false;
            }

            if (!this.settings.lisaOpenAiApiKey && !this.settings.lisaGroqApiKey) {
                console.log('Nenhuma chave de API configurada para a Lisa');
                return false;
            }

            await this.createEnvFile();
            console.log('Lisa AI Assistant inicializada com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao inicializar Lisa Service:', error);
            return false;
        }
    }

    /**
     * Criar arquivo .env para a Lisa
     */
    async createEnvFile() {
        const lisaPath = path.join(process.cwd(), '..', 'ai-assistant');
        const envPath = path.join(lisaPath, '.env');

        let envContent = `# Configurações da Lisa AI Assistant\n`;
        envContent += `# Gerado automaticamente pelo sistema\n\n`;

        // OpenAI
        if (this.settings.lisaOpenAiApiKey) {
            envContent += `OPENAI_API_KEY=${this.settings.lisaOpenAiApiKey}\n`;
        }

        // Groq
        if (this.settings.lisaGroqApiKey) {
            envContent += `GROQ_API_KEY=${this.settings.lisaGroqApiKey}\n`;
        }

        // Chainlit
        if (this.settings.lisaChainlitSecret) {
            envContent += `CHAINLIT_AUTH_SECRET=${this.settings.lisaChainlitSecret}\n`;
        }

        // Literal AI
        if (this.settings.lisaLiteralApiKey) {
            envContent += `LITERAL_API_KEY=${this.settings.lisaLiteralApiKey}\n`;
        }



        // Configurações gerais
        envContent += `CHAINLIT_PORT=${this.settings.lisaPort}\n`;
        envContent += `MAX_FILE_SIZE_MB=${this.settings.lisaMaxFileSize}\n`;
        envContent += `ENABLE_AUDIO=true\n`;
        envContent += `ENABLE_IMAGE=true\n`;
        envContent += `VECTOR_DB_PATH=./chroma_db\n`;

        try {
            // Criar diretório se não existir
            if (!fs.existsSync(lisaPath)) {
                fs.mkdirSync(lisaPath, { recursive: true });
            }

            fs.writeFileSync(envPath, envContent);
            console.log('Arquivo .env da Lisa criado/atualizado com sucesso');
        } catch (error) {
            console.error('Erro ao criar arquivo .env da Lisa:', error);
            throw error;
        }
    }

    /**
     * Iniciar o servidor da Lisa
     */
    async startLisa() {
        if (this.isRunning) {
            console.log('Lisa já está rodando');
            return { success: true, message: 'Lisa já está rodando' };
        }

        try {
            const lisaPath = path.join(process.cwd(), '..', 'ai-assistant');
            
            // Verificar se o diretório existe
            if (!fs.existsSync(lisaPath)) {
                throw new Error('Diretório da Lisa não encontrado');
            }

            // Iniciar o processo da Lisa
            this.lisaProcess = spawn('python', ['-m', 'chainlit', 'run', 'app.py', '--port', this.settings.lisaPort], {
                cwd: lisaPath,
                stdio: ['pipe', 'pipe', 'pipe'],
                shell: true
            });

            this.isRunning = true;

            // Handlers para o processo
            this.lisaProcess.stdout.on('data', (data) => {
                console.log(`Lisa stdout: ${data}`);
            });

            this.lisaProcess.stderr.on('data', (data) => {
                console.error(`Lisa stderr: ${data}`);
            });

            this.lisaProcess.on('close', (code) => {
                console.log(`Lisa process exited with code ${code}`);
                this.isRunning = false;
                this.lisaProcess = null;
            });

            this.lisaProcess.on('error', (error) => {
                console.error('Erro no processo da Lisa:', error);
                this.isRunning = false;
                this.lisaProcess = null;
            });

            return { 
                success: true, 
                message: `Lisa iniciada na porta ${this.settings.lisaPort}`,
                url: `http://localhost:${this.settings.lisaPort}`
            };
        } catch (error) {
            console.error('Erro ao iniciar Lisa:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Parar o servidor da Lisa
     */
    async stopLisa() {
        if (!this.isRunning || !this.lisaProcess) {
            return { success: true, message: 'Lisa não está rodando' };
        }

        try {
            this.lisaProcess.kill('SIGTERM');
            this.isRunning = false;
            this.lisaProcess = null;
            return { success: true, message: 'Lisa parada com sucesso' };
        } catch (error) {
            console.error('Erro ao parar Lisa:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Reiniciar o servidor da Lisa
     */
    async restartLisa() {
        await this.stopLisa();
        await new Promise(resolve => setTimeout(resolve, 2000)); // Aguardar 2 segundos
        return await this.startLisa();
    }

    /**
     * Obter status da Lisa
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.settings?.lisaPort || '8000',
            url: this.isRunning ? `http://localhost:${this.settings?.lisaPort || '8000'}` : null,
            processId: this.lisaProcess?.pid || null
        };
    }

    /**
     * Atualizar configurações da Lisa
     */
    async updateSettings() {
        try {
            this.settings = await SystemSettings.getInstance();
            await this.createEnvFile();
            
            if (this.isRunning) {
                console.log('Reiniciando Lisa com novas configurações...');
                return await this.restartLisa();
            }
            
            return { success: true, message: 'Configurações atualizadas' };
        } catch (error) {
            console.error('Erro ao atualizar configurações da Lisa:', error);
            return { success: false, message: error.message };
        }
    }

    /**
     * Processar mensagem do WhatsApp com Lisa AI
     */
    async processWhatsAppMessage(context) {
        try {
            // Se a Lisa não estiver configurada, usar resposta padrão
            if (!this.settings?.lisaEnabled) {
                return this.getDefaultResponse(context);
            }

            // Preparar contexto para a IA
            const aiContext = await this.prepareAIContext(context);
            
            // Tentar usar API externa (OpenAI/Groq) se disponível
            if (this.settings.lisaOpenAiApiKey || this.settings.lisaGroqApiKey) {
                return await this.processWithExternalAI(aiContext);
            }
            
            // Fallback para resposta baseada em regras
            return this.getIntelligentResponse(aiContext);
        } catch (error) {
            console.error('Erro ao processar mensagem com Lisa:', error);
            return this.getDefaultResponse(context);
        }
    }

    /**
     * Preparar contexto para IA
     */
    async prepareAIContext(context) {
        try {
            // Obter informações da loja
            const store = await Store.findById(context.storeId);
            
            // Obter cardápio da loja
            const categories = await Category.find({ storeId: context.storeId }).populate('foods');
            const foods = await Food.find({ storeId: context.storeId, available: true });

            return {
                ...context,
                store: {
                    name: store?.name || 'Restaurante',
                    description: store?.description || '',
                    address: store?.address || '',
                    phone: store?.phone || ''
                },
                menu: {
                    categories: categories.map(cat => ({
                        name: cat.name,
                        description: cat.description
                    })),
                    foods: foods.map(food => ({
                        name: food.name,
                        description: food.description,
                        price: food.price,
                        category: food.category,
                        available: food.available
                    }))
                }
            };
        } catch (error) {
            console.error('Erro ao preparar contexto:', error);
            return context;
        }
    }

    /**
     * Processar com IA externa (OpenAI/Groq)
     */
    async processWithExternalAI(context) {
        try {
            const prompt = this.buildPrompt(context);
            
            // Tentar OpenAI primeiro
            if (this.settings.lisaOpenAiApiKey) {
                return await this.callOpenAI(prompt);
            }
            
            // Fallback para Groq
            if (this.settings.lisaGroqApiKey) {
                return await this.callGroq(prompt);
            }
            
            throw new Error('Nenhuma API externa configurada');
        } catch (error) {
            console.error('Erro na IA externa:', error);
            return this.getIntelligentResponse(context);
        }
    }

    /**
     * Construir prompt para IA
     */
    buildPrompt(context) {
        const { store, menu, currentMessage, conversationHistory, customerName } = context;
        
        let prompt = `Você é a Liza, assistente virtual do ${store.name}. `;
        prompt += `Você é especializada em atendimento ao cliente, vendas e suporte para pedidos de comida. `;
        prompt += `Seja sempre educada, prestativa e focada em ajudar o cliente a fazer seu pedido.\n\n`;
        
        prompt += `INFORMAÇÕES DO RESTAURANTE:\n`;
        prompt += `Nome: ${store.name}\n`;
        if (store.description) prompt += `Descrição: ${store.description}\n`;
        if (store.address) prompt += `Endereço: ${store.address}\n`;
        if (store.phone) prompt += `Telefone: ${store.phone}\n`;
        
        prompt += `\nCARDÁPIO DISPONÍVEL:\n`;
        menu.foods.forEach(food => {
            prompt += `- ${food.name}: R$ ${food.price.toFixed(2)}`;
            if (food.description) prompt += ` - ${food.description}`;
            prompt += `\n`;
        });
        
        if (conversationHistory.length > 0) {
            prompt += `\nHISTÓRICO DA CONVERSA:\n`;
            conversationHistory.slice(-5).forEach(msg => {
                const sender = msg.direction === 'inbound' ? customerName || 'Cliente' : 'Liza';
                prompt += `${sender}: ${msg.content}\n`;
            });
        }
        
        prompt += `\nMENSAGEM ATUAL DO CLIENTE:\n${currentMessage}\n\n`;
        prompt += `\nINSTRUÇÕES:\n`;
        prompt += `- Você é a LIZA, não se refira ao usuário como 'Liza'\n`;
        prompt += `- Trate o usuário como 'você' ou pelo nome dele se souber\n`;
        prompt += `- Responda de forma natural e conversacional\n`;
        prompt += `- Ajude o cliente a escolher itens do cardápio\n`;
        prompt += `- Forneça informações sobre preços quando solicitado\n`;
        prompt += `- Se o cliente quiser fazer um pedido, colete os itens e quantidades\n`;
        prompt += `- Seja proativa em sugerir itens populares ou combos\n`;
        prompt += `- Mantenha as respostas concisas (máximo 200 caracteres para WhatsApp)\n`;
        prompt += `- Use emojis moderadamente para tornar a conversa mais amigável\n\n`;
        prompt += `RESPOSTA:`;
        
        return prompt;
    }

    /**
     * Chamar OpenAI API
     */
    async callOpenAI(prompt) {
        try {
            const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                model: 'gpt-3.5-turbo',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 150,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.settings.lisaOpenAiApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erro na OpenAI:', error);
            throw error;
        }
    }

    /**
     * Chamar Groq API
     */
    async callGroq(prompt) {
        try {
            const response = await axios.post('https://api.groq.com/openai/v1/chat/completions', {
                model: 'mixtral-8x7b-32768',
                messages: [{
                    role: 'user',
                    content: prompt
                }],
                max_tokens: 150,
                temperature: 0.7
            }, {
                headers: {
                    'Authorization': `Bearer ${this.settings.lisaGroqApiKey}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.data.choices[0].message.content.trim();
        } catch (error) {
            console.error('Erro no Groq:', error);
            throw error;
        }
    }

    /**
     * Resposta inteligente baseada em regras
     */
    getIntelligentResponse(context) {
        const { currentMessage, conversationHistory, store, menu } = context;
        const message = currentMessage.toLowerCase();
        
        // Primeira mensagem - boas-vindas
        if (conversationHistory.length === 0) {
            return `Olá! 👋 Bem-vindo ao ${store.name}! Sou a Liza, sua assistente virtual. Como posso ajudá-lo hoje? Posso mostrar nosso cardápio ou ajudar com seu pedido! 😊`;
        }
        
        // Cardápio/Menu
        if (message.includes('cardápio') || message.includes('menu') || message.includes('opções')) {
            let response = `🍽️ Aqui está nosso cardápio:\n\n`;
            menu.foods.slice(0, 5).forEach(food => {
                response += `• ${food.name} - R$ ${food.price.toFixed(2)}\n`;
            });
            if (menu.foods.length > 5) {
                response += `\n... e mais ${menu.foods.length - 5} opções! O que te interessa?`;
            }
            return response;
        }
        
        // Preços
        if (message.includes('preço') || message.includes('valor') || message.includes('custa')) {
            const foodMentioned = menu.foods.find(food => 
                message.includes(food.name.toLowerCase())
            );
            
            if (foodMentioned) {
                return `💰 ${foodMentioned.name} custa R$ ${foodMentioned.price.toFixed(2)}. Gostaria de adicionar ao seu pedido?`;
            }
            
            return `💰 Sobre qual item você gostaria de saber o preço? Posso ajudar com qualquer item do nosso cardápio!`;
        }
        
        // Pedido
        if (message.includes('pedido') || message.includes('pedir') || message.includes('quero')) {
            return `🛒 Perfeito! Vou ajudá-lo com seu pedido. Qual item do cardápio você gostaria? Posso sugerir nossos pratos mais populares se preferir!`;
        }
        
        // Entrega
        if (message.includes('entrega') || message.includes('delivery') || message.includes('entregar')) {
            return `🚚 Fazemos entregas sim! Qual é seu endereço para calcularmos o frete? Ou prefere retirar no balcão?`;
        }
        
        // Horário
        if (message.includes('horário') || message.includes('funciona') || message.includes('aberto')) {
            return `🕐 Nosso horário de funcionamento é de segunda a domingo, das 11h às 23h. Estamos abertos agora! Como posso ajudar?`;
        }
        
        // Resposta padrão
        return `Obrigada pela mensagem! 😊 Posso ajudá-lo com:\n• Ver nosso cardápio 🍽️\n• Fazer um pedido 🛒\n• Informações sobre entrega 🚚\n\nO que você gostaria?`;
    }

    /**
     * Resposta padrão quando Lisa está desabilitada
     */
    getDefaultResponse(context) {
        return context.welcomeMessage || 'Obrigado pelo contato! Em breve retornaremos sua mensagem.';
    }
}

// Instância singleton
const lisaService = new LisaService();

export default lisaService;