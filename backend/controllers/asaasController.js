import asaasService from '../services/asaasService.js';
import Store from '../models/storeModel.js';
import PaymentLog from '../models/paymentLogModel.js';
import User from '../models/userModel.js';

/**
 * Criar cliente e assinatura no Asaas para uma nova loja
 */
export const criarAssinaturaLoja = async (req, res) => {
  try {
    const { lojaId, plano, ciclo, billingType } = req.body;

    // Validar dados obrigatórios
    if (!lojaId || !plano || !ciclo) {
      return res.status(400).json({
        success: false,
        message: 'lojaId, plano e ciclo são obrigatórios'
      });
    }

    // Buscar loja com dados do owner
    const loja = await Store.findById(lojaId).populate('owner');
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Verificar se já tem assinatura ativa
    if (loja.subscription.asaasCustomerId) {
      return res.status(400).json({
        success: false,
        message: 'Loja já possui assinatura ativa no Asaas'
      });
    }

    // Criar cliente no Asaas
    const cliente = await asaasService.criarCliente(loja);
    
    // Criar assinatura no Asaas
    const assinatura = await asaasService.criarAssinatura(cliente.id, {
      plano,
      ciclo,
      billingType: billingType || 'PIX'
    });

    // Atualizar loja com dados do Asaas
    await Store.findByIdAndUpdate(lojaId, {
      'subscription.asaasCustomerId': cliente.id,
      'subscription.asaasSubscriptionId': assinatura.id,
      'subscription.plan': plano,
      'subscription.ciclo': ciclo,
      'subscription.paymentMethod': billingType || 'PIX',
      'subscription.status': 'active',
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Assinatura criada com sucesso',
      data: {
        customerId: cliente.id,
        subscriptionId: assinatura.id,
        nextDueDate: assinatura.nextDueDate,
        value: assinatura.value
      }
    });
  } catch (error) {
    console.error('Erro ao criar assinatura:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Cancelar assinatura de uma loja
 */
export const cancelarAssinaturaLoja = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const loja = await Store.findById(lojaId);
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    if (!loja.subscription.asaasSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Loja não possui assinatura ativa'
      });
    }

    // Cancelar assinatura no Asaas
    await asaasService.cancelarAssinatura(loja.subscription.asaasSubscriptionId);

    // Atualizar status da loja
    await Store.findByIdAndUpdate(lojaId, {
      'subscription.status': 'cancelled',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Buscar detalhes da assinatura de uma loja
 */
export const obterDetalhesAssinatura = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const loja = await Store.findById(lojaId);
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    if (!loja.subscription.asaasSubscriptionId) {
      return res.status(404).json({
        success: false,
        message: 'Loja não possui assinatura ativa'
      });
    }

    // Buscar dados da assinatura no Asaas
    const assinatura = await asaasService.buscarAssinatura(loja.subscription.asaasSubscriptionId);
    
    // Buscar estatísticas de pagamentos
    const estatisticas = await asaasService.obterEstatisticasPagamentos(lojaId);

    res.json({
      success: true,
      data: {
        subscription: assinatura,
        statistics: estatisticas,
        localData: {
          plan: loja.subscription.plan,
          ciclo: loja.subscription.ciclo,
          status: loja.subscription.status,
          validadePlano: loja.subscription.validadePlano
        }
      }
    });
  } catch (error) {
    console.error('Erro ao obter detalhes da assinatura:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar histórico de pagamentos de uma loja
 */
export const listarHistoricoPagamentos = async (req, res) => {
  try {
    const { lojaId } = req.params;
    const { page = 1, limit = 20, status } = req.query;

    const loja = await Store.findById(lojaId);
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    // Construir filtros
    const filtros = { lojaId };
    if (status) {
      filtros.status = status;
    }

    // Buscar pagamentos com paginação
    const skip = (page - 1) * limit;
    const pagamentos = await PaymentLog.find(filtros)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('lojaId', 'name slug');

    const total = await PaymentLog.countDocuments(filtros);

    res.json({
      success: true,
      data: {
        pagamentos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar histórico de pagamentos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Webhook para receber notificações do Asaas
 */
export const webhookAsaas = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Webhook recebido

    // Validar estrutura básica do webhook
    if (!webhookData.event || !webhookData.payment) {
      console.error('[WEBHOOK] Estrutura inválida:', webhookData);
      return res.status(400).json({
        success: false,
        message: 'Estrutura de webhook inválida'
      });
    }

    // Processar webhook de pagamento
    const sucesso = await asaasService.processarWebhookPagamento(webhookData);
    
    if (sucesso) {
      res.status(200).json({
        success: true,
        message: 'Webhook processado com sucesso'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Erro ao processar webhook'
      });
    }
  } catch (error) {
    console.error('[WEBHOOK] Erro ao processar:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Dashboard do Super Admin - Listar todas as assinaturas
 */
export const dashboardSuperAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, plano } = req.query;

    // Construir filtros
    const filtros = {};
    if (status) {
      filtros['subscription.status'] = status;
    }
    if (plano) {
      filtros['subscription.plan'] = plano;
    }

    // Buscar lojas com paginação
    const skip = (page - 1) * limit;
    const lojas = await Store.find(filtros)
      .populate('owner', 'name email phone')
      .sort({ 'subscription.validadePlano': 1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('name slug subscription owner createdAt updatedAt');

    const total = await Store.countDocuments(filtros);

    // Calcular estatísticas gerais
    const estatisticasGerais = await Store.aggregate([
      {
        $group: {
          _id: null,
          totalLojas: { $sum: 1 },
          lojasAtivas: {
            $sum: {
              $cond: [{ $eq: ['$subscription.status', 'active'] }, 1, 0]
            }
          },
          lojasExpiradas: {
            $sum: {
              $cond: [{ $eq: ['$subscription.status', 'expired'] }, 1, 0]
            }
          },
          lojasCanceladas: {
            $sum: {
              $cond: [{ $eq: ['$subscription.status', 'cancelled'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Próximos vencimentos (próximos 7 dias)
    const proximaData = new Date();
    proximaData.setDate(proximaData.getDate() + 7);
    
    const proximosVencimentos = await Store.find({
      'subscription.validadePlano': {
        $gte: new Date(),
        $lte: proximaData
      },
      'subscription.status': 'active'
    })
    .populate('owner', 'name email')
    .select('name subscription owner')
    .sort({ 'subscription.validadePlano': 1 })
    .limit(10);

    res.json({
      success: true,
      data: {
        lojas,
        estatisticas: estatisticasGerais[0] || {
          totalLojas: 0,
          lojasAtivas: 0,
          lojasExpiradas: 0,
          lojasCanceladas: 0
        },
        proximosVencimentos,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro no dashboard super admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Listar logs de pagamentos para o Super Admin
 */
export const listarLogsPagamentos = async (req, res) => {
  try {
    const { page = 1, limit = 50, lojaId, status, evento } = req.query;

    // Construir filtros
    const filtros = {};
    if (lojaId) {
      filtros.lojaId = lojaId;
    }
    if (status) {
      filtros.status = status;
    }
    if (evento) {
      filtros.evento = evento;
    }

    // Buscar logs com paginação
    const skip = (page - 1) * limit;
    const logs = await PaymentLog.find(filtros)
      .populate('lojaId', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await PaymentLog.countDocuments(filtros);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Erro ao listar logs de pagamentos:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Reprocessar pagamento manualmente (Super Admin)
 */
export const reprocessarPagamento = async (req, res) => {
  try {
    const { paymentId } = req.params;

    // Buscar log do pagamento
    const paymentLog = await PaymentLog.findOne({ paymentId });
    if (!paymentLog) {
      return res.status(404).json({
        success: false,
        message: 'Log de pagamento não encontrado'
      });
    }

    // Reprocessar webhook
    const sucesso = await asaasService.processarWebhookPagamento(paymentLog.webhookData);
    
    res.json({
      success: sucesso,
      message: sucesso ? 'Pagamento reprocessado com sucesso' : 'Erro ao reprocessar pagamento'
    });
  } catch (error) {
    console.error('Erro ao reprocessar pagamento:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Sincronizar dados com Asaas (Super Admin)
 */
export const sincronizarAsaas = async (req, res) => {
  try {
    const { lojaId } = req.params;

    const loja = await Store.findById(lojaId);
    if (!loja) {
      return res.status(404).json({
        success: false,
        message: 'Loja não encontrada'
      });
    }

    if (!loja.subscription.asaasSubscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Loja não possui assinatura no Asaas'
      });
    }

    // Buscar dados atualizados no Asaas
    const assinatura = await asaasService.buscarAssinatura(loja.subscription.asaasSubscriptionId);
    
    // Atualizar dados locais
    await Store.findByIdAndUpdate(lojaId, {
      'subscription.status': assinatura.status === 'ACTIVE' ? 'active' : 'expired',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Dados sincronizados com sucesso',
      data: assinatura
    });
  } catch (error) {
    console.error('Erro ao sincronizar com Asaas:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

export default {
  criarAssinaturaLoja,
  cancelarAssinaturaLoja,
  obterDetalhesAssinatura,
  listarHistoricoPagamentos,
  webhookAsaas,
  dashboardSuperAdmin,
  listarLogsPagamentos,
  reprocessarPagamento,
  sincronizarAsaas
};