import AuditLog from '../models/auditLogModel.js';
import logger from '../utils/logger.js';

/**
 * Middleware para capturar e registrar ações de auditoria automaticamente
 */
class AuditLogger {
  constructor() {
    this.actionMappings = {
      // Mapeamento de rotas para ações de auditoria
      'POST /api/food': { action: 'PRODUCT_CREATED', category: 'PRODUCT' },
      'PUT /api/food': { action: 'PRODUCT_UPDATED', category: 'PRODUCT' },
      'DELETE /api/food': { action: 'PRODUCT_DELETED', category: 'PRODUCT' },
      
      'POST /api/category': { action: 'CATEGORY_CREATED', category: 'CATEGORY' },
      'PUT /api/category': { action: 'CATEGORY_UPDATED', category: 'CATEGORY' },
      'DELETE /api/category': { action: 'CATEGORY_DELETED', category: 'CATEGORY' },
      
      'POST /api/banner': { action: 'BANNER_CREATED', category: 'BANNER' },
      'PUT /api/banner': { action: 'BANNER_UPDATED', category: 'BANNER' },
      'DELETE /api/banner': { action: 'BANNER_DELETED', category: 'BANNER' },
      
      'POST /api/order': { action: 'ORDER_CREATED', category: 'ORDER' },
      'PUT /api/order': { action: 'ORDER_UPDATED', category: 'ORDER' },
      
      'POST /api/user': { action: 'USER_CREATED', category: 'USER' },
      'PUT /api/user': { action: 'USER_UPDATED', category: 'USER' },
      'DELETE /api/user': { action: 'USER_DELETED', category: 'USER' },
      
      'POST /api/user/login': { action: 'LOGIN', category: 'AUTH' },
      'POST /api/user/logout': { action: 'LOGOUT', category: 'AUTH' },
      
      'PUT /api/settings': { action: 'STORE_SETTINGS_UPDATED', category: 'STORE' },
      
      // Rotas do sistema para Super Admin
      'GET /api/system/stats': { action: 'SYSTEM_STATS_ACCESSED', category: 'SYSTEM' },
      'POST /api/system/super-admin/login': { action: 'LOGIN', category: 'AUTH' },
      'GET /api/system/audit/stats': { action: 'AUDIT_STATS_ACCESSED', category: 'AUDIT' },
      'GET /api/system/users/:param/audit': { action: 'AUDIT_LOG_ACCESSED', category: 'AUDIT' },
      'GET /api/system/stores/:param/audit': { action: 'AUDIT_LOG_ACCESSED', category: 'AUDIT' }
    };
  }

  /**
   * Middleware principal de auditoria
   */
  auditMiddleware = (req, res, next) => {
    // Debug: Log da requisição
    console.log('🔍 AUDIT DEBUG:', {
      method: req.method,
      originalUrl: req.originalUrl,
      path: req.path,
      route: req.route?.path,
      user: req.user ? { id: req.user._id, role: req.user.role } : 'NO USER',
      storeContext: req.storeContext || 'NO STORE CONTEXT'
    });
    
    // Capturar dados originais da resposta
    const originalSend = res.send;
    const originalJson = res.json;
    
    let responseData = null;
    let statusCode = 200;
    
    // Interceptar resposta
    res.send = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      responseData = data;
      statusCode = res.statusCode;
      return originalJson.call(this, data);
    };
    
    // Capturar dados da requisição
    req.auditData = {
      originalBody: req.body ? JSON.parse(JSON.stringify(req.body)) : null,
      timestamp: new Date(),
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      method: req.method,
      endpoint: req.originalUrl || req.url
    };
    
    // Interceptar fim da resposta para criar log
    res.on('finish', async () => {
      try {
        await this.createAuditLog(req, res, responseData, statusCode);
      } catch (error) {
        logger.error('Erro ao criar log de auditoria:', error);
      }
    });
    
