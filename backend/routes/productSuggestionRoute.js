import express from 'express';
import {
    createProductSuggestion,
    listProductSuggestions,
    getProductSuggestion,
    updateProductSuggestion,
    deleteProductSuggestion,
    getProductSuggestions
} from '../controllers/productSuggestionController.js';
import {
    identifyStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js';

const productSuggestionRouter = express.Router();

// Apply identifyStore for all routes
productSuggestionRouter.use(identifyStore);

// Rotas para administração
productSuggestionRouter.post('/create', authMultiTenant, requireStoreAdmin, addStoreContext, createProductSuggestion);
productSuggestionRouter.get('/list', authMultiTenant, requireStoreAdmin, addStoreContext, listProductSuggestions);
productSuggestionRouter.get('/:suggestionId', authMultiTenant, requireStoreAdmin, addStoreContext, getProductSuggestion);
productSuggestionRouter.put('/:suggestionId', authMultiTenant, requireStoreAdmin, addStoreContext, updateProductSuggestion);
productSuggestionRouter.delete('/:suggestionId', authMultiTenant, requireStoreAdmin, addStoreContext, deleteProductSuggestion);

// Rota para o frontend do cliente
productSuggestionRouter.get('/public/product/:productId', addStoreContext, getProductSuggestions);

export default productSuggestionRouter;