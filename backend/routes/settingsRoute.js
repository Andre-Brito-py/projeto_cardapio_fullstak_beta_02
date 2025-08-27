import express from 'express';
import { getPixKey, updatePixKey, getSettings, updateBanner, getBanner } from '../controllers/settingsController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const settingsRouter = express.Router();

// Public routes with store context
settingsRouter.get('/pix-key', identifyStore, addStoreContext, getPixKey);
settingsRouter.get('/', identifyStore, addStoreContext, getSettings);
settingsRouter.get('/banner', identifyStore, addStoreContext, getBanner);

// Admin routes (require authentication and store admin permissions)
settingsRouter.post('/pix-key', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updatePixKey);
settingsRouter.post('/banner', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateBanner);

export default settingsRouter;