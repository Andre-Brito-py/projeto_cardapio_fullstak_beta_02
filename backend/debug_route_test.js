import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { listFood, listFoodWithAddonInfo } from './controllers/foodController.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const app = express();
const port = 4009;

// Middlewares básicos
app.use(express.json());
app.use(cors());

// Middleware de debug
app.use((req, res, next) => {
    console.log(`\n🔍 ${req.method} ${req.url}`);
    console.log(`📋 req.store: ${req.store ? 'PRESENTE' : 'AUSENTE'}`);
    next();
});

// Rota 1: Simular exatamente como está no foodRoute.js - sem middleware
app.get('/api/food/list', listFood);

// Rota 2: Simular com addStoreContext (mas sem implementar o middleware completo)
app.get('/api/food/with-addon-info', (req, res, next) => {
    console.log('🏪 Simulando addStoreContext - definindo req.store como null');
    req.store = null;
    next();
}, listFoodWithAddonInfo);

// Rota 3: Teste direto da função listFood
app.get('/api/food/direct-test', (req, res) => {
    console.log('🧪 Teste direto da função listFood');
    req.store = null;
    listFood(req, res);
});

app.listen(port, () => {
    console.log(`🚀 Servidor de teste de rotas rodando na porta ${port}`);
    console.log(`📍 Testes disponíveis:`);
    console.log(`   - http://localhost:${port}/api/food/list`);
    console.log(`   - http://localhost:${port}/api/food/with-addon-info`);
    console.log(`   - http://localhost:${port}/api/food/direct-test`);
});