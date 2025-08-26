import express from "express";
import { calculateDeliveryFee, checkDeliveryArea, getDeliveryInfo } from "../controllers/deliveryController.js";
import authMiddleware from "../middleware/auth.js";
import { identifyStore, addStoreContext } from "../middleware/multiTenancy.js";

const deliveryRouter = express.Router();

// Rotas públicas com contexto de loja
deliveryRouter.post("/calculate-fee", identifyStore, addStoreContext, calculateDeliveryFee);
deliveryRouter.post("/check-area", identifyStore, addStoreContext, checkDeliveryArea);
deliveryRouter.get("/info", identifyStore, addStoreContext, getDeliveryInfo);

export default deliveryRouter;