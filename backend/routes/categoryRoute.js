import express from "express";
import { addCategory, listCategory, listActiveCategories, removeCategory, updateCategory } from "../controllers/categoryController.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from "../middleware/multiTenancy.js";

const categoryRouter = express.Router();

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
});

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
});

// Rotas públicas
categoryRouter.get("/list", identifyStore, addStoreContext, listCategory);
categoryRouter.get("/active", identifyStore, addStoreContext, listActiveCategories);

// Rotas protegidas para administradores de loja
categoryRouter.post("/add", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), addCategory);
categoryRouter.post("/remove", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, removeCategory);
categoryRouter.post("/update", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), updateCategory);

export default categoryRouter;