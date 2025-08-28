import express from 'express';
import { 
    scanPrinters, 
    connectPrinter, 
    printOrder, 
    printOrderSerial, 
    printQRCode,
    printQRCodeSerial,
    disconnectPrinter, 
    testPrint 
} from '../controllers/printController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext } from '../middleware/multiTenancy.js';

const printRouter = express.Router();

// Todas as rotas de impressão requerem autenticação e permissão de admin da loja
printRouter.post('/scan', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, scanPrinters);
printRouter.post('/connect', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, connectPrinter);
printRouter.post('/print', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, printOrder);
printRouter.post('/print-serial', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, printOrderSerial);
printRouter.post('/print-qr', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, printQRCode);
printRouter.post('/print-qr-serial', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, printQRCodeSerial);
printRouter.post('/disconnect', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, disconnectPrinter);
printRouter.post('/test', identifyStore, authMultiTenant, requireStoreAdmin, addStoreContext, testPrint);

export default printRouter;