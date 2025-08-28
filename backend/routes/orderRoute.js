import express from 'express';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { placeOrder, verifyOrder, userOrders, listOrders, updateStatus } from '../controllers/orderController.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const orderRouter = express.Router();

// Rotas para clientes
orderRouter.post('/place', identifyStore, optionalAuthMiddleware, addStoreContext, placeOrder);
orderRouter.post('/verify', verifyOrder);
orderRouter.post('/userorders', authMiddleware, userOrders);

// Rotas protegidas para administradores de loja
orderRouter.get('/list', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, listOrders);
orderRouter.post('/status', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateStatus);

export default orderRouter;

