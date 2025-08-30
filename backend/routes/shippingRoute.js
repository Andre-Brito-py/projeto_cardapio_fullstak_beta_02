import express from 'express';
import {
    calculateShipping,
    checkDeliveryArea,
    getDeliverySettings,
    updateDeliverySettings,
    checkGoogleMapsStatus
} from '../controllers/shippingController.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const shippingRouter = express.Router();

// Rotas públicas com contexto de loja
shippingRouter.post('/calculate', identifyStore, addStoreContext, calculateShipping);
shippingRouter.post('/check-area', identifyStore, addStoreContext, checkDeliveryArea);
shippingRouter.get('/delivery-settings', identifyStore, addStoreContext, getDeliverySettings);
shippingRouter.get('/google-maps-status', identifyStore, addStoreContext, checkGoogleMapsStatus);

// Rotas protegidas para administradores de loja
shippingRouter.put('/delivery-settings', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, updateDeliverySettings);

export default shippingRouter;