import express from "express";
import { addBanner, listBanners, listAllBanners, removeBanner, updateBanner, toggleBannerStatus } from "../controllers/bannerController.js";
import multer from "multer";
import authMiddleware from "../middleware/auth.js";

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

// Rotas públicas
bannerRouter.get("/list", listBanners);

// Rotas protegidas (admin)
bannerRouter.post("/add", authMiddleware, upload.single("image"), addBanner);
bannerRouter.get("/listall", authMiddleware, listAllBanners);
bannerRouter.post("/remove", authMiddleware, removeBanner);
bannerRouter.post("/update", authMiddleware, upload.single("image"), updateBanner);
bannerRouter.post("/toggle", authMiddleware, toggleBannerStatus);

export default bannerRouter;