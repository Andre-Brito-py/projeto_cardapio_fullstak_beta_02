import openRouterService from './openRouterService.js';
import backendService from './backendService.js';

// Serviço principal da assistente Liza
class LizaService {
  constructor() {
    this.commandPatterns = {
      // Padrões para reconhecimento de comandos
      menu: /(?:cardápio|cardapio|menu|produtos|itens)/i,
      availability: /(?:disponível|disponivel|indisponível|indisponivel|ativar|desativar)/i,
      price: /(?:preço|preco|valor|custo|alterar.*preço|alterar.*preco)/i,
      orders: /(?:pedidos?|encomendas?)/i,
      report: /(?:relatório|relatorio|resumo|balanço|balanco)/i,
      add: /(?:adicionar|criar|novo)/i,
      remove: /(?:remover|excluir|deletar)/i,
      help: /(?:ajuda|help|comandos)/i
    };
  }

  // Processar mensagem do usuário
  async processMessage(message) {
    try {
      // Detectar tipo de comando
      const commandType = this.detectCommand(message);
      
      // Processar comando específico
      if (commandType !== 'general') {
        const commandResult = await this.executeCommand(commandType, message);
        if (commandResult.handled) {
          return commandResult;
        }
      }

      // Se não foi um comando específico, enviar para o OpenRouter
      return await this.sendToOpenRouter(message);

    } catch (error) {
      console.error('Erro no LizaService:', error);
      return {
        success: false,
        response: 'Desculpe, ocorreu um erro interno. Tente novamente.'
      };
    }
  }

  // Detectar tipo de comando na mensagem
  detectCommand(message) {
    const lowerMessage = message.toLowerCase();

    if (this.commandPatterns.help.test(lowerMessage)) {
      return 'help';
    }
    if (this.commandPatterns.report.test(lowerMessage)) {
      return 'report';
    }
    if (this.commandPatterns.orders.test(lowerMessage)) {
      return 'orders';
    }
    if (this.commandPatterns.availability.test(lowerMessage) && this.commandPatterns.menu.test(lowerMessage)) {
      return 'availability';
    }
    if (this.commandPatterns.price.test(lowerMessage)) {
      return 'price';
    }
    if (this.commandPatterns.add.test(lowerMessage) && this.commandPatterns.menu.test(lowerMessage)) {
      return 'add';
    }
    if (this.commandPatterns.remove.test(lowerMessage) && this.commandPatterns.menu.test(lowerMessage)) {
      return 'remove';
    }
    if (this.commandPatterns.menu.test(lowerMessage)) {
      return 'menu';
    }

    return 'general';
  }

  // Executar comando específico
  async executeCommand(commandType, message) {
    switch (commandType) {
      case 'help':
        return this.showHelp();
      
      case 'menu':
        return await this.handleMenuCommand(message);
      
      case 'availability':
        return await this.handleAvailabilityCommand(message);
      
      case 'price':
        return await this.handlePriceCommand(message);
      
      case 'orders':
        return await this.handleOrdersCommand(message);
      
      case 'report':
        return await this.handleReportCommand(message);
      
      case 'add':
        return await this.handleAddCommand(message);
      
      case 'remove':
        return await this.handleRemoveCommand(message);
      
      default:
        return { handled: false };
    }
  }

  // Mostrar ajuda
  showHelp() {
    const helpText = `🤖 **Comandos da Liza:**\n\n` +
      `📋 **Cardápio:**\n` +
      `• "consultar cardápio" - Ver todos os produtos\n` +
      `• "disponibilizar [item]" - Marcar item como disponível\n` +
      `• "indisponibilizar [item]" - Marcar item como indisponível\n` +
      `• "alterar preço [item] [valor]" - Alterar preço\n` +
      `• "adicionar [item]" - Adicionar novo produto\n` +
      `• "remover [item]" - Remover produto\n\n` +
      `📦 **Pedidos:**\n` +
      `• "pedidos em andamento" - Ver pedidos ativos\n` +
      `• "todos os pedidos" - Ver todos os pedidos\n\n` +
      `📊 **Relatórios:**\n` +
      `• "relatório do dia" - Resumo diário\n` +
      `• "resumo de hoje" - Estatísticas do dia`;

    return {
      success: true,
      response: helpText,
      handled: true
    };
  }

