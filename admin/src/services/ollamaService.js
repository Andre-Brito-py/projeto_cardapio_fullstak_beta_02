// Serviço de comunicação com Ollama local
class OllamaService {
  constructor() {
    this.baseUrl = 'http://localhost:11434';
    this.model = 'llama3.1:latest'; // Modelo padrão
  }

  // Verificar se o Ollama está rodando
  async checkConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error) {
      console.error('Ollama não está rodando:', error);
      return false;
    }
  }

  // Enviar mensagem para o Ollama
  async sendMessage(message, context = {}) {
    try {
      const isConnected = await this.checkConnection();
      if (!isConnected) {
        throw new Error('Ollama não está disponível. Certifique-se de que está rodando em localhost:11434');
      }

      // Construir prompt com contexto
      const systemPrompt = this.buildSystemPrompt(context);
      const fullPrompt = `${systemPrompt}\n\nUsuário: ${message}\n\nAssistente:`;

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: fullPrompt,
          stream: false,
          options: {
            temperature: 0.7,
            top_p: 0.9,
            max_tokens: 500
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Erro na comunicação com Ollama: ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        response: data.response?.trim() || 'Desculpe, não consegui processar sua mensagem.',
        model: this.model
      };

    } catch (error) {
      console.error('Erro no OllamaService:', error);
      return {
        success: false,
        error: error.message,
        response: 'Erro ao conectar com a assistente Liza. Verifique se o Ollama está rodando.'
      };
    }
  }

  // Construir prompt do sistema com contexto
  buildSystemPrompt(context) {
    const basePrompt = `Você é Liza, assistente inteligente do painel administrativo de um restaurante.

Suas funções principais:
- Consultar e gerenciar o cardápio (produtos, preços, disponibilidade)
- Consultar pedidos em andamento
- Gerar relatórios básicos
- Ajudar com operações administrativas

Regras importantes:
- Respostas SEMPRE curtas e diretas
- Confirme ações realizadas ou informe erros
- Use linguagem profissional mas amigável
- Foque em eficiência operacional`;

    // Adicionar contexto específico se disponível
    if (context.menuItems) {
      return `${basePrompt}\n\nCardápio atual: ${JSON.stringify(context.menuItems, null, 2)}`;
    }

    if (context.orders) {
      return `${basePrompt}\n\nPedidos em andamento: ${JSON.stringify(context.orders, null, 2)}`;
    }

    return basePrompt;
  }

  // Processar comandos específicos
  async processCommand(command, data = {}) {
    const commands = {
      'consultar_cardapio': () => this.handleMenuQuery(data),
      'alterar_disponibilidade': () => this.handleAvailabilityChange(data),
      'alterar_preco': () => this.handlePriceChange(data),
      'consultar_pedidos': () => this.handleOrdersQuery(data),
      'gerar_relatorio': () => this.handleReportGeneration(data)
    };

    if (commands[command]) {
      return await commands[command]();
    }

    return {
      success: false,
      response: 'Comando não reconhecido. Digite "ajuda" para ver os comandos disponíveis.'
    };
  }

  // Handlers para comandos específicos
  async handleMenuQuery(data) {
    return {
      success: true,
      response: 'Consultando cardápio...',
      action: 'fetch_menu'
    };
  }

  async handleAvailabilityChange(data) {
    return {
      success: true,
      response: `Alterando disponibilidade do item: ${data.itemName}`,
      action: 'update_availability',
      data: data
    };
  }

  async handlePriceChange(data) {
    return {
      success: true,
      response: `Alterando preço do item: ${data.itemName} para R$ ${data.newPrice}`,
      action: 'update_price',
      data: data
    };
  }

  async handleOrdersQuery(data) {
    return {
      success: true,
      response: 'Consultando pedidos em andamento...',
      action: 'fetch_orders'
    };
  }

  async handleReportGeneration(data) {
    return {
      success: true,
      response: 'Gerando relatório...',
      action: 'generate_report',
      data: data
    };
  }
}

export default new OllamaService();