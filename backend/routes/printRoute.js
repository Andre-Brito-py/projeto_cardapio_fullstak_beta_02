import express from 'express';
import { 
    scanPrinters, 
    connectPrinter, 
    printOrder, 
    printOrderSerial, 
    disconnectPrinter, 
    testPrint 
} from '../controllers/printController.js';
import authMiddleware from '../middleware/auth.js';

const printRouter = express.Router();

// Todas as rotas de impressão requerem autenticação
printRouter.use(authMiddleware);

// Buscar impressoras Bluetooth disponíveis
printRouter.post('/scan', scanPrinters);

// Conectar a uma impressora específica
printRouter.post('/connect', connectPrinter);

// Imprimir pedido via Bluetooth
printRouter.post('/print', printOrder);

// Imprimir pedido via porta serial
printRouter.post('/print-serial', printOrderSerial);

// Desconectar impressora
printRouter.post('/disconnect', disconnectPrinter);

// Teste de impressão
printRouter.post('/test', testPrint);

export default printRouter;