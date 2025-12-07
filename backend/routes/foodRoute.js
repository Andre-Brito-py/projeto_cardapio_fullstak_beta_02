import express from 'express'
import { addFood, listFood, removeFood, updateFood, getFoodWithAddonsAndSuggestions, listFoodWithAddonInfo, updateStockStatus, getFoodDetails } from '../controllers/foodController.js'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import {
    identifyStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js'
import { validate } from '../middleware/validate.js'
import { createFoodSchema, updateFoodSchema, updateStockSchema } from '../validators/foodValidator.js'

const foodRouter = express.Router();

// Middleware para identificar a loja
foodRouter.use(identifyStore);

// Image Storage Engine com isolamento por loja

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        // Garantir que temos o storeId disponível
        const storeId = req.store?._id || req.user?.storeId;
        if (!storeId) {
            return cb(new Error('Store ID não encontrado para upload'), null);
        }

        // Criar diretório específico da loja
        const storeDir = path.join('uploads', 'stores', storeId.toString());

        // Criar diretório se não existir
        if (!fs.existsSync(storeDir)) {
            fs.mkdirSync(storeDir, { recursive: true });
        }

        cb(null, storeDir);
    },
    filename: (req, file, cb) => {
        // Sanitizar nome do arquivo
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_')
            .replace(/_{2,}/g, '_')
            .toLowerCase();
        return cb(null, `${Date.now()}_${sanitizedName}`);
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limite
    },
    fileFilter: (req, file, cb) => {
        // Apenas imagens permitidas
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Apenas arquivos de imagem são permitidos'), false);
        }
    }
})

// Rotas públicas (para clientes)
foodRouter.get('/list', listFood)
foodRouter.get('/with-addon-info', addStoreContext, listFoodWithAddonInfo)
foodRouter.get('/:foodId/details', addStoreContext, getFoodWithAddonsAndSuggestions)

// Rotas protegidas (para admins) - aplicar middlewares específicos
foodRouter.get('/admin/list', authMultiTenant, requireStoreAdmin, addStoreContext, listFood)
foodRouter.get('/admin/with-addon-info', authMultiTenant, requireStoreAdmin, addStoreContext, listFoodWithAddonInfo)
foodRouter.post('/add', authMultiTenant, requireStoreAdmin, addStoreContext, upload.single('image'), addFood)
foodRouter.post('/remove', authMultiTenant, requireStoreAdmin, addStoreContext, removeFood)
foodRouter.put('/update', authMultiTenant, requireStoreAdmin, addStoreContext, upload.single('image'), updateFood)
// Rota para atualizar status de estoque
foodRouter.put('/stock-status', authMultiTenant, requireStoreAdmin, addStoreContext, validate(updateStockSchema), updateStockStatus)

// Rota para buscar detalhes de um produto específico
foodRouter.get('/:id/details', authMultiTenant, requireStoreAdmin, addStoreContext, getFoodDetails)

// Test endpoint
foodRouter.post('/test', authMultiTenant, requireStoreAdmin, addStoreContext, (req, res) => {
    // Test endpoint called
    res.json({ success: true, message: 'Test endpoint working' });
});

export default foodRouter;