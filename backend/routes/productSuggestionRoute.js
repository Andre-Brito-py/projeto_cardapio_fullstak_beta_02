import express from 'express';
import {
    createProductSuggestion,
    listProductSuggestions,
    getProductSuggestion,
    updateProductSuggestion,
    deleteProductSuggestion,
    getProductSuggestions
} from '../controllers/productSuggestionController.js';
import authMiddleware from '../middleware/auth.js';

const productSuggestionRouter = express.Router();

// Rotas para administração
productSuggestionRouter.post('/create', authMiddleware, createProductSuggestion);
productSuggestionRouter.get('/list', authMiddleware, listProductSuggestions);
productSuggestionRouter.get('/:suggestionId', authMiddleware, getProductSuggestion);
productSuggestionRouter.put('/:suggestionId', authMiddleware, updateProductSuggestion);
productSuggestionRouter.delete('/:suggestionId', authMiddleware, deleteProductSuggestion);

// Rota para o frontend do cliente
productSuggestionRouter.get('/public/product/:productId', authMiddleware, getProductSuggestions);

export default productSuggestionRouter;