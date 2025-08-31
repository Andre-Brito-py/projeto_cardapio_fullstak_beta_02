import express from 'express';
import {
    addInPersonSale,
    getInPersonSalesHistory,
    getInPersonSalesStats,
    cancelInPersonSale,
    getInPersonSaleById
} from '../controllers/inPersonSaleController.js';
import authMiddleware from '../middleware/auth.js';

const inPersonSaleRouter = express.Router();

// Todas as rotas requerem autenticação
inPersonSaleRouter.use(authMiddleware);

// Adicionar nova venda presencial
inPersonSaleRouter.post('/add', addInPersonSale);

// Obter histórico de vendas presenciais
inPersonSaleRouter.get('/history', getInPersonSalesHistory);

// Obter estatísticas de vendas presenciais
inPersonSaleRouter.get('/stats', getInPersonSalesStats);

// Obter detalhes de uma venda específica
inPersonSaleRouter.get('/:saleId', getInPersonSaleById);

// Cancelar venda presencial
inPersonSaleRouter.put('/:saleId/cancel', cancelInPersonSale);

export default inPersonSaleRouter;