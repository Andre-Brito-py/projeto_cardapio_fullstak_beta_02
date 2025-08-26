import express from "express";
import { addBanner, listBanners, listAllBanners, removeBanner, updateBanner, toggleBannerStatus } from "../controllers/bannerController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from "../middleware/multiTenancy.js";

const bannerRouter = express.Router();

// Configuração do multer para upload de imagens
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        // Sanitizar o nome do arquivo removendo caracteres especiais e espaços
        const sanitizedName = file.originalname
            .replace(/[^a-zA-Z0-9.]/g, '_') // Substitui caracteres especiais por underscore
            .replace(/_{2,}/g, '_') // Remove underscores duplos
            .toLowerCase(); // Converte para minúsculas
        return cb(null, `${Date.now()}_${sanitizedName}`);
    }
});

const upload = multer({ storage: storage });

// Rotas públicas com contexto de loja
bannerRouter.get("/list", identifyStore, addStoreContext, listBanners);

// Rotas protegidas para administradores de loja
bannerRouter.post("/add", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), addBanner);
bannerRouter.get("/listall", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, listAllBanners);
bannerRouter.post("/remove", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, removeBanner);
bannerRouter.post("/update", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), updateBanner);
bannerRouter.post("/toggle", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, toggleBannerStatus);

export default bannerRouter;