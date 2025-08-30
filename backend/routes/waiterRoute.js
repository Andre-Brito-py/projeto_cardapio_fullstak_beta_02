import express from 'express';
import {
    generateAccessLink,
    validateWaiterToken,
    placeWaiterOrder,
    getTableOrders
} from '../controllers/waiterController.js';
import {
    identifyStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js';
import waiterAuth from '../middleware/waiterAuth.js';

const waiterRouter = express.Router();

// Rotas para administradores de loja (gerar links de acesso)
waiterRouter.post('/generate-link', 
    identifyStore, 
    authMultiTenant, 
    requireStoreAdmin, 
    addStoreContext, 
    generateAccessLink
);

// Rotas públicas para garçons (com autenticação de garçom)
waiterRouter.post('/validate-token', waiterAuth, validateWaiterToken);
waiterRouter.post('/place-order', waiterAuth, placeWaiterOrder);
waiterRouter.get('/table/:tableId/orders', waiterAuth, getTableOrders);

export default waiterRouter;