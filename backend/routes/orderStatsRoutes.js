import express from 'express';
import {
    getDeliveryStats,
    getOrdersByDeliveryType,
    getDailyDeliveryStats
} from '../controllers/orderStatsController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Route to get delivery statistics
router.get('/delivery-stats', getDeliveryStats);

// Route to get orders filtered by delivery type
router.get('/orders-by-type', getOrdersByDeliveryType);

// Route to get daily delivery statistics
router.get('/daily-stats', getDailyDeliveryStats);

export default router;