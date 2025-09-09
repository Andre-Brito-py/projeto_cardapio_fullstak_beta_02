import express from 'express';
import { getPixKey, updatePixKey, getSettings, updateBanner, getBanner, getAcceptedPaymentMethods, updateAcceptedPaymentMethods } from '../controllers/settingsController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const settingsRouter = express.Router();

// Public routes with store context
settingsRouter.get('/pix-key', identifyStore, addStoreContext, getPixKey);
settingsRouter.get('/', identifyStore, addStoreContext, getSettings);
settingsRouter.get('/banner', identifyStore, addStoreContext, getBanner);
settingsRouter.get('/payment-methods', identifyStore, addStoreContext, getAcceptedPaymentMethods);

// Admin routes (require authentication and store admin permissions)
settingsRouter.post('/pix-key', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updatePixKey);
settingsRouter.post('/banner', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateBanner);
settingsRouter.post('/payment-methods', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateAcceptedPaymentMethods);

export default settingsRouter;