import express from 'express';
import { addToCart, removeFromCart, getCart } from '../controllers/cartController.js';
import authMiddleware from '../middleware/auth.js';
import optionalAuthMiddleware from '../middleware/optionalAuth.js';
import { identifyStore, addStoreContext } from '../middleware/multiTenancy.js';

const cartRouter = express.Router();

// Rotas para clientes com contexto de loja (autenticação opcional)
cartRouter.post('/add', identifyStore, optionalAuthMiddleware, addStoreContext, addToCart);
cartRouter.post('/remove', identifyStore, optionalAuthMiddleware, addStoreContext, removeFromCart);
cartRouter.post('/get', identifyStore, optionalAuthMiddleware, addStoreContext, getCart);

export default cartRouter;
