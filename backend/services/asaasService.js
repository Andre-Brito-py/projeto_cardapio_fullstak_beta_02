import axios from 'axios';
import Store from '../models/storeModel.js';
import PaymentLog from '../models/paymentLogModel.js';

class AsaasService {
  constructor() {
    this.baseURL = process.env.ASAAS_ENVIRONMENT === 'production' 
      ? 'https://www.asaas.com/api/v3'
      : 'https://sandbox.asaas.com/api/v3';
    
    this.apiKey = process.env.ASAAS_ENVIRONMENT === 'production'
      ? process.env.ASAAS_API_KEY_PRODUCTION
      : process.env.ASAAS_API_KEY_SANDBOX;
    
    this.axios = axios.create({
      baseURL: this.baseURL,
      headers: {
        'access_token': this.apiKey,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });

    // Interceptor para log de requisições
    this.axios.interceptors.request.use(
      (config) => {
        // Log da requisição ASAAS
        return config;
      },
      (error) => {
        console.error('[ASAAS] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para log de respostas
    this.axios.interceptors.response.use(
      (response) => {
        // Log da resposta ASAAS
        return response;
      },
      (error) => {
        console.error('[ASAAS] Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Criar cliente no Asaas
   * @param {Object} storeData - Dados da loja
   * @returns {Promise<Object>} - Dados do cliente criado
   */
  async criarCliente(storeData) {
    try {
      const customerData = {
        name: storeData.name,
        email: storeData.owner.email,
        phone: storeData.owner.phone || '',
        mobilePhone: storeData.owner.mobilePhone || storeData.owner.phone || '',
        cpfCnpj: storeData.owner.cpfCnpj || '',
        postalCode: storeData.settings?.address?.zipCode || '',
        address: storeData.settings?.address?.street || '',
        addressNumber: storeData.settings?.address?.number || '',
        complement: storeData.settings?.address?.complement || '',
        province: storeData.settings?.address?.neighborhood || '',
        city: storeData.settings?.address?.city || '',
        state: storeData.settings?.address?.state || '',
        country: 'Brasil',
        externalReference: storeData._id.toString(),
        notificationDisabled: false,
        additionalEmails: '',
        municipalInscription: '',
        stateInscription: '',
        observations: `Cliente criado para loja: ${storeData.name}`
      };

      const response = await this.axios.post('/customers', customerData);
      
      // Cliente ASAAS criado
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao criar cliente:', error.response?.data || error.message);
      throw new Error(`Erro ao criar cliente no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Criar assinatura no Asaas
   * @param {string} customerId - ID do cliente no Asaas
   * @param {Object} subscriptionData - Dados da assinatura
   * @returns {Promise<Object>} - Dados da assinatura criada
   */
  async criarAssinatura(customerId, subscriptionData) {
    try {
      const { plano, ciclo, billingType = 'PIX' } = subscriptionData;
      
      // Definir valores dos planos
      const planos = {
        'Básico': { mensal: 29.90, anual: 299.00 },
        'Premium': { mensal: 59.90, anual: 599.00 },
        'Enterprise': { mensal: 99.90, anual: 999.00 }
      };

      const valor = planos[plano]?.[ciclo];
      if (!valor) {
        throw new Error(`Plano ${plano} com ciclo ${ciclo} não encontrado`);
      }

      const subscriptionPayload = {
        customer: customerId,
        billingType: billingType,
        value: valor,
        nextDueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
        description: `Assinatura ${plano} - ${ciclo}`,
        cycle: ciclo === 'mensal' ? 'MONTHLY' : 'YEARLY',
        endDate: null, // Assinatura sem data de fim
        maxPayments: null,
        externalReference: `${customerId}_${plano}_${ciclo}`,
        split: []
      };

      const response = await this.axios.post('/subscriptions', subscriptionPayload);
      
      // Assinatura ASAAS criada
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao criar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao criar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Buscar pagamento no Asaas
   * @param {string} paymentId - ID do pagamento
   * @returns {Promise<Object>} - Dados do pagamento
   */
  async buscarPagamento(paymentId) {
    try {
      const response = await this.axios.get(`/payments/${paymentId}`);
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao buscar pagamento:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar pagamento no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Buscar assinatura no Asaas
   * @param {string} subscriptionId - ID da assinatura
   * @returns {Promise<Object>} - Dados da assinatura
   */
  async buscarAssinatura(subscriptionId) {
    try {
      const response = await this.axios.get(`/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao buscar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao buscar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Cancelar assinatura no Asaas
   * @param {string} subscriptionId - ID da assinatura
   * @returns {Promise<Object>} - Dados da assinatura cancelada
   */
  async cancelarAssinatura(subscriptionId) {
    try {
      const response = await this.axios.delete(`/subscriptions/${subscriptionId}`);
      // Assinatura ASAAS cancelada
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao cancelar assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao cancelar assinatura no Asaas: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Processar webhook de pagamento
   * @param {Object} webhookData - Dados do webhook
   * @returns {Promise<boolean>} - Sucesso do processamento
   */
  async processarWebhookPagamento(webhookData) {
    try {
      const { payment, event } = webhookData;
      
      if (!payment || !payment.id) {
        throw new Error('Dados de pagamento inválidos no webhook');
      }

      // Verificar se já foi processado (idempotência)
      const jaProcessado = await PaymentLog.jaProcessado(payment.id);
      if (jaProcessado) {
        // Pagamento já processado
        return true;
      }

      // Buscar dados completos do pagamento na API
      const pagamentoCompleto = await this.buscarPagamento(payment.id);
      
      // Buscar loja pelo asaasCustomerId
      const loja = await Store.findOne({ 'subscription.asaasCustomerId': pagamentoCompleto.customer });
      if (!loja) {
        throw new Error(`Loja não encontrada para customer ${pagamentoCompleto.customer}`);
      }

      // Criar log do pagamento
      const paymentLog = new PaymentLog({
        paymentId: payment.id,
        evento: event,
        status: pagamentoCompleto.status,
        lojaId: loja._id,
        asaasCustomerId: pagamentoCompleto.customer,
        asaasSubscriptionId: pagamentoCompleto.subscription,
        value: pagamentoCompleto.value,
        netValue: pagamentoCompleto.netValue,
        originalValue: pagamentoCompleto.originalValue,
        description: pagamentoCompleto.description,
        billingType: pagamentoCompleto.billingType,
        dueDate: pagamentoCompleto.dueDate ? new Date(pagamentoCompleto.dueDate) : null,
        paymentDate: pagamentoCompleto.paymentDate ? new Date(pagamentoCompleto.paymentDate) : null,
        clientPaymentDate: pagamentoCompleto.clientPaymentDate ? new Date(pagamentoCompleto.clientPaymentDate) : null,
        received: pagamentoCompleto.status === 'RECEIVED' || pagamentoCompleto.status === 'CONFIRMED',
        webhookData: webhookData
      });

      await paymentLog.save();

      // Processar apenas pagamentos confirmados ou recebidos
      if (pagamentoCompleto.status === 'RECEIVED' || pagamentoCompleto.status === 'CONFIRMED') {
        await this.renovarPlanoLoja(loja, pagamentoCompleto);
        await paymentLog.marcarComoProcessado();
        // Plano da loja renovado com sucesso
      }

      return true;
    } catch (error) {
      console.error('[ASAAS] Erro ao processar webhook:', error.message);
      
      // Tentar salvar o erro no log se possível
      if (webhookData.payment?.id) {
        try {
          const existingLog = await PaymentLog.findOne({ paymentId: webhookData.payment.id });
          if (existingLog) {
            await existingLog.incrementarTentativas(error.message);
          }
        } catch (logError) {
          console.error('[ASAAS] Erro ao salvar log de erro:', logError.message);
        }
      }
      
      throw error;
    }
  }

  /**
   * Renovar plano da loja
   * @param {Object} loja - Dados da loja
   * @param {Object} pagamento - Dados do pagamento
   * @returns {Promise<void>}
   */
  async renovarPlanoLoja(loja, pagamento) {
    try {
      const agora = new Date();
      let novaValidadePlano;

      // Calcular nova data de validade baseada no ciclo
      if (loja.subscription.ciclo === 'mensal') {
        novaValidadePlano = new Date(agora.getFullYear(), agora.getMonth() + 1, agora.getDate());
      } else if (loja.subscription.ciclo === 'anual') {
        novaValidadePlano = new Date(agora.getFullYear() + 1, agora.getMonth(), agora.getDate());
      } else {
        throw new Error(`Ciclo de assinatura inválido: ${loja.subscription.ciclo}`);
      }

      // Atualizar loja
      await Store.findByIdAndUpdate(loja._id, {
        'subscription.status': 'active',
        'subscription.validadePlano': novaValidadePlano,
        'subscription.endDate': novaValidadePlano,
        updatedAt: agora
      });

      // Plano da loja renovado
    } catch (error) {
      console.error('[ASAAS] Erro ao renovar plano da loja:', error.message);
      throw error;
    }
  }

  /**
   * Listar pagamentos de uma assinatura
   * @param {string} subscriptionId - ID da assinatura
   * @param {Object} filters - Filtros opcionais
   * @returns {Promise<Object>} - Lista de pagamentos
   */
  async listarPagamentosAssinatura(subscriptionId, filters = {}) {
    try {
      const params = {
        subscription: subscriptionId,
        ...filters
      };

      const response = await this.axios.get('/payments', { params });
      return response.data;
    } catch (error) {
      console.error('[ASAAS] Erro ao listar pagamentos da assinatura:', error.response?.data || error.message);
      throw new Error(`Erro ao listar pagamentos da assinatura: ${error.response?.data?.errors?.[0]?.description || error.message}`);
    }
  }

  /**
   * Obter estatísticas de pagamentos para o dashboard
   * @param {string} lojaId - ID da loja
   * @returns {Promise<Object>} - Estatísticas
   */
  async obterEstatisticasPagamentos(lojaId) {
    try {
      const loja = await Store.findById(lojaId);
      if (!loja || !loja.subscription.asaasSubscriptionId) {
        throw new Error('Loja não encontrada ou sem assinatura ativa');
      }

      // Buscar pagamentos dos últimos 12 meses
      const dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 12);

      const pagamentos = await this.listarPagamentosAssinatura(loja.subscription.asaasSubscriptionId, {
        dateCreated: `[gte]${dataInicio.toISOString().split('T')[0]}`
      });

      // Calcular estatísticas
      const totalPagamentos = pagamentos.totalCount || 0;
      const pagamentosRecebidos = pagamentos.data?.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED').length || 0;
      const valorTotal = pagamentos.data?.reduce((sum, p) => sum + (p.value || 0), 0) || 0;
      const valorRecebido = pagamentos.data?.filter(p => p.status === 'RECEIVED' || p.status === 'CONFIRMED')
        .reduce((sum, p) => sum + (p.value || 0), 0) || 0;

      return {
        totalPagamentos,
        pagamentosRecebidos,
        valorTotal,
        valorRecebido,
        taxaSucesso: totalPagamentos > 0 ? (pagamentosRecebidos / totalPagamentos * 100).toFixed(2) : 0,
        proximoVencimento: loja.subscription.validadePlano,
        statusAssinatura: loja.subscription.status
      };
    } catch (error) {
      console.error('[ASAAS] Erro ao obter estatísticas:', error.message);
      throw error;
    }
  }
}

export default new AsaasService();