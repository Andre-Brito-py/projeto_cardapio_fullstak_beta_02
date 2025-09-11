// Configuração das variáveis de ambiente (DEVE ser o primeiro import)
import 'dotenv/config';

// Importações principais
import express from 'express';
import cors from 'cors';
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
import shippingRouter from './routes/shippingRoute.js';
import inPersonSaleRouter from './routes/inPersonSaleRoute.js';
import orderStatsRouter from './routes/orderStatsRoutes.js';
import paymentStatsRouter from './routes/paymentStatsRoute.js'
import counterAttendantRouter from './routes/counterAttendantRoute.js'
import counterOrderRouter from './routes/counterOrderRoute.js';

import productSuggestionRouter from './routes/productSuggestionRoute.js';
import asaasRouter from './routes/asaasRoutes.js';
import apiRouter from './routes/apiRoutes.js';
import whatsappRouter from './routes/whatsappRoute.js';
import whatsappWebhookRouter from './routes/whatsappWebhook.js';
import telegramRouter from './routes/telegramRoutes.js';
import lizaRouter from './routes/lizaRoutes.js';
import reportRouter from './routes/reportRoutes.js';
import dailyReportScheduler from './services/dailyReportScheduler.js';
import { identifyStore, validateStoreActive, logStoreContext } from './middleware/storeContext.js';

// Configuração da aplicação
const app = express();
const port = process.env.PORT || 4000;

// Configuração de middlewares
app.use(express.json()); // Parser para JSON
app.use(cors()); // Habilita CORS para requisições cross-origin

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
app.use('/api/shipping', shippingRouter); // Rotas para cálculo de frete
app.use('/api/in-person-sales', inPersonSaleRouter); // Rotas para vendas presenciais
app.use('/api/order-stats', orderStatsRouter); // Rotas para estatísticas de pedidos
app.use('/api/payment-stats', paymentStatsRouter)
app.use('/api/counter-attendant', counterAttendantRouter)
app.use('/api/counter-orders', counterOrderRouter); // Rotas para estatísticas de pagamento

app.use('/api/product-suggestions', productSuggestionRouter); // Rotas para sugestões de produtos
app.use('/api/asaas', asaasRouter); // Rotas para integração com Asaas
app.use('/api/system/api', apiRouter); // Rotas para gerenciamento de APIs
app.use('/api/whatsapp', validateStoreActive, whatsappRouter); // Rotas para integração com WhatsApp
app.use('/api/whatsapp-webhook', whatsappWebhookRouter); // Webhook não precisa validar loja ativa
app.use('/api/telegram', telegramRouter); // Rotas para integração com Telegram
app.use('/api/liza', lizaRouter); // Rotas para chat com IA Liza
app.use('/api/reports', reportRouter); // Rotas para relatórios diários

// Rotas existentes (mantidas para compatibilidade)
app.use('/api/food', foodRouter); // Rotas para gerenciamento de comidas
app.use('/images', express.static('uploads')); // Servir imagens estáticas
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

// Inicializar agendador de relatórios
dailyReportScheduler.init();

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
    console.log('📊 Agendador de relatórios diários inicializado');
});