    next();
  };

  /**
   * Criar log de auditoria baseado na requisição
   */
  async createAuditLog(req, res, responseData, statusCode) {
    try {
      // Usar a URL completa em vez de req.route?.path
      const fullPath = req.originalUrl || req.url;
      const routeKey = `${req.method} ${this.normalizeRoute(fullPath)}`;
      const actionMapping = this.actionMappings[routeKey];
      
      console.log('🔍 AUDIT CREATE LOG DEBUG:', {
        fullPath,
        routeKey,
        actionMapping,
        availableKeys: Object.keys(this.actionMappings)
      });
      
      if (!actionMapping) {
        console.log('❌ Rota não mapeada para auditoria:', routeKey);
        return; // Não auditar rotas não mapeadas
      }
      
      // Verificar contexto de usuário (obrigatório)
      const userId = req.user?._id || req.user?.id;
      if (!userId) {
        console.log('❌ Sem usuário para auditoria');
        return; // Não auditar sem usuário
      }
      
      // Contexto de loja (opcional para Super Admins)
      const storeId = req.storeContext?.storeId || req.store?._id || null;
      
      // Para Super Admins, permitir auditoria mesmo sem contexto de loja
      const isSuperAdmin = req.user?.role === 'superadmin' || req.user?.isSuperAdmin;
      if (!storeId && !isSuperAdmin) {
        console.log('❌ Sem contexto de loja e não é super admin');
        return; // Não auditar usuários normais sem contexto de loja
      }
      
      console.log('✅ Criando log de auditoria:', {
        userId,
        storeId,
        action: actionMapping.action,
        isSuperAdmin
      });
      
      // Determinar severidade baseada no status code
      let severity = 'LOW';
      if (statusCode >= 400 && statusCode < 500) {
        severity = 'MEDIUM';
      } else if (statusCode >= 500) {
        severity = 'HIGH';
      }
      
      // Extrair dados relevantes
      const resourceId = this.extractResourceId(req, responseData);
      const resourceType = this.extractResourceType(actionMapping.category);
      
      // Criar detalhes da ação
      const details = this.createActionDetails(req, actionMapping.action, statusCode);
      
      // Dados antes e depois (para operações de atualização)
      let previousData = null;
      let newData = null;
      
      if (req.method === 'PUT' || req.method === 'PATCH') {
        previousData = req.auditData?.previousData || null;
        newData = req.body;
      } else if (req.method === 'POST') {
        newData = req.body;
      }
      
      // Criar log de auditoria
      await AuditLog.createLog({
        storeId: storeId || null, // Permitir null para Super Admins
        userId,
        action: actionMapping.action,
        category: actionMapping.category,
        details,
        previousData,
        newData,
        resourceId,
        resourceType,
        requestInfo: {
          ip: req.auditData.ip || req.ip || req.connection?.remoteAddress || 'unknown',
          userAgent: req.auditData.userAgent || req.get('User-Agent') || 'unknown',
          method: req.method,
          endpoint: req.auditData.endpoint || req.originalUrl || req.url || 'unknown',
          statusCode
        },
        severity,
        tags: this.generateTags(req, actionMapping),
        metadata: {
          responseTime: req.auditData?.timestamp ? Date.now() - req.auditData.timestamp.getTime() : 0,
          fileUploaded: req.file ? req.file.filename : null,
          queryParams: req.query,
          userRole: req.user?.role
        }
      });
      
    } catch (error) {
      logger.error('Erro interno ao criar log de auditoria:', error);
    }
  }

  /**
   * Normalizar rota para mapeamento
   */
  normalizeRoute(path) {
    if (!path) return '';
    
    console.log('🔧 NORMALIZING ROUTE:', path);
    
    // Remover query parameters se existirem
    const cleanPath = path.split('?')[0];
    
    // Apenas substituir parâmetros dinâmicos, preservando toda a estrutura da URL
    const normalized = cleanPath
      .replace(/\/[0-9a-fA-F]{24}/g, '/:param') // MongoDB ObjectIds
      .replace(/\/\d+/g, '/:param') // IDs numéricos
      .replace(/:[\w]+/g, ':param'); // Parâmetros nomeados como :userId, :storeId
    
    console.log('🔧 NORMALIZED TO:', normalized);
    return normalized;
  }

  /**
   * Extrair ID do recurso afetado
   */
  extractResourceId(req, responseData) {
    // Tentar extrair da URL
    const urlParts = req.originalUrl.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    
    // Verificar se é um ObjectId válido
    if (/^[a-f\d]{24}$/i.test(lastPart)) {
      return lastPart;
    }
    
    // Tentar extrair da resposta
    if (responseData && typeof responseData === 'object') {
      const parsed = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      return parsed._id || parsed.id || null;
    }
    
    return null;
  }

  /**
   * Extrair tipo do recurso baseado na categoria
   */
  extractResourceType(category) {
    const typeMapping = {
      'PRODUCT': 'Product',
      'CATEGORY': 'Category',
      'BANNER': 'Banner',
      'ORDER': 'Order',
      'USER': 'User',
      'STORE': 'Store',
      'FILE': 'File',
      'PAYMENT': 'Payment'
    };
    
    return typeMapping[category] || null;
  }

  /**
   * Criar detalhes da ação
   */
  createActionDetails(req, action, statusCode) {
    const userEmail = req.user?.email || 'Usuário desconhecido';
    const storeName = req.storeContext?.storeName || req.store?.name || 'Loja desconhecida';
    
    let details = `${userEmail} executou ${action} na loja ${storeName}`;
    
    if (statusCode >= 400) {
      details += ` (Falhou com status ${statusCode})`;
    }
    
    // Adicionar detalhes específicos baseados na ação
    if (req.file) {
      details += ` - Arquivo: ${req.file.filename}`;
    }
    
    if (req.body?.name) {
      details += ` - Nome: ${req.body.name}`;
    }
    
    return details;
  }

  /**
   * Gerar tags para categorização
   */
  generateTags(req, actionMapping) {
    const tags = [actionMapping.category.toLowerCase()];
    
    if (req.file) {
      tags.push('file-upload');
    }
    
    if (req.user?.role) {
      tags.push(`role-${req.user.role}`);
    }
    
    if (req.method === 'DELETE') {
      tags.push('deletion');
    }
    
    return tags;
  }

  /**
   * Middleware específico para capturar dados antes de operações de atualização
   */
  captureBeforeUpdate = (Model) => {
    return async (req, res, next) => {
      try {
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const resourceId = req.params.id;
          if (resourceId) {
            const existingData = await Model.findById(resourceId);
            if (existingData) {
              req.auditData = req.auditData || {};
              req.auditData.previousData = existingData.toObject();
            }
          }
        }
        next();
      } catch (error) {
        logger.error('Erro ao capturar dados anteriores:', error);
        next();
      }
    };
  };

  /**
   * Middleware para logar tentativas de login falhadas
   */
  logFailedLogin = async (req, res, next) => {
    const originalJson = res.json;
    
    res.json = async function(data) {
      if (res.statusCode === 401 || res.statusCode === 403) {
        try {
          // Tentar identificar a loja mesmo sem autenticação
          const storeId = req.storeContext?.storeId || req.headers['x-store-id'];
          
          if (storeId) {
            await AuditLog.createLog({
              storeId,
              userId: null, // Login falhado, não há usuário
              action: 'LOGIN_FAILED',
              category: 'AUTH',
              details: `Tentativa de login falhada para email: ${req.body?.email || 'não informado'}`,
              requestInfo: {
                ip: req.ip || req.connection.remoteAddress,
                userAgent: req.get('User-Agent'),
                method: req.method,
                endpoint: req.originalUrl,
                statusCode: res.statusCode
              },
              severity: 'MEDIUM',
              tags: ['login-failed', 'security'],
              metadata: {
                attemptedEmail: req.body?.email,
                reason: data?.message || 'Credenciais inválidas'
              }
            });
          }
        } catch (error) {
          logger.error('Erro ao logar tentativa de login falhada:', error);
        }
      }
      
      return originalJson.call(this, data);
    };
    
    next();
  };
}

