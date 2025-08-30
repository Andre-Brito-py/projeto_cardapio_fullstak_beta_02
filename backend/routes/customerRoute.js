import express from 'express';
import {
    findCustomerByPhone,
    createCustomer,
    updateCustomer,
    getStoreCustomers,
    getCustomerById,
    deactivateCustomer
} from '../controllers/customerController.js';
import { identifyStore, addStoreContext } from '../middleware/multiTenancy.js';
import { default as authMiddleware } from '../middleware/auth.js';

const customerRouter = express.Router();

// Rotas públicas (para clientes no frontend)
customerRouter.post('/find-by-phone', identifyStore, addStoreContext, findCustomerByPhone);
customerRouter.post('/create', identifyStore, addStoreContext, createCustomer);
customerRouter.put('/update/:customerId', identifyStore, addStoreContext, updateCustomer);

// Rotas protegidas (para administradores)
customerRouter.get('/store/:storeId', authMiddleware, getStoreCustomers);
customerRouter.get('/:customerId', authMiddleware, getCustomerById);
customerRouter.delete('/:customerId', authMiddleware, deactivateCustomer);

export default customerRouter;