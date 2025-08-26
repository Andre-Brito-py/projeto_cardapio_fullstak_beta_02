import express from "express";
import { addCategory, listCategory, listActiveCategories, removeCategory, updateCategory } from "../controllers/categoryController.js";
import multer from "multer";
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from "../middleware/multiTenancy.js";

const categoryRouter = express.Router();

// Image Storage Engine
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Rotas públicas
categoryRouter.get("/list", identifyStore, addStoreContext, listCategory);
categoryRouter.get("/active", identifyStore, addStoreContext, listActiveCategories);

// Rotas protegidas para administradores de loja
categoryRouter.post("/add", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), addCategory);
categoryRouter.post("/remove", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, removeCategory);
categoryRouter.post("/update", identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, upload.single("image"), updateCategory);

export default categoryRouter;