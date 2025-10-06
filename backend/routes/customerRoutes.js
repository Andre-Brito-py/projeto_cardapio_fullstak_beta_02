import express from 'express';
import {
    findCustomerByPhone,
    createCustomer,
    updateCustomer,
    getStoreCustomers,
    getCustomerById,
    deactivateCustomer,
    // Novas funções para cadastro automático
    registerCustomer,
    addAddress,
    getAddresses,
    addOrder,
    getOrders,
    deleteCustomerData,
    getCustomersForAdmin
} from '../controllers/customerController.js';

const router = express.Router();

// Rotas existentes
router.get('/find/:phone/:storeId', findCustomerByPhone);
router.post('/create', createCustomer);
router.put('/update/:id', updateCustomer);
router.get('/store/:storeId', getStoreCustomers);
router.get('/:id', getCustomerById);
router.delete('/:id', deactivateCustomer);

// Novas rotas para sistema de cadastro automático
// POST /api/register - Cadastra ou retorna cliente existente
router.post('/register', registerCustomer);

// POST /api/address - Adiciona um endereço ao cliente
router.post('/address', addAddress);

// GET /api/addresses - Lista endereços do cliente
router.get('/addresses', getAddresses);

// POST /api/order - Adiciona pedido ao histórico
router.post('/order', addOrder);

// GET /api/orders - Lista histórico de pedidos do cliente
router.get('/orders', getOrders);

// DELETE /api/customer/:clientId - Exclusão de dados (LGPD)
router.delete('/customer/:clientId', deleteCustomerData);

// GET /api/customers - Lista clientes para admin (com paginação)
router.get('/admin/customers', getCustomersForAdmin);

export default router;