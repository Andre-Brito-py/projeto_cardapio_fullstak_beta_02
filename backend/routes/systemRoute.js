import express from 'express';
import {
    getSystemSettings,
    updateSystemSettings,
    getSystemStats,
    getAllStores,
    updateStoreStatus,
    createSuperAdmin,
    loginSuperAdmin
} from '../controllers/systemController.js';
import {
    createStore,
    updateSubscription
} from '../controllers/storeController.js';
import {
    authMultiTenant,
    requireSuperAdmin
} from '../middleware/multiTenancy.js';

const systemRouter = express.Router();

// Rotas públicas (sem autenticação)
systemRouter.post('/super-admin/create', createSuperAdmin);
systemRouter.post('/super-admin/login', loginSuperAdmin);

// Middleware de autenticação para todas as rotas abaixo
systemRouter.use(authMultiTenant);
systemRouter.use(requireSuperAdmin);

// Configurações do sistema
systemRouter.get('/settings', getSystemSettings);
systemRouter.put('/settings', updateSystemSettings);

// Estatísticas do sistema
systemRouter.get('/stats', getSystemStats);

// Gerenciamento de lojas
systemRouter.get('/stores', getAllStores);
systemRouter.post('/stores', createStore);
systemRouter.put('/stores/:storeId/status', updateStoreStatus);
systemRouter.put('/stores/:storeId/subscription', updateSubscription);

export default systemRouter;