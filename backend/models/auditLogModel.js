import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  // Identificação da loja (multi-tenancy) - opcional para Super Admins
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
    required: false, // Permitir null para Super Admins
    index: true
  },
  
  // Usuário que executou a ação
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Informações da ação
  action: {
    type: String,
    required: true,
    enum: [
      // Autenticação
      'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_RESET', 'PASSWORD_CHANGED',
      
      // Gestão de produtos
      'PRODUCT_CREATED', 'PRODUCT_UPDATED', 'PRODUCT_DELETED', 'PRODUCT_STATUS_CHANGED',
      
      // Gestão de categorias
      'CATEGORY_CREATED', 'CATEGORY_UPDATED', 'CATEGORY_DELETED', 'CATEGORY_STATUS_CHANGED',
      
      // Gestão de banners
      'BANNER_CREATED', 'BANNER_UPDATED', 'BANNER_DELETED', 'BANNER_STATUS_CHANGED',
      
      // Gestão de pedidos
      'ORDER_CREATED', 'ORDER_UPDATED', 'ORDER_STATUS_CHANGED', 'ORDER_CANCELLED',
      
      // Gestão de usuários
      'USER_CREATED', 'USER_UPDATED', 'USER_DELETED', 'USER_STATUS_CHANGED', 'USER_PERMISSIONS_CHANGED',
      
      // Configurações da loja
      'STORE_SETTINGS_UPDATED', 'STORE_STATUS_CHANGED', 'STORE_CONFIG_CHANGED',
      
      // Uploads e arquivos
      'FILE_UPLOADED', 'FILE_DELETED', 'FILE_ACCESS_DENIED',
      
      // Pagamentos
      'PAYMENT_PROCESSED', 'PAYMENT_FAILED', 'PAYMENT_REFUNDED',
      
      // Sistema
      'SYSTEM_ERROR', 'SECURITY_VIOLATION', 'DATA_EXPORT', 'DATA_IMPORT', 'SYSTEM_STATS_ACCESSED',
      
      // Auditoria
      'AUDIT_STATS_ACCESSED', 'AUDIT_LOG_CREATED', 'AUDIT_LOG_ACCESSED'
    ]
  },
  
  // Categoria da ação para filtragem
  category: {
    type: String,
    required: true,
    enum: ['AUTH', 'PRODUCT', 'CATEGORY', 'BANNER', 'ORDER', 'USER', 'STORE', 'FILE', 'PAYMENT', 'SYSTEM', 'AUDIT'],
    index: true
  },
  
  // Detalhes da ação
  details: {
    type: String,
    required: true
  },
  
  // Dados antes da alteração (para rollback)
  previousData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // Dados após a alteração
  newData: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  
  // ID do recurso afetado
  resourceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true
  },
  
  // Tipo do recurso afetado
  resourceType: {
    type: String,
    enum: ['Product', 'Category', 'Banner', 'Order', 'User', 'Store', 'File', 'Payment'],
    default: null
  },
  
  // Informações da requisição
  requestInfo: {
    ip: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: null
    },
    method: {
      type: String,
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      required: true
    },
    endpoint: {
      type: String,
      required: true
    },
    statusCode: {
      type: Number,
      default: 200
    }
  },
  
  // Nível de severidade
  severity: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
    default: 'LOW',
    index: true
  },
  
  // Tags para categorização adicional
  tags: [{
    type: String,
    index: true
  }],
  
  // Metadados adicionais
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true,
  collection: 'audit_logs'
});

// Índices compostos para otimização de consultas
auditLogSchema.index({ storeId: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ storeId: 1, category: 1, createdAt: -1 });
auditLogSchema.index({ storeId: 1, action: 1, createdAt: -1 });
auditLogSchema.index({ storeId: 1, severity: 1, createdAt: -1 });
auditLogSchema.index({ resourceId: 1, resourceType: 1 });

// Método estático para criar log de auditoria
auditLogSchema.statics.createLog = async function({
  storeId,
  userId,
  action,
  category,
  details,
  previousData = null,
  newData = null,
  resourceId = null,
  resourceType = null,
  requestInfo,
  severity = 'LOW',
  tags = [],
  metadata = {}
}) {
  try {
    const auditLog = new this({
      storeId,
      userId,
      action,
      category,
      details,
      previousData,
      newData,
      resourceId,
      resourceType,
      requestInfo,
      severity,
      tags,
      metadata
    });
    
    return await auditLog.save();
  } catch (error) {
    console.error('Erro ao criar log de auditoria:', error);
    throw error;
  }
};

// Método estático para buscar logs por loja
auditLogSchema.statics.findByStore = function(storeId, options = {}) {
  const {
    page = 1,
    limit = 50,
    category = null,
    action = null,
    userId = null,
    severity = null,
    startDate = null,
    endDate = null,
    tags = []
  } = options;
  
  const query = { storeId };
  
  if (category) query.category = category;
  if (action) query.action = action;
  if (userId) query.userId = userId;
  if (severity) query.severity = severity;
  if (tags.length > 0) query.tags = { $in: tags };
  
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .populate('userId', 'name email role')
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);
};

// Método estático para estatísticas de auditoria
auditLogSchema.statics.getStats = async function(storeId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const stats = await this.aggregate([
    {
      $match: {
        storeId: new mongoose.Types.ObjectId(storeId),
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          category: '$category',
          severity: '$severity'
        },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.category',
        severityStats: {
          $push: {
            severity: '$_id.severity',
            count: '$count'
          }
        },
        totalCount: { $sum: '$count' }
      }
    }
  ]);
  
  return stats;
};

// TTL para logs antigos (opcional - manter logs por 2 anos)
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 63072000 }); // 2 anos

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;