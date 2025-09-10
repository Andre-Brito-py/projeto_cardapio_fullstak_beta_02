import express from 'express';
import {
    getStore,
    updateStoreSettings,
    getStoreStats,
    checkPlanLimits,
    loginStoreAdmin,
    getPublicStoreData,
    getPublicStoreMenu,
    updateStoreStatus,
    updateAutoAcceptOrders,
    getPublicStoreById
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

// Rotas públicas (sem middleware de identificação)
storeRouter.get('/public/:slug', getPublicStoreData);
storeRouter.get('/public/:slug/menu', getPublicStoreMenu);
storeRouter.get('/public/id/:storeId', getPublicStoreById);

// Rota pública para login do admin da loja (antes dos middlewares)
storeRouter.post('/admin/login', loginStoreAdmin);

// Middleware para identificar a loja em todas as rotas abaixo
storeRouter.use(identifyStore);

// Middleware de autenticação para todas as rotas abaixo
storeRouter.use(authMultiTenant);
storeRouter.use(requireStoreAdmin);
storeRouter.use(requireActiveStore);
storeRouter.use(addStoreContext);

// Rotas da loja
storeRouter.get('/current', getStore); // Nova rota para obter loja atual
storeRouter.get('/:storeId', getStore);
storeRouter.put('/:storeId/settings', updateStoreSettings);
storeRouter.put('/status', updateStoreStatus); // Nova rota para atualizar status aberta/fechada
storeRouter.put('/auto-accept', updateAutoAcceptOrders); // Nova rota para aceitar pedidos automaticamente
storeRouter.get('/:storeId/stats', getStoreStats);
storeRouter.get('/:storeId/limits', checkPlanLimits);

export default storeRouter;