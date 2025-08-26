import express from 'express';
import { addToCart, removeFromCart, getCart } from '../controllers/cartController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, addStoreContext } from '../middleware/multiTenancy.js';

const cartRouter = express.Router();

// Rotas para clientes com contexto de loja
cartRouter.post('/add', identifyStore, authMiddleware, addStoreContext, addToCart);
cartRouter.post('/remove', identifyStore, authMiddleware, addStoreContext, removeFromCart);
cartRouter.post('/get', identifyStore, authMiddleware, addStoreContext, getCart);

export default cartRouter;
