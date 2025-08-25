import express from 'express';
import { getPixKey, updatePixKey, getSettings, updateDeliveryFee, updateBanner, getBanner } from '../controllers/settingsController.js';
import authMiddleware from '../middleware/auth.js';

const settingsRouter = express.Router();

// Public routes
settingsRouter.get('/pix-key', getPixKey);
settingsRouter.get('/', getSettings);
settingsRouter.get('/banner', getBanner);

// Admin routes (require authentication)
settingsRouter.post('/pix-key', authMiddleware, updatePixKey);
settingsRouter.post('/delivery-fee', authMiddleware, updateDeliveryFee);
settingsRouter.post('/banner', authMiddleware, updateBanner);

export default settingsRouter;