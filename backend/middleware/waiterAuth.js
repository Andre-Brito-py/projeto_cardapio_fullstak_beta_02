import jwt from 'jsonwebtoken';
import storeModel from '../models/storeModel.js';
import { FRONTEND_URL, getWaiterLink } from '../config/urls.js';

// Middleware para autenticação de garçom
const waiterAuth = async (req, res, next) => {
    try {
        const { authorization } = req.headers;
        
        if (!authorization) {
            return res.status(401).json({ 
                success: false, 
                message: "Token de acesso não fornecido" 
            });
        }

        const token = authorization.replace('Bearer ', '');
        
        try {
            // Verificar se é um token de garçom
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            if (decoded.type !== 'waiter') {
                return res.status(401).json({ 
                    success: false, 
                    message: "Token inválido para garçom" 
                });
            }

            // Verificar se a loja existe e está ativa
            const store = await storeModel.findById(decoded.storeId);
            if (!store || store.status !== 'active') {
                return res.status(401).json({ 
                    success: false, 
                    message: "Loja não encontrada ou inativa" 
                });
            }

            // Adicionar informações do garçom ao request
            req.waiter = {
                storeId: decoded.storeId,
                storeName: store.name,
                token: token
            };
            req.storeId = decoded.storeId;
            req.store = store;

            next();
        } catch (jwtError) {
            return res.status(401).json({ 
                success: false, 
                message: "Token inválido" 
            });
        }
    } catch (error) {
        // Erro no middleware de autenticação do garçom
        return res.status(500).json({ 
            success: false, 
            message: "Erro na autenticação do garçom" 
        });
    }
};

// Função para gerar token de garçom
const generateWaiterToken = (storeId) => {
    return jwt.sign(
        { 
            storeId: storeId,
            type: 'waiter',
            timestamp: Date.now()
        },
        process.env.JWT_SECRET,
        { expiresIn: '30d' } // Token válido por 30 dias
    );
};

// Função para gerar link de acesso do garçom
const generateWaiterLink = (storeId, baseUrl = null) => {
    const token = generateWaiterToken(storeId);
    // Usar a configuração centralizada se baseUrl não for fornecida
    const finalBaseUrl = baseUrl || FRONTEND_URL;
    return getWaiterLink(storeId, token, finalBaseUrl);
};

export { waiterAuth, generateWaiterToken, generateWaiterLink };
export default waiterAuth;