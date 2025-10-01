// Serviço de comunicação com OpenRouter API
class OpenRouterService {
  constructor() {
    this.baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    this.model = 'meta-llama/llama-3.2-3b-instruct:free'; // Modelo gratuito do OpenRouter
    this.apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  }

  // Verificar se a API Key está configurada
  checkApiKey() {
    console.log('Verificando API Key:', this.apiKey ? 'Configurada' : 'Não configurada');
    console.log('API Key (primeiros 20 chars):', this.apiKey ? this.apiKey.substring(0, 20) + '...' : 'undefined');
    
    if (!this.apiKey || this.apiKey === 'sk-or-v1-your-api-key-here') {
      console.error('OPENROUTER_API_KEY não está configurada ou está usando valor de exemplo');
      throw new Error('OPENROUTER_API_KEY não está configurada. Configure uma API Key válida do OpenRouter.');
    }
    return true;
  }

  // Verificar se o OpenRouter está acessível
  async checkConnection() {
    try {
      if (!this.checkApiKey()) {
        return false;
      }

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: 'Test connection' },
            { role: 'user', content: 'Hi' }
          ],
          max_tokens: 1
        })
      });
      
      return response.ok || response.status === 400; // 400 pode indicar que a API está funcionando
    } catch (error) {
      console.error('OpenRouter não está acessível:', error);
      return false;
    }
  }

  // Enviar mensagem para o OpenRouter
  async sendMessage(message, context = {}) {
    try {
      if (!this.checkApiKey()) {
        throw new Error('OPENROUTER_API_KEY não está configurada. Configure uma API Key válida do OpenRouter.');
      }

      console.log('Enviando requisição para OpenRouter...');
      console.log('Modelo:', this.model);
      console.log('URL:', this.baseUrl);

      // Construir prompt do sistema com contexto
      const systemPrompt = this.buildSystemPrompt(context);
      
      const requestBody = {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      };

      console.log('Request body:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Liza Chat Assistant'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta:', errorText);
        
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: { message: errorText } };
        }
        
        if (response.status === 401) {
          throw new Error(`API Key inválida ou expirada. Verifique sua chave do OpenRouter. Erro: ${errorData.error?.message || 'Unauthorized'}`);
        }
        
        throw new Error(`Erro na comunicação com OpenRouter: ${response.status} - ${errorData.error?.message || 'Erro desconhecido'}`);
      }

      const data = await response.json();
      console.log('Resposta recebida:', data);
      const aiResponse = data.choices?.[0]?.message?.content?.trim();
      
      return {
        success: true,
        response: aiResponse || 'Desculpe, não consegui processar sua mensagem.',
        model: this.model
      };

    } catch (error) {
      console.error('Erro no OpenRouterService:', error);
      return {
        success: false,
        error: error.message,
        response: 'Erro ao conectar com a assistente Liza. Verifique a configuração da API Key do OpenRouter.'
      };
    }
  }

  // Construir prompt do sistema com contexto
  buildSystemPrompt(context) {
    const basePrompt = `Você é a Liza, assistente inteligente do painel administrativo de um restaurante.

Suas funções principais:
- Consultar e gerenciar o cardápio (produtos, preços, disponibilidade)
- Consultar pedidos em andamento
- Gerar relatórios básicos
- Ajudar com operações administrativas

Regras importantes:
- Você é a LIZA, não se refira ao usuário como 'Liza'
- Trate o usuário como 'você' ou pelo nome dele se souber
- Respostas SEMPRE curtas e diretas
- Máximo 2-3 frases por resposta
- Use emojis para deixar mais amigável
- Seja proativa e útil
- Foque em ações práticas`;

    let contextualPrompt = basePrompt;

    // Adicionar contexto do cardápio se disponível
    if (context.menu && context.menu.length > 0) {
      contextualPrompt += `\n\nCardápio atual (${context.menu.length} itens):\n`;
      context.menu.slice(0, 10).forEach(item => {
        const status = item.available ? '✅' : '❌';
        contextualPrompt += `${status} ${item.name} - R$ ${item.price}\n`;
      });
    }

    // Adicionar contexto de pedidos se disponível
    if (context.orders && context.orders.length > 0) {
      contextualPrompt += `\n\nPedidos em andamento: ${context.orders.length}\n`;
      context.orders.slice(0, 5).forEach(order => {
        contextualPrompt += `📦 Pedido #${order.id} - ${order.status} - R$ ${order.total}\n`;
      });
    }

    return contextualPrompt;
  }

  // Alterar modelo (para facilitar troca)
  setModel(modelName) {
    this.model = modelName;
  }

  // Obter modelo atual
  getModel() {
    return this.model;
  }

  // Modelos disponíveis no OpenRouter
  getAvailableModels() {
    return [
      'mistralai/mistral-7b-instruct',
      'openai/gpt-3.5-turbo',
      'openai/gpt-4',
      'anthropic/claude-3-haiku',
      'meta-llama/llama-3.1-8b-instruct',
      'google/gemini-pro'
    ];
  }
}

export default new OpenRouterService();