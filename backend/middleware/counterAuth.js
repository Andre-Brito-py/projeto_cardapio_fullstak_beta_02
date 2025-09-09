import jwt from 'jsonwebtoken';
import CounterAttendant from '../models/counterAttendantModel.js';

const counterAuth = async (req, res, next) => {
    const { token } = req.headers;
    console.log('Token recebido:', token);
    
    if (!token) {
        return res.json({ success: false, message: "Não autorizado. Token não fornecido." });
    }
    
    try {
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', token_decode);
        
        // Buscar o atendente no banco de dados
        const attendant = await CounterAttendant.findById(token_decode.id).populate('storeId');
        console.log('Atendente encontrado:', attendant ? 'Sim' : 'Não');
        
        if (!attendant) {
            return res.json({ success: false, message: "Atendente não encontrado" });
        }
        
        if (!attendant.isActive) {
            return res.json({ success: false, message: "Conta desativada. Entre em contato com o administrador." });
        }
        
        // Adicionar informações do atendente ao request
        req.user = {
            id: attendant._id,
            name: attendant.name,
            email: attendant.email,
            storeId: attendant.storeId._id,
            storeName: attendant.storeId.name,
            permissions: attendant.permissions,
            shift: attendant.shift
        };
        
        req.store = attendant.storeId;
        
        next();
        
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Token inválido" });
    }
};

// Middleware para verificar permissões específicas
const checkPermission = (permission) => {
    return (req, res, next) => {
        if (!req.user || !req.user.permissions || !req.user.permissions[permission]) {
            return res.json({ 
                success: false, 
                message: "Acesso negado. Permissão insuficiente." 
            });
        }
        next();
    };
};

// Middleware para verificar se pode criar pedidos
const canCreateOrders = checkPermission('canCreateOrders');

// Middleware para verificar se pode ver relatórios
const canViewReports = checkPermission('canViewReports');

// Middleware para verificar se pode gerenciar produtos
const canManageProducts = checkPermission('canManageProducts');

export { 
    counterAuth, 
    checkPermission, 
    canCreateOrders, 
    canViewReports, 
    canManageProducts 
};