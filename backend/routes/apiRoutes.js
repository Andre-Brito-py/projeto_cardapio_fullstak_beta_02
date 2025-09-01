import express from 'express';
import { 
    getApiSettings, 
    updateApiSettings, 
    testGoogleMapsApi, 
    testAsaasApi, 
    getApiStatus 
} from '../controllers/apiController.js';
import { requireSuperAdmin } from '../middleware/multiTenancy.js';

const router = express.Router();

// Todas as rotas requerem autenticação de Super Admin
router.use(requireSuperAdmin);

// Rotas para configurações de APIs
router.get('/settings', getApiSettings);
router.put('/settings', updateApiSettings);
router.get('/status', getApiStatus);

// Rotas para testar APIs
router.post('/test-google-maps', testGoogleMapsApi);
router.post('/test-asaas', testAsaasApi);

export default router;