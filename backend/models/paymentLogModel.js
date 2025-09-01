import mongoose from 'mongoose';

const paymentLogSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  evento: {
    type: String,
    required: true,
    enum: [
      'PAYMENT_CREATED',
      'PAYMENT_AWAITING_PAYMENT',
      'PAYMENT_RECEIVED',
      'PAYMENT_CONFIRMED',
      'PAYMENT_OVERDUE',
      'PAYMENT_DELETED',
      'PAYMENT_RESTORED',
      'PAYMENT_REFUNDED',
      'PAYMENT_RECEIVED_IN_CASH_UNDONE',
      'PAYMENT_CHARGEBACK_REQUESTED',
      'PAYMENT_CHARGEBACK_DISPUTE',
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL',
      'PAYMENT_DUNNING_RECEIVED',
      'PAYMENT_DUNNING_REQUESTED',
      'PAYMENT_BANK_SLIP_VIEWED',
      'PAYMENT_CHECKOUT_VIEWED'
    ]
  },
  status: {
    type: String,
    required: true,
    enum: [
      'PENDING',
      'AWAITING_PAYMENT',
      'RECEIVED',
      'CONFIRMED',
      'OVERDUE',
      'REFUNDED',
      'RECEIVED_IN_CASH',
      'REFUND_REQUESTED',
      'REFUND_IN_PROGRESS',
      'CHARGEBACK_REQUESTED',
      'CHARGEBACK_DISPUTE',
      'AWAITING_CHARGEBACK_REVERSAL',
      'DUNNING_REQUESTED',
      'DUNNING_RECEIVED',
      'AWAITING_RISK_ANALYSIS'
    ]
  },
  lojaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: true,
    index: true
  },
  asaasCustomerId: {
    type: String,
    required: true
  },
  asaasSubscriptionId: {
    type: String
  },
  value: {
    type: Number
  },
  netValue: {
    type: Number
  },
  originalValue: {
    type: Number
  },
  interestValue: {
    type: Number
  },
  description: {
    type: String
  },
  billingType: {
    type: String,
    enum: ['BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'TRANSFER', 'DEPOSIT', 'PIX', 'UNDEFINED']
  },
  pixTransaction: {
    endToEndId: String,
    txId: String,
    paidOutsideAsaas: Boolean
  },
  creditCard: {
    creditCardNumber: String,
    creditCardBrand: String,
    creditCardToken: String
  },
  installment: {
    type: String
  },
  transactionReceiptUrl: {
    type: String
  },
  nossoNumero: {
    type: String
  },
  invoiceUrl: {
    type: String
  },
  bankSlipUrl: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  externalReference: {
    type: String
  },
  dueDate: {
    type: Date
  },
  originalDueDate: {
    type: Date
  },
  paymentDate: {
    type: Date
  },
  clientPaymentDate: {
    type: Date
  },
  installmentNumber: {
    type: Number
  },
  installmentCount: {
    type: Number
  },
  deleted: {
    type: Boolean,
    default: false
  },
  anticipated: {
    type: Boolean,
    default: false
  },
  anticipable: {
    type: Boolean,
    default: false
  },
  creditDate: {
    type: Date
  },
  estimatedCreditDate: {
    type: Date
  },
  transactionReceiptEmail: {
    type: String
  },
  transactionReceiptSmsPhoneNumber: {
    type: String
  },
  received: {
    type: Boolean,
    default: false
  },
  billingTypeText: {
    type: String
  },
  statusText: {
    type: String
  },
  // Campos de controle interno
  processado: {
    type: Boolean,
    default: false
  },
  processadoEm: {
    type: Date
  },
  tentativasProcessamento: {
    type: Number,
    default: 0
  },
  ultimaTentativa: {
    type: Date
  },
  erroProcessamento: {
    type: String
  },
  webhookData: {
    type: mongoose.Schema.Types.Mixed // Dados completos do webhook
  }
}, {
  timestamps: true,
  collection: 'pagamentos_log'
});

// Índices para otimização
paymentLogSchema.index({ lojaId: 1, paymentId: 1 });
paymentLogSchema.index({ asaasCustomerId: 1 });
paymentLogSchema.index({ asaasSubscriptionId: 1 });
paymentLogSchema.index({ evento: 1, status: 1 });
paymentLogSchema.index({ processado: 1, processadoEm: 1 });
paymentLogSchema.index({ createdAt: 1 });

// Método para marcar como processado
paymentLogSchema.methods.marcarComoProcessado = function() {
  this.processado = true;
  this.processadoEm = new Date();
  return this.save();
};

// Método para incrementar tentativas de processamento
paymentLogSchema.methods.incrementarTentativas = function(erro = null) {
  this.tentativasProcessamento += 1;
  this.ultimaTentativa = new Date();
  if (erro) {
    this.erroProcessamento = erro;
  }
  return this.save();
};

// Método estático para verificar se já foi processado
paymentLogSchema.statics.jaProcessado = function(paymentId) {
  return this.findOne({ paymentId, processado: true });
};

// Método estático para buscar logs por loja
paymentLogSchema.statics.buscarPorLoja = function(lojaId, limit = 50) {
  return this.find({ lojaId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('lojaId', 'name slug');
};

const PaymentLog = mongoose.model('PaymentLog', paymentLogSchema);

export default PaymentLog;