import express from 'express';
import { getPaymentStats } from '../controllers/paymentStatsController.js';
import authMiddleware from '../middleware/auth.js';

const paymentStatsRouter = express.Router();

// Rota para buscar estatísticas por método de pagamento
paymentStatsRouter.get('/payment-stats', authMiddleware, getPaymentStats);

export default paymentStatsRouter;