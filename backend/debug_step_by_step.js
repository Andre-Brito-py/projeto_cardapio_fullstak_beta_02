import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import foodRouter from './routes/foodRoute.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const app = express();

// Middleware de debug para interceptar todas as requisições
app.use((req, res, next) => {
    console.log(`\n🔍 ${req.method} ${req.url}`);
    console.log(`📋 Headers:`, req.headers);
    
    // Interceptar a resposta
    const originalJson = res.json;
    res.json = function(data) {
        if (data && Array.isArray(data.data)) {
            const testProducts = data.data.filter(food => 
                food.name && food.name.toLowerCase().includes('teste')
            );
            console.log(`📊 Total de produtos: ${data.data.length}`);
            console.log(`🧪 Produtos de teste: ${testProducts.length}`);
            if (testProducts.length > 0) {
                console.log(`🧪 Produtos de teste encontrados:`, testProducts.map(p => p.name));
            }
        }
        console.log(`📤 Resposta (primeiros 500 chars):`, JSON.stringify(data, null, 2).substring(0, 500));
        return originalJson.call(this, data);
    };
    
    next();
});

// STEP 1: Adicionar express.json() como no servidor principal
app.use(express.json());

// STEP 2: Adicionar CORS como no servidor principal
app.use(cors({
    origin: [
        'http://localhost:5173', // Frontend
        'http://localhost:5174', // Admin
        'http://localhost:5176'  // Counter
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Store-ID']
}));

// STEP 3: Usar as rotas de food exatamente como na API real
app.use('/api/food', foodRouter);

const PORT = 4007;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de debug step-by-step rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/api/food/list`);
});