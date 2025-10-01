import express from 'express';
import mongoose from 'mongoose';
import { identifyStore } from './middleware/multiTenancy.js';
import { listFood } from './controllers/foodController.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const app = express();

// Middleware de debug ANTES do identifyStore
app.use((req, res, next) => {
    console.log('\n=== ANTES DO identifyStore ===');
    console.log(`🔍 URL: ${req.url}`);
    console.log(`🏠 Host: ${req.get('host')}`);
    console.log(`🆔 X-Store-ID: ${req.get('X-Store-ID')}`);
    console.log(`🔑 Authorization: ${req.get('authorization') ? 'PRESENTE' : 'AUSENTE'}`);
    console.log(`📋 req.store: ${req.store || 'undefined'}`);
    console.log(`🆔 req.storeId: ${req.storeId || 'undefined'}`);
    next();
});

// Aplicar o middleware identifyStore
app.use(identifyStore);

// Middleware de debug DEPOIS do identifyStore
app.use((req, res, next) => {
    console.log('\n=== DEPOIS DO identifyStore ===');
    console.log(`📋 req.store: ${req.store ? 'DEFINIDO' : 'undefined'}`);
    if (req.store) {
        console.log(`   Nome: ${req.store.name}`);
        console.log(`   ID: ${req.store._id}`);
        console.log(`   Status: ${req.store.status}`);
    }
    console.log(`🆔 req.storeId: ${req.storeId || 'undefined'}`);
    next();
});

// Rota de teste usando a função listFood real
app.get('/test-middleware', (req, res) => {
    console.log('\n=== EXECUTANDO listFood ===');
    listFood(req, res);
});

const PORT = 4008;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de teste de middleware rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/test-middleware`);
});