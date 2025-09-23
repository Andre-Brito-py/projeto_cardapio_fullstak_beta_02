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
    deleteStore,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    startLisa,
    stopLisa,
    restartLisa,
    getLisaStatus,
    getRecentActivity
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

// Middleware de simulação para interceptar rotas PUT de stores em desenvolvimento
// DEVE vir ANTES de qualquer middleware de autenticação
if (process.env.NODE_ENV === 'development') {
    // Interceptação para criação de loja (POST)
    systemRouter.post('/stores', (req, res, next) => {
        console.log('🎯 INTERCEPTANDO CRIAÇÃO DE LOJA - Path:', req.path);
        console.log('📝 Dados recebidos:', JSON.stringify(req.body, null, 2));
        
        const storeData = req.body;
        
        // Simular loja criada com os dados recebidos
        const newStore = {
            _id: 'store_' + Date.now(),
            ...storeData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            // Garantir que campos essenciais existam
            name: storeData.name || 'Nova Loja',
            slug: storeData.slug || 'nova-loja',
            status: storeData.status || 'active'
        };
        
        console.log('✅ SUCESSO - Loja criada no modo simulação');
        
        // Simular um pequeno delay para parecer mais real
        setTimeout(() => {
            return res.status(201).json(newStore);
        }, 200);
    });

    // Interceptação para atualização de loja (PUT)
    systemRouter.put('/stores/:storeId', (req, res, next) => {
        console.log('🎯 INTERCEPTANDO ATUALIZAÇÃO DE LOJA - Path:', req.path);
        console.log('📝 Dados recebidos:', JSON.stringify(req.body, null, 2));
        
        const storeId = req.params.storeId;
        const updateData = req.body;
        
        // Simular loja atualizada preservando TODOS os dados recebidos
        const updatedStore = {
            _id: storeId,
            ...updateData, // Preserva todos os dados enviados pelo frontend
            updatedAt: new Date().toISOString(),
            // Garantir que campos essenciais existam
            name: updateData.name || 'Loja Demo Atualizada',
            slug: updateData.slug || 'loja-demo-atualizada',
            status: updateData.status || 'active'
        };
        
        console.log('✅ SUCESSO - Loja atualizada no modo simulação');
        
        // Simular um pequeno delay para parecer mais real
        setTimeout(() => {
            return res.status(200).json(updatedStore);
        }, 100);
    });
}

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
// Rota POST comentada em desenvolvimento - interceptação ativa no topo do arquivo
if (process.env.NODE_ENV !== 'development') {
    systemRouter.post('/stores', createStore);
}
// Rota PUT comentada em desenvolvimento - interceptação ativa no topo do arquivo
if (process.env.NODE_ENV !== 'development') {
    systemRouter.put('/stores/:storeId', updateStore);
}
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

export default systemRouter;