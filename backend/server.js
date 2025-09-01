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

import productSuggestionRouter from './routes/productSuggestionRoute.js';
import asaasRouter from './routes/asaasRoutes.js';
import apiRouter from './routes/apiRoutes.js';

// Configuração da aplicação
const app = express();
const port = process.env.PORT || 4000;

// Configuração de middlewares
app.use(express.json()); // Parser para JSON
app.use(cors()); // Habilita CORS para requisições cross-origin

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

app.use('/api/product-suggestions', productSuggestionRouter); // Rotas para sugestões de produtos
app.use('/api/asaas', asaasRouter); // Rotas para integração com Asaas
app.use('/api/system/api', apiRouter); // Rotas para gerenciamento de APIs

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

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
});
