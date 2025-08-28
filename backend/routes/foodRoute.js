import express from 'express'
import { addFood, listFood, removeFood, updateFood } from '../controllers/foodController.js'
import multer from 'multer'
import {
    identifyStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js'

const foodRouter = express.Router();

// Middleware para identificar a loja
foodRouter.use(identifyStore);

// Image Storage Engine

const storage = multer.diskStorage({
    destination:"uploads",
    filename: (req,file,cb)=>{
        return cb(null,`${Date.now()}${file.originalname}`)
    }
})

const upload = multer({storage:storage})

// Rotas públicas (para clientes)
foodRouter.get('/list',listFood)

// Rotas protegidas (para admins) - aplicar middlewares específicos
foodRouter.get('/admin/list', authMultiTenant, requireStoreAdmin, addStoreContext, listFood)
foodRouter.post('/add', authMultiTenant, requireStoreAdmin, addStoreContext, upload.single('image'), addFood)
foodRouter.post('/remove', authMultiTenant, requireStoreAdmin, addStoreContext, removeFood)
foodRouter.put('/update', authMultiTenant, requireStoreAdmin, addStoreContext, upload.single('image'), updateFood)

// Test endpoint
foodRouter.post('/test', authMultiTenant, requireStoreAdmin, addStoreContext, (req, res) => {
    console.log('=== TEST ENDPOINT CALLED ===');
    console.log('Request body:', req.body);
    res.json({success: true, message: 'Test endpoint working'});
});

export default foodRouter;