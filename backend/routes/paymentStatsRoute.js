import express from 'express';
import { getPaymentStats } from '../controllers/paymentStatsController.js';
import {
    identifyStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js';

const paymentStatsRouter = express.Router();

// Rota para buscar estatísticas por método de pagamento
paymentStatsRouter.get('/payment-stats', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, getPaymentStats);

export default paymentStatsRouter;