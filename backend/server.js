// Configuração das variáveis de ambiente (DEVE ser o primeiro import)
import 'dotenv/config';
// MongoDB connection updated

// Importações principais
import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectDB } from './config/db.js';

// Importações das rotas
import foodRouter from './routes/foodRoute.js';
import userRouter from './routes/userRoute.js';
import cartRouter from './routes/cartRoute.js';
import orderRouter from './routes/orderRoute.js';
import categoryRouter from './routes/categoryRoute.js';
import settingsRouter from './routes/settingsRoute.js';
import bannerRouter from './routes/bannerRoute.js';
import printRouter from './routes/printRoute.js';
import deliveryRouter from './routes/deliveryRoute.js';
import systemRouter from './routes/systemRoute.js';
import storeRouter from './routes/storeRoute.js';
import tableRouter from './routes/tableRoute.js';
import couponRouter from './routes/couponRoute.js';
import waiterRouter from './routes/waiterRoute.js';
import customerRouter from './routes/customerRoute.js';
import customerAutoRegisterRouter from './routes/customerRoutes.js'; // Novas rotas para cadastro automático
import shippingRouter from './routes/shippingRoute.js';
import inPersonSaleRouter from './routes/inPersonSaleRoute.js';
import orderStatsRouter from './routes/orderStatsRoutes.js';
import paymentStatsRouter from './routes/paymentStatsRoute.js'
import counterAttendantRouter from './routes/counterAttendantRoute.js'
import counterOrderRouter from './routes/counterOrderRoute.js';
import cashbackRouter from './routes/cashbackRoute.js';
import analyticsRouter from './routes/analytics.js';

import productSuggestionRouter from './routes/productSuggestionRoute.js';
import asaasRouter from './routes/asaasRoutes.js';
import apiRouter from './routes/apiRoutes.js';
import whatsappRouter from './routes/whatsappRoute.js';
import whatsappWebhookRouter from './routes/whatsappWebhook.js';
import lizaRouter from './routes/lizaRoutes.js';
import lizaCustomerRouter from './routes/lizaCustomerRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import dailyReportScheduler from './services/dailyReportScheduler.js';
import { identifyStore, validateStoreActive, logStoreContext } from './middleware/storeContext.js';
import { simulateAuth, simulateDatabase } from './middleware/simulationMode.js';
import { auditMiddleware } from './middleware/auditLogger.js';
import errorHandler from './middleware/errorHandler.js';
import logger from './config/logger.js';

// Configuração da aplicação
const app = express();
const port = process.env.PORT || 4001;

// Configuração de middlewares
app.use(express.json()); // Parser para JSON

// Middleware de auditoria (aplicado globalmente)
app.use(auditMiddleware);

// Configuração específica de CORS para permitir requisições do admin
app.use(cors({
    origin: [
        'http://localhost:5173', // Frontend
        'http://localhost:5174', // Admin (dev)
        'http://localhost:4174', // Admin (preview build)
        'http://localhost:4175', // Admin (preview hard reload)
        'http://localhost:5176'  // Counter
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-ID']
}));

// Middleware de simulação removido para permitir operações reais do super admin
// if (process.env.NODE_ENV === 'development') {
//     app.use(simulateAuth);
//     app.use(simulateDatabase);
// }

// Middleware de contexto de loja removido da aplicação global
// Será aplicado apenas nas rotas específicas que precisam

// Conexão com o banco de dados MongoDB
connectDB();

// Configuração das rotas da API
// Rotas do sistema multi-tenant
app.use('/api/system', systemRouter); // Rotas para Super Admin
app.use('/api/store', storeRouter); // Rotas para gerenciamento de lojas
app.use('/api/tables', tableRouter); // Rotas para gerenciamento de mesas
app.use('/api/coupons', couponRouter); // Rotas para gerenciamento de cupons
app.use('/api/waiter', waiterRouter); // Rotas para funcionalidades do garçom
app.use('/api/customers', customerRouter); // Rotas para gerenciamento de clientes
app.use('/api/customer-auto', customerAutoRegisterRouter); // Rotas para cadastro automático de clientes
app.use('/api/shipping', shippingRouter); // Rotas para cálculo de frete
app.use('/api/in-person-sales', inPersonSaleRouter); // Rotas para vendas presenciais
app.use('/api/order-stats', orderStatsRouter); // Rotas para estatísticas de pedidos
app.use('/api/payment-stats', paymentStatsRouter)
app.use('/api/counter-attendant', counterAttendantRouter)
app.use('/api/counter-orders', counterOrderRouter); // Rotas para estatísticas de pagamento
app.use('/api/cashback', cashbackRouter); // Rotas para sistema de cashback
app.use('/api/analytics', validateStoreActive, analyticsRouter); // Rotas para analytics e campanhas da Liza

app.use('/api/product-suggestions', productSuggestionRouter); // Rotas para sugestões de produtos
app.use('/api/asaas', asaasRouter); // Rotas para integração com Asaas
app.use('/api/system/api', apiRouter); // Rotas para gerenciamento de APIs
app.use('/api/whatsapp', validateStoreActive, whatsappRouter); // Rotas para integração com WhatsApp
app.use('/api/whatsapp-webhook', whatsappWebhookRouter); // Webhook não precisa validar loja ativa
// Rotas mais específicas devem vir antes das genéricas
app.use('/api/liza/customers', validateStoreActive, lizaCustomerRouter); // Rotas para Liza consultar clientes
app.use('/api/liza', lizaRouter); // Rotas para chat com IA Liza
app.use('/api/reports', reportRouter); // Rotas para relatórios diários

// Rotas existentes (mantidas para compatibilidade)
app.use('/api/food', foodRouter); // Rotas para gerenciamento de comidas

// Servir imagens estáticas com isolamento por loja
app.use('/images', (req, res, next) => {
    // Extrair storeId da URL ou headers
    const storeId = req.headers['x-store-id'] || req.query.storeId;

    if (storeId) {
        // Servir arquivos do diretório específico da loja
        express.static(path.join('uploads', 'stores', storeId))(req, res, next);
    } else {
        // Fallback para o diretório geral (compatibilidade)
        express.static('uploads')(req, res, next);
    }
});
app.use('/api/user', userRouter); // Rotas para autenticação e usuários
app.use('/api/cart', cartRouter); // Rotas para carrinho de compras
app.use('/api/order', orderRouter); // Rotas para pedidos
app.use('/api/category', categoryRouter); // Rotas para categorias
app.use('/api/settings', settingsRouter); // Rotas para configurações do sistema
app.use('/api/banner', bannerRouter); // Rotas para banners
app.use('/api/print', printRouter); // Rotas para impressão Bluetooth
app.use('/api/delivery', deliveryRouter); // Rotas para cálculo de entrega

// Rota de teste da API
app.get('/', (req, res) => {
    res.send('API working');
});

// Error Handler (DEVE ser o último middleware)
app.use(errorHandler);

// Inicializar agendadores
dailyReportScheduler.init();

// Inicialização do servidor
app.listen(port, () => {
    logger.info(`Server started on http://localhost:${port}`);
    logger.info('📊 Agendador de relatórios diários inicializado');
    
});
