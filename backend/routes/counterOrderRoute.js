import express from 'express';
import {
    createInPersonOrder,
    getTodayCounterOrders,
    getAvailableProducts,
    updateOrderStatus,
    getAttendantStats
} from '../controllers/counterOrderController.js';
import { counterAuth, canCreateOrders, canViewReports } from '../middleware/counterAuth.js';

const counterOrderRouter = express.Router();

// Todas as rotas requerem autenticação de atendente
counterOrderRouter.use(counterAuth);

// Rotas para criação e gerenciamento de pedidos
counterOrderRouter.post('/create', canCreateOrders, createInPersonOrder);
counterOrderRouter.get('/today', getTodayCounterOrders);
counterOrderRouter.put('/:orderId/status', updateOrderStatus);

// Rotas para produtos
counterOrderRouter.get('/products', getAvailableProducts);

// Rotas para estatísticas
counterOrderRouter.get('/stats/attendant', getAttendantStats);

export default counterOrderRouter;