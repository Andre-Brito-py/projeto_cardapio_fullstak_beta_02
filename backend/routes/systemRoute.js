import express from 'express';
import { authMultiTenant, requireSuperAdmin } from '../middleware/multiTenancy.js';
import { 
    getSystemSettings, 
    updateSystemSettings, 
    getSystemStats,
    getAllStores,
    updateStoreStatus,
    updateStore,
    deleteStore,
    getAllUsers,
    createUser,
    updateUser,
    updateUserStatus,
    resetUserPassword,
    deleteUser,
    getRecentActivity,
    checkSuperAdmin,
    createSuperAdmin,
    loginSuperAdmin,
    resetSuperAdminPassword,
    startLisa,
    stopLisa,
    restartLisa,
    getLisaStatus,
    getPublicStores,
    getUserAuditLogs,
    getStoreAuditLogs,
    getAuditStats
} from '../controllers/systemController.js';

import { createStore, updateSubscription } from '../controllers/storeController.js';

const systemRouter = express.Router();

// Interceptações removidas - permitindo operações reais do super admin

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

// Gerenciamento de usuários
systemRouter.get('/users', getAllUsers);
systemRouter.post('/users', createUser);
systemRouter.put('/users/:userId', updateUser);
systemRouter.put('/users/:userId/status', updateUserStatus);
systemRouter.post('/users/:userId/reset-password', resetUserPassword);
systemRouter.delete('/users/:userId', deleteUser);

// Gerenciamento da Lisa AI Assistant
systemRouter.post('/lisa/start', startLisa);
systemRouter.post('/lisa/stop', stopLisa);
systemRouter.post('/lisa/restart', restartLisa);
systemRouter.get('/lisa/status', getLisaStatus);

// Atividades recentes
systemRouter.get('/recent-activity', getRecentActivity);

// Rotas de auditoria
systemRouter.get('/users/:userId/audit', getUserAuditLogs);
systemRouter.get('/stores/:storeId/audit', getStoreAuditLogs);
systemRouter.get('/audit/stats', getAuditStats);

export default systemRouter;