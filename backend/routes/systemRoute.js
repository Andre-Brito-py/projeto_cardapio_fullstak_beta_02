import express from 'express';
import {
    getSystemSettings,
    updateSystemSettings,
    getSystemStats,
    getAllStores,
    updateStoreStatus,
    updateStore,
    createSuperAdmin,
    loginSuperAdmin,
    getPublicStores,
    checkSuperAdmin,
    resetSuperAdminPassword,
    deleteStore
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
systemRouter.get('/stores/public', getPublicStores);
systemRouter.get('/super-admin/check', checkSuperAdmin);
systemRouter.post('/super-admin/create', createSuperAdmin);
systemRouter.post('/super-admin/login', loginSuperAdmin);
systemRouter.post('/super-admin/reset-password', resetSuperAdminPassword);

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
systemRouter.put('/stores/:storeId', updateStore);
systemRouter.put('/stores/:storeId/status', updateStoreStatus);
systemRouter.put('/stores/:storeId/subscription', updateSubscription);
systemRouter.delete('/stores/:storeId', deleteStore);

export default systemRouter;