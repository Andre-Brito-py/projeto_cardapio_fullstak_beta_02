import express from "express";
import { addCategory, listCategory, listActiveCategories, removeCategory, updateCategory } from "../controllers/categoryController.js";
import multer from "multer";

const categoryRouter = express.Router();

// Image Storage Engine
const storage = multer.diskStorage({
    destination: "uploads",
    filename: (req, file, cb) => {
        return cb(null, `${Date.now()}${file.originalname}`);
    }
});

const upload = multer({ storage: storage });

// Rotas para categorias
categoryRouter.post("/add", upload.single("image"), addCategory);
categoryRouter.get("/list", listCategory);
categoryRouter.get("/active", listActiveCategories);
categoryRouter.post("/remove", removeCategory);
categoryRouter.post("/update", upload.single("image"), updateCategory);

export default categoryRouter;