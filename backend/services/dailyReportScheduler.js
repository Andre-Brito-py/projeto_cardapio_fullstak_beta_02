import cron from 'node-cron';
import lizaService from './lizaIntegrationService.js';
import Order from '../models/orderModel.js';
import Food from '../models/foodModel.js';

class DailyReportScheduler {
  constructor() {
    this.isScheduled = false;
    this.scheduledTime = '18:00'; // Horário padrão: 18:00
    this.cronJob = null;
  }

  // Gerar relatório diário
  async generateDailyReport() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

      // Buscar pedidos do dia
      const todayOrders = await Order.find({
        createdAt: {
          $gte: startOfDay,
          $lt: endOfDay
        }
      }).populate('items.food');

      // Filtrar pedidos concluídos
      const completedOrders = todayOrders.filter(order => 
        ['delivered', 'completed', 'finalizado'].includes(order.status)
      );

      // Calcular estatísticas
      const completedCount = completedOrders.length;
      const totalRevenue = completedOrders.reduce((sum, order) => {
        return sum + (order.amount || order.total || 0);
      }, 0);
      
      const averageTicket = completedCount > 0 ? totalRevenue / completedCount : 0;

      // Encontrar produto mais vendido
      const productSales = {};
      completedOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach(item => {
            const productName = item.food?.name || item.name || 'Produto desconhecido';
            const quantity = item.quantity || 1;
            productSales[productName] = (productSales[productName] || 0) + quantity;
          });
        }
      });

      let topProduct = 'Nenhum produto vendido';
      let maxQuantity = 0;
      
      Object.entries(productSales).forEach(([product, quantity]) => {
        if (quantity > maxQuantity) {
          maxQuantity = quantity;
          topProduct = `${product} (${quantity}x)`;
        }
      });

      // Pedidos pendentes
      const pendingOrders = todayOrders.filter(order => 
        ['pending', 'preparing', 'ready', 'em_preparo', 'pendente'].includes(order.status)
      ).length;

      return {
        date: today.toISOString().split('T')[0],
        completedOrders: completedCount,
        pendingOrders,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        averageTicket: Math.round(averageTicket * 100) / 100,
        topProduct,
        totalOrders: todayOrders.length,
        generatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('Erro ao gerar relatório diário:', error);
      return null;
    }
  }

  // Formatar mensagem do relatório
  formatReportMessage(report) {
    if (!report) {
      return "❌ Não foi possível gerar o relatório diário. Verifique os logs do sistema.";
    }

    const date = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let performance = '📈 Excelente';
    if (report.completedOrders === 0) {
      performance = '😴 Sem vendas';
    } else if (report.completedOrders < 5) {
      performance = '📉 Baixa';
    } else if (report.completedOrders < 15) {
      performance = '📊 Moderada';
    }

    return `🤖 **Relatório Diário da Liza**\n\n` +
           `📅 **${date}**\n\n` +
           `📊 **RESUMO DO DIA**\n` +
           `🛍️ Pedidos Concluídos: **${report.completedOrders}**\n` +
           `⏳ Pedidos Pendentes: **${report.pendingOrders}**\n` +
           `💰 Faturamento Total: **R$ ${report.totalRevenue.toFixed(2)}**\n` +
           `🎯 Ticket Médio: **R$ ${report.averageTicket.toFixed(2)}**\n` +
           `🏆 Produto Mais Vendido: **${report.topProduct}**\n\n` +
           `📈 **Performance:** ${performance}\n` +
           `🕐 **Gerado às:** ${new Date().toLocaleTimeString('pt-BR')}\n\n` +
           `💡 *Dica: Digite "Liza, resumo de hoje" para ver este relatório a qualquer momento!*`;
  }

  // Enviar relatório via Liza
  async sendDailyReport() {
    try {
      console.log('🤖 Liza: Gerando relatório diário automático...');
      
      const report = await this.generateDailyReport();
      const message = this.formatReportMessage(report);
      
      // Aqui você pode integrar com diferentes canais:
      // 1. WhatsApp Business API
      // 2. Email
      // 3. Slack
      // 4. Telegram
      // 5. Sistema interno de notificações
      
      console.log('📊 Relatório diário gerado:');
      console.log(message);
      
      // Exemplo de integração com WhatsApp (descomente quando configurado)
      /*
      if (process.env.WHATSAPP_ADMIN_NUMBER) {
        await this.sendWhatsAppMessage(process.env.WHATSAPP_ADMIN_NUMBER, message);
      }
      */
      
      // Log do relatório
      console.log(`✅ Relatório diário enviado às ${new Date().toLocaleTimeString('pt-BR')}`);
      
      return { success: true, report, message };
      
    } catch (error) {
      console.error('❌ Erro ao enviar relatório diário:', error);
      return { success: false, error: error.message };
    }
  }

  // Agendar relatório diário
  scheduleDailyReport(time = '18:00') {
    try {
      // Parar job anterior se existir
      if (this.cronJob) {
        this.cronJob.stop();
      }

      // Converter horário para formato cron (HH:MM -> MM HH * * *)
      const [hours, minutes] = time.split(':');
      const cronExpression = `${minutes} ${hours} * * *`;
      
      // Criar novo job
      this.cronJob = cron.schedule(cronExpression, async () => {
        await this.sendDailyReport();
      }, {
        scheduled: false,
        timezone: 'America/Sao_Paulo'
      });
      
      // Iniciar o job
      this.cronJob.start();
      
      this.isScheduled = true;
      this.scheduledTime = time;
      
      console.log(`⏰ Relatório diário agendado para ${time} (horário de Brasília)`);
      
      return {
        success: true,
        message: `Relatório diário agendado para ${time}`,
        scheduledTime: time,
        nextExecution: this.getNextExecutionTime()
      };
      
    } catch (error) {
      console.error('Erro ao agendar relatório diário:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Parar agendamento
  stopSchedule() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isScheduled = false;
      console.log('⏹️ Agendamento de relatório diário parado');
      return { success: true, message: 'Agendamento parado' };
    }
    return { success: false, message: 'Nenhum agendamento ativo' };
  }

  // Obter próxima execução
  getNextExecutionTime() {
    if (!this.isScheduled) return null;
    
    const now = new Date();
    const [hours, minutes] = this.scheduledTime.split(':');
    const nextExecution = new Date();
    
    nextExecution.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Se já passou do horário hoje, agendar para amanhã
    if (nextExecution <= now) {
      nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution.toISOString();
  }

  // Status do agendamento
  getScheduleStatus() {
    return {
      isScheduled: this.isScheduled,
      scheduledTime: this.scheduledTime,
      nextExecution: this.getNextExecutionTime(),
      timezone: 'America/Sao_Paulo'
    };
  }

  // Enviar relatório manual (comando)
  async sendManualReport() {
    console.log('📋 Enviando relatório manual...');
    return await this.sendDailyReport();
  }

  // Integração com WhatsApp (exemplo)
  async sendWhatsAppMessage(phoneNumber, message) {
    try {
      // Implementar integração com WhatsApp Business API
      // Este é um exemplo - você precisa configurar com suas credenciais
      
      console.log(`📱 Enviando para WhatsApp ${phoneNumber}:`);
      console.log(message);
      
      // Aqui você faria a chamada real para a API do WhatsApp
      
      return { success: true };
    } catch (error) {
      console.error('Erro ao enviar WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

// Instância singleton
const dailyReportScheduler = new DailyReportScheduler();

// Adicionar método init
dailyReportScheduler.init = function() {
  console.log('📊 Agendador de relatórios diários inicializado');
  // Aqui você pode adicionar lógica de inicialização se necessário
  // Por exemplo, verificar se há agendamentos salvos no banco de dados
};

// Inicializar agendamento padrão (18:00)
if (process.env.ENABLE_DAILY_REPORTS !== 'false') {
  const defaultTime = process.env.DAILY_REPORT_TIME || '18:00';
  dailyReportScheduler.scheduleDailyReport(defaultTime);
}

export default dailyReportScheduler;