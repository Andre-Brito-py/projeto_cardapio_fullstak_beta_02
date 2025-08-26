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

// Utilitários
import { populateInitialCategories } from './populateCategories.js';
import 'dotenv/config';

// Configuração da aplicação
const app = express();
const port = process.env.PORT || 4000;

// Configuração de middlewares
app.use(express.json()); // Parser para JSON
app.use(cors()); // Habilita CORS para requisições cross-origin

// Conexão com o banco de dados MongoDB
connectDB();

// Configuração das rotas da API
app.use('/api/food', foodRouter); // Rotas para gerenciamento de comidas
app.use('/images', express.static('uploads')); // Servir imagens estáticas
app.use('/api/user', userRouter); // Rotas para autenticação e usuários
app.use('/api/cart', cartRouter); // Rotas para carrinho de compras
app.use('/api/order', orderRouter); // Rotas para pedidos
app.use('/api/category', categoryRouter); // Rotas para categorias
app.use('/api/settings', settingsRouter); // Rotas para configurações do sistema
app.use('/api/banner', bannerRouter); // Rotas para banners
app.use('/api/print', printRouter); // Rotas para impressão Bluetooth

// Rota de teste da API
app.get('/', (req, res) => {
    res.send('API working');
});

// Inicialização do servidor
app.listen(port, () => {
    console.log(`Server started on http://localhost:${port}`);
    
    // Popula categorias iniciais após 2 segundos (aguarda conexão com DB)
    setTimeout(() => {
        populateInitialCategories();
    }, 2000);
});