// Instância singleton
const auditLogger = new AuditLogger();

/**
 * Middleware de auditoria para interceptar requisições
 */
export const auditMiddleware = (req, res, next) => {
  console.log('🔍 AUDIT MIDDLEWARE INTERCEPTED:', {
    method: req.method,
    url: req.url,
    path: req.path,
    route: req.route?.path,
    user: req.user ? { id: req.user._id || req.user.id, role: req.user.role } : null,
    storeContext: req.storeContext || null
  });

  // Interceptar res.send e res.json para capturar dados de resposta
  const originalSend = res.send;
  const originalJson = res.json;
  
  res.send = function(data) {
    console.log('📤 RESPONSE SEND INTERCEPTED:', {
      statusCode: res.statusCode,
      hasData: !!data
    });
    req.auditData = { responseData: data, statusCode: res.statusCode };
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    console.log('📤 RESPONSE JSON INTERCEPTED:', {
      statusCode: res.statusCode,
      hasData: !!data
    });
    req.auditData = { responseData: data, statusCode: res.statusCode };
    return originalJson.call(this, data);
  };
  
  // Interceptar evento de finalização da resposta
  res.on('finish', async () => {
    console.log('🏁 RESPONSE FINISHED:', {
      statusCode: res.statusCode,
      hasAuditData: !!req.auditData
    });
    
    if (req.auditData) {
      try {
        await auditLogger.createAuditLog(req, res, req.auditData.responseData, req.auditData.statusCode);
      } catch (error) {
        console.error('❌ Erro ao criar log de auditoria:', error);
      }
    }
  });
  
  next();
};

export const captureBeforeUpdate = auditLogger.captureBeforeUpdate;
export const logFailedLogin = auditLogger.logFailedLogin;

// Exportar classe para uso direto
export default auditLogger;