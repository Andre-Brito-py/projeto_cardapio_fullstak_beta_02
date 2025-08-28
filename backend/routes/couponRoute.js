import express from 'express';
import authMiddleware from '../middleware/auth.js';
import { 
    createCoupon, 
    listCoupons, 
    getCoupon, 
    updateCoupon, 
    deleteCoupon, 
    validateCoupon, 
    toggleCouponStatus, 
    getCouponStats 
} from '../controllers/couponController.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const couponRouter = express.Router();

// Rotas públicas/para clientes
// Validar cupom (usado no frontend durante o checkout)
couponRouter.post('/validate', identifyStore, validateCoupon);

// Rotas protegidas para administradores de loja
// Criar novo cupom
couponRouter.post('/create', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, createCoupon);

// Listar todos os cupons
couponRouter.get('/list', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, listCoupons);

// Obter cupom específico por ID
couponRouter.get('/:id', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, getCoupon);

// Atualizar cupom
couponRouter.put('/:id', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateCoupon);

// Deletar cupom
couponRouter.delete('/:id', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, deleteCoupon);

// Ativar/Desativar cupom
couponRouter.patch('/:id/toggle-status', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, toggleCouponStatus);

// Obter estatísticas de uso do cupom
couponRouter.get('/:id/stats', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, getCouponStats);

export default couponRouter;