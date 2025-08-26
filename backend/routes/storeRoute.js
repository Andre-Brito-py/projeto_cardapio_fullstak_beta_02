import express from 'express';
import {
    getStore,
    updateStoreSettings,
    getStoreStats,
    checkPlanLimits,
    loginStoreAdmin
} from '../controllers/storeController.js';
import {
    identifyStore,
    requireActiveStore,
    requireActiveSubscription,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js';

const storeRouter = express.Router();

// Middleware para identificar a loja em todas as rotas
storeRouter.use(identifyStore);

// Rota pública para login do admin da loja
storeRouter.post('/admin/login', loginStoreAdmin);

// Middleware de autenticação para todas as rotas abaixo
storeRouter.use(authMultiTenant);
storeRouter.use(requireStoreAdmin);
storeRouter.use(requireActiveStore);
storeRouter.use(addStoreContext);

// Rotas da loja
storeRouter.get('/:storeId', getStore);
storeRouter.put('/:storeId/settings', updateStoreSettings);
storeRouter.get('/:storeId/stats', getStoreStats);
storeRouter.get('/:storeId/limits', checkPlanLimits);

export default storeRouter;