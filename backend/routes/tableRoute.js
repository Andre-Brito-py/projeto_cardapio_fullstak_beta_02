import express from 'express';
import {
    createTable,
    listTables,
    getTable,
    updateTable,
    deleteTable,
    generateQRCode,
    generateAllQRCodes,
    getTableByQRCode,
    printTableQRCode,
    printAllQRCodes,
    printTableQRCodeDirect,
    printAllQRCodesDirect
} from '../controllers/tableController.js';
import {
    identifyStore,
    requireActiveStore,
    authMultiTenant,
    requireStoreAdmin,
    addStoreContext
} from '../middleware/multiTenancy.js';

const tableRouter = express.Router();

// Rotas públicas (sem autenticação)
tableRouter.get('/qr/:qrCode', getTableByQRCode);
tableRouter.get('/public/:storeId', identifyStore, addStoreContext, listTables);

// Middleware para identificar a loja em todas as rotas abaixo
tableRouter.use(identifyStore);

// Middleware de autenticação para todas as rotas abaixo
tableRouter.use(authMultiTenant);
tableRouter.use(requireStoreAdmin);
tableRouter.use(requireActiveStore);
tableRouter.use(addStoreContext);

// Rotas CRUD para mesas
tableRouter.post('/', createTable); // Criar nova mesa
tableRouter.get('/', listTables); // Listar todas as mesas da loja
tableRouter.get('/:tableId', getTable); // Obter mesa específica
tableRouter.put('/:tableId', updateTable); // Atualizar mesa
tableRouter.delete('/:tableId', deleteTable); // Deletar mesa

// Rotas para QR codes
tableRouter.get('/:tableId/qr', generateQRCode); // Gerar QR code para mesa específica
tableRouter.post('/generate-qr-all', generateAllQRCodes); // Gerar QR codes para todas as mesas
tableRouter.get('/:tableId/print-qr', printTableQRCode); // Imprimir QR code para mesa específica (PDF)
tableRouter.post('/print-qr-all', printAllQRCodes); // Imprimir QR codes para todas as mesas (PDF)
tableRouter.post('/:tableId/print-qr-direct', printTableQRCodeDirect); // Imprimir QR code diretamente na impressora térmica
tableRouter.post('/print-qr-all-direct', printAllQRCodesDirect); // Imprimir QR codes diretamente na impressora térmica

export default tableRouter;