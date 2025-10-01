import express from 'express';
import mongoose from 'mongoose';
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
        console.log(`📤 Resposta:`, JSON.stringify(data, null, 2));
        return originalJson.call(this, data);
    };
    
    next();
});

// Usar as rotas de food exatamente como na API real
app.use('/api/food', foodRouter);

const PORT = 4005;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de debug da API real rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/api/food/list`);
});