  // Lidar com comandos do cardápio
  async handleMenuCommand(message) {
    try {
      const result = await backendService.getMenuItems();
      
      if (!result.success) {
        return {
          success: false,
          response: `❌ Erro ao consultar cardápio: ${result.error}`,
          handled: true
        };
      }

      if (result.data.length === 0) {
        return {
          success: true,
          response: '📋 Cardápio vazio. Nenhum produto cadastrado.',
          handled: true
        };
      }

      let response = `📋 **Cardápio (${result.data.length} itens):**\n\n`;
      result.data.forEach((item, index) => {
        const status = item.available !== false ? '✅' : '❌';
        response += `${index + 1}. ${status} **${item.name}** - R$ ${item.price?.toFixed(2) || '0.00'}\n`;
        if (item.description) {
          response += `   _${item.description}_\n`;
        }
        response += '\n';
      });

      return {
        success: true,
        response: response.trim(),
        handled: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        response: '❌ Erro interno ao consultar cardápio.',
        handled: true
      };
    }
  }

  // Lidar com comandos de disponibilidade
  async handleAvailabilityCommand(message) {
    try {
      // Extrair nome do item da mensagem
      const itemName = this.extractItemName(message);
      if (!itemName) {
        return {
          success: false,
          response: '❌ Por favor, especifique o nome do item. Ex: "disponibilizar Pizza Margherita"',
          handled: true
        };
      }

      // Buscar item no cardápio
      const findResult = await backendService.findMenuItem(itemName);
      if (!findResult.success || !findResult.found || findResult.data.length === 0) {
        return {
          success: false,
          response: `❌ Item "${itemName}" não encontrado no cardápio.`,
          handled: true
        };
      }

      const item = findResult.data[0];
      const makeAvailable = /(?:disponível|disponivel|ativar)/i.test(message);
      
      // Atualizar disponibilidade
      const updateResult = await backendService.updateItemAvailability(item._id, makeAvailable);
      
      if (updateResult.success) {
        const status = makeAvailable ? 'disponibilizado' : 'indisponibilizado';
        return {
          success: true,
          response: `✅ **${item.name}** foi ${status} com sucesso!`,
          handled: true
        };
      } else {
        return {
          success: false,
          response: `❌ Erro ao alterar disponibilidade: ${updateResult.error}`,
          handled: true
        };
      }
    } catch (error) {
      return {
        success: false,
        response: '❌ Erro interno ao alterar disponibilidade.',
        handled: true
      };
    }
  }

  // Lidar com comandos de preço
  async handlePriceCommand(message) {
    try {
      // Extrair nome do item e novo preço
      const itemName = this.extractItemName(message);
      const newPrice = this.extractPrice(message);
      
      if (!itemName || !newPrice) {
        return {
          success: false,
          response: '❌ Por favor, especifique o item e o novo preço. Ex: "alterar preço Pizza Margherita 25.90"',
          handled: true
        };
      }

      // Buscar item no cardápio
      const findResult = await backendService.findMenuItem(itemName);
      if (!findResult.success || !findResult.found || findResult.data.length === 0) {
        return {
          success: false,
          response: `❌ Item "${itemName}" não encontrado no cardápio.`,
          handled: true
        };
      }

      const item = findResult.data[0];
      
      // Atualizar preço
      const updateResult = await backendService.updateItemPrice(item._id, newPrice);
      
      if (updateResult.success) {
        return {
          success: true,
          response: `✅ Preço de **${item.name}** alterado para **R$ ${newPrice.toFixed(2)}**!`,
          handled: true
        };
      } else {
        return {
          success: false,
          response: `❌ Erro ao alterar preço: ${updateResult.error}`,
          handled: true
        };
      }
    } catch (error) {
      return {
        success: false,
        response: '❌ Erro interno ao alterar preço.',
        handled: true
      };
    }
  }

