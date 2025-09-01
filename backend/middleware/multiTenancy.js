import Store from '../models/storeModel.js';
import userModel from '../models/userModel.js';
import jwt from 'jsonwebtoken';

// Middleware para identificar a loja baseado no subdomínio ou header
const identifyStore = async (req, res, next) => {
    try {
        let store = null;
        
        // Método 1: Identificar por subdomínio
        const host = req.get('host');
        if (host) {
            const subdomain = host.split('.')[0];
            if (subdomain && subdomain !== 'www' && subdomain !== 'admin' && subdomain !== 'api') {
                store = await Store.findOne({ 'domain.subdomain': subdomain, status: 'active' });
            }
        }
        
        // Método 2: Identificar por header personalizado
        if (!store) {
            const storeId = req.get('X-Store-ID');
            if (storeId) {
                store = await Store.findById(storeId);
            }
        }
        
        // Método 3: Identificar por slug na URL
        if (!store) {
            const storeSlug = req.params.storeSlug || req.query.store;
            if (storeSlug) {
                store = await Store.findOne({ slug: storeSlug, status: 'active' });
            }
        }
        
        // Método 4: Identificar pelo token do usuário (para admins de loja)
        if (!store && req.headers.authorization) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                if (decoded.storeId) {
                    store = await Store.findById(decoded.storeId);
                }
            } catch (error) {
                // Token inválido, continuar sem loja
            }
        }
        
        // Adicionar informações da loja ao request
        req.store = store;
        req.storeId = store?._id;
        
        next();
    } catch (error) {
        // Erro no middleware de identificação de loja
        next();
    }
};

// Middleware para verificar se a loja está ativa
const requireActiveStore = (req, res, next) => {
    if (!req.store) {
        return res.status(404).json({ success: false, message: "Loja não encontrada" });
    }
    
    if (req.store.status !== 'active') {
        return res.status(403).json({ 
            success: false, 
            message: "Loja não está ativa",
            storeStatus: req.store.status
        });
    }
    
    next();
};

// Middleware para verificar assinatura ativa
const requireActiveSubscription = (req, res, next) => {
    if (!req.store) {
        return res.status(404).json({ success: false, message: "Loja não encontrada" });
    }
    
    if (!req.store.isSubscriptionActive()) {
        return res.status(403).json({ 
            success: false, 
            message: "Assinatura expirada ou inativa",
            subscription: req.store.subscription
        });
    }
    
    next();
};

// Middleware para verificar limites do plano
const checkPlanLimits = (type) => {
    return async (req, res, next) => {
        try {
            if (!req.store) {
                return res.status(404).json({ success: false, message: "Loja não encontrada" });
            }
            
            const limits = await req.store.checkPlanLimits(type);
            
            if (!limits.allowed) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Limite do plano atingido para ${type}`,
                    limits
                });
            }
            
            req.planLimits = limits;
            next();
        } catch (error) {
            // Erro ao verificar limites do plano
            res.status(500).json({ success: false, message: "Erro ao verificar limites do plano" });
        }
    };
};

// Middleware de autenticação com suporte a multi-tenancy
const authMultiTenant = async (req, res, next) => {
    try {
        // Verificar headers de autenticação
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            // Token não fornecido
            return res.status(401).json({ success: false, message: "Token não fornecido" });
        }
        
        // Verificando token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const user = await userModel.findById(decoded.id).populate('storeId');
        
        if (!user || !user.isActive) {
            // Usuário não encontrado ou inativo
            return res.status(401).json({ success: false, message: "Usuário não encontrado ou inativo" });
        }
        
        req.user = user;
        
        // Para store admins, verificar se a loja corresponde
        if (user.role === 'store_admin') {
            if (req.store && user.storeId && user.storeId._id.toString() !== req.store._id.toString()) {
                return res.status(403).json({ 
                    success: false, 
                    message: "Usuário não tem acesso a esta loja" 
                });
            }
            
            // Se não há loja identificada, usar a loja do usuário
            if (!req.store && user.storeId) {
                req.store = user.storeId;
                req.storeId = user.storeId._id;
            }
        }
        
        // Autenticação bem-sucedida
        next();
    } catch (error) {
        // Erro na autenticação multi-tenant
        res.status(401).json({ success: false, message: "Token inválido" });
    }
};

// Middleware para verificar role específica
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Usuário não autenticado" });
        }
        
        const userRoles = Array.isArray(roles) ? roles : [roles];
        
        if (!userRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: "Sem permissão para acessar este recurso" 
            });
        }
        
        next();
    };
};

// Middleware para verificar se é super admin
const requireSuperAdmin = requireRole('super_admin');

// Middleware para verificar se é admin de loja
const requireStoreAdmin = requireRole(['super_admin', 'store_admin']);

// Middleware para adicionar contexto da loja às queries do banco
const addStoreContext = (req, res, next) => {
    // Adicionar storeId automaticamente às queries para modelos que suportam multi-tenancy
    if (req.store && req.user && req.user.role !== 'super_admin') {
        req.storeFilter = { storeId: req.store._id };
    }
    
    next();
};

export {
    identifyStore,
    requireActiveStore,
    requireActiveSubscription,
    checkPlanLimits,
    authMultiTenant,
    requireRole,
    requireSuperAdmin,
    requireStoreAdmin,
    addStoreContext
};