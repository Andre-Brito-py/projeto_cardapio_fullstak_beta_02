import express from 'express';
import {
    getCashbackConfig,
    updateCashbackConfig,
    getCustomerBalance,
    getCustomerHistory,
    calculateOrderCashback,
    useCashback,
    getCashbackReports,
    expireOldCashback
} from '../controllers/cashbackController.js';
import authMiddleware from '../middleware/auth.js';
import { authMultiTenant } from '../middleware/multiTenancy.js';

const cashbackRouter = express.Router();

// Aplicar middleware de autenticação multi-tenant para todas as rotas
cashbackRouter.use(authMultiTenant);

// Rotas de configuração (Admin)
cashbackRouter.get('/config', getCashbackConfig);
cashbackRouter.put('/config', updateCashbackConfig);

// Rotas de cliente
cashbackRouter.get('/customer/:customerId/balance', getCustomerBalance);
cashbackRouter.get('/customer/:customerId/history', getCustomerHistory);

// Rotas de cálculo e uso
cashbackRouter.post('/calculate', calculateOrderCashback);
cashbackRouter.post('/use', useCashback);

// Rotas de relatórios (Admin)
cashbackRouter.get('/reports', getCashbackReports);

// Rota de manutenção (Admin)
cashbackRouter.post('/expire', expireOldCashback);

export default cashbackRouter;