  // Lidar com comandos de pedidos
  async handleOrdersCommand(message) {
    try {
      const isActiveOnly = /(?:andamento|ativo|pendente)/i.test(message);
      
      const result = isActiveOnly 
        ? await backendService.getActiveOrders()
        : await backendService.getAllOrders();
      
      if (!result.success) {
        return {
          success: false,
          response: `❌ Erro ao consultar pedidos: ${result.error}`,
          handled: true
        };
      }

      if (result.data.length === 0) {
        const message = isActiveOnly ? 'Nenhum pedido em andamento.' : 'Nenhum pedido encontrado.';
        return {
          success: true,
          response: `📦 ${message}`,
          handled: true
        };
      }

      const title = isActiveOnly ? 'Pedidos em Andamento' : 'Todos os Pedidos';
      let response = `📦 **${title} (${result.data.length}):**\n\n`;
      
      result.data.slice(0, 10).forEach((order, index) => {
        const statusEmoji = this.getStatusEmoji(order.status);
        const total = order.amount || 0;
        response += `${index + 1}. ${statusEmoji} **Pedido #${order._id?.slice(-6) || 'N/A'}**\n`;
        response += `   💰 R$ ${total.toFixed(2)} | 📅 ${new Date(order.createdAt).toLocaleString('pt-BR')}\n\n`;
      });

      if (result.data.length > 10) {
        response += `... e mais ${result.data.length - 10} pedidos.`;
      }

      return {
        success: true,
        response: response.trim(),
        handled: true,
        data: result.data
      };
    } catch (error) {
      return {
        success: false,
        response: '❌ Erro interno ao consultar pedidos.',
        handled: true
      };
    }
  }

  // Lidar com comandos de relatório
  async handleReportCommand(message) {
    try {
      const result = await backendService.getDailyReport();
      
      if (!result.success) {
        return {
          success: false,
          response: `❌ Erro ao gerar relatório: ${result.error}`,
          handled: true
        };
      }

      const report = result.data;
      const response = `📊 **Relatório do Dia - ${new Date().toLocaleDateString('pt-BR')}**\n\n` +
        `🛍️ **Pedidos Concluídos:** ${report.completedOrders}\n` +
        `⏳ **Pedidos Pendentes:** ${report.pendingOrders}\n` +
        `💰 **Faturamento:** R$ ${report.totalRevenue?.toFixed(2) || '0.00'}\n` +
        `🎯 **Ticket Médio:** R$ ${report.averageTicket?.toFixed(2) || '0.00'}\n` +
        `🏆 **Mais Vendido:** ${report.topProduct || 'N/A'}\n\n` +
        `📈 **Status:** ${report.completedOrders > 0 ? 'Ativo' : 'Sem vendas hoje'}`;

      return {
        success: true,
        response: response,
        handled: true,
        data: report
      };
    } catch (error) {
      return {
        success: false,
        response: '❌ Erro interno ao gerar relatório.',
        handled: true
      };
    }
  }

  // Placeholder para comandos de adicionar e remover
  async handleAddCommand(message) {
    return {
      success: true,
      response: '➕ Para adicionar itens, use o painel "Adicionar Item" no menu lateral.',
      handled: true
    };
  }

  async handleRemoveCommand(message) {
    return {
      success: true,
      response: '🗑️ Para remover itens, use o painel "Lista de Itens" no menu lateral.',
      handled: true
    };
  }

  // Enviar mensagem para o OpenRouter
  async sendToOpenRouter(message) {
    try {
      // Buscar contexto atual (cardápio e pedidos)
      const [menuResult, ordersResult] = await Promise.all([
        backendService.getMenuItems(),
        backendService.getActiveOrders()
      ]);

      const context = {};
      if (menuResult.success) {
        context.menu = menuResult.data.slice(0, 20); // Limitar contexto
      }
      if (ordersResult.success) {
        context.orders = ordersResult.data.slice(0, 10); // Limitar contexto
      }

      const result = await openRouterService.sendMessage(message, context);
      return {
        success: result.success,
        response: result.response,
        model: result.model
      };
    } catch (error) {
      return {
        success: false,
        response: 'Erro ao processar mensagem com a IA.'
      };
    }
  }

  // Utilitários
  extractItemName(message) {
    // Remover palavras de comando e extrair nome do item
    const cleaned = message
      .replace(/(?:disponível|disponivel|indisponível|indisponivel|ativar|desativar|alterar|preço|preco)/gi, '')
      .trim();
    
    return cleaned || null;
  }

  extractPrice(message) {
    // Extrair valor numérico da mensagem
    const priceMatch = message.match(/(?:R\$\s*)?([0-9]+(?:[.,][0-9]{1,2})?)/i);
    if (priceMatch) {
      return parseFloat(priceMatch[1].replace(',', '.'));
    }
    return null;
  }

  getStatusEmoji(status) {
    const statusMap = {
      'pending': '⏳',
      'preparing': '👨‍🍳',
      'ready': '✅',
      'delivered': '🚚',
      'completed': '✅',
      'cancelled': '❌'
    };
    return statusMap[status] || '📦';
  }
}

export default new LizaService();