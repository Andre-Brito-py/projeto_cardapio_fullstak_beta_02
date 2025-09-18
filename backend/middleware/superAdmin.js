import User from '../models/userModel.js';

/**
 * Middleware para verificar se o usuário é Super Admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const isSuperAdmin = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    // Se o role já está no token, usar diretamente para otimização
    if (req.user.role === 'super_admin') {
      req.superAdmin = req.user;
      return next();
    }

    // Buscar dados completos do usuário se o role não estiver no token
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se é Super Admin
    if (user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Super Admins podem acessar este recurso.'
      });
    }

    // Adicionar dados do usuário ao request para uso posterior
    req.superAdmin = user;
    next();
  } catch (error) {
    console.error('Erro no middleware Super Admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar se o usuário é Admin ou Super Admin
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const isAdminOrSuperAdmin = async (req, res, next) => {
  try {
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    // Buscar dados completos do usuário
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Verificar se é Admin ou Super Admin
    if (user.role !== 'store_admin' && user.role !== 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Apenas Admins podem acessar este recurso.'
      });
    }

    // Adicionar dados do usuário ao request para uso posterior
    req.admin = user;
    next();
  } catch (error) {
    console.error('Erro no middleware Admin:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

/**
 * Middleware para verificar se o usuário pode acessar dados de uma loja específica
 * Super Admin: pode acessar qualquer loja
 * Admin: pode acessar apenas sua própria loja
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
export const canAccessStore = async (req, res, next) => {
  try {
    const { lojaId } = req.params;
    
    // Verificar se o usuário está autenticado
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticação necessário'
      });
    }

    // Buscar dados completos do usuário
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Super Admin pode acessar qualquer loja
    if (user.role === 'super_admin') {
      req.admin = user;
      return next();
    }

    // Admin pode acessar apenas sua própria loja
    if (user.role === 'store_admin') {
      // Verificar se a loja pertence ao usuário
      const Store = (await import('../models/storeModel.js')).default;
      const loja = await Store.findOne({ _id: lojaId, owner: user._id });
      
      if (!loja) {
        return res.status(403).json({
          success: false,
          message: 'Acesso negado. Você só pode acessar sua própria loja.'
        });
      }
      
      req.admin = user;
      req.store = loja;
      return next();
    }

    // Outros roles não têm acesso
    return res.status(403).json({
      success: false,
      message: 'Acesso negado. Permissões insuficientes.'
    });
  } catch (error) {
    console.error('Erro no middleware canAccessStore:', error.message);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
};

export default {
  isSuperAdmin,
  isAdminOrSuperAdmin,
  canAccessStore
};