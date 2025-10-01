import express from 'express';
import mongoose from 'mongoose';
import { identifyStore } from './middleware/multiTenancy.js';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del');

const app = express();

// Middleware de debug
app.use((req, res, next) => {
    console.log(`\n🔍 Request para: ${req.path}`);
    console.log(`📋 Headers: ${JSON.stringify(req.headers, null, 2)}`);
    next();
});

// Aplicar o middleware identifyStore
app.use(identifyStore);

// Middleware para debugar o que o identifyStore fez
app.use((req, res, next) => {
    console.log(`🏪 Store identificada: ${req.store ? 'SIM' : 'NÃO'}`);
    if (req.store) {
        console.log(`   ID: ${req.store._id}`);
        console.log(`   Nome: ${req.store.name}`);
    }
    console.log(`🆔 Store ID: ${req.storeId || 'undefined'}`);
    next();
});

// Rota de teste
app.get('/test-list', async (req, res) => {
    try {
        // Replicar a lógica exata da função listFood
        const query = req.store 
            ? { storeId: req.store._id, isActive: true } 
            : { 
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                isActive: true 
            };
            
        console.log(`📋 Query que será executada: ${JSON.stringify(query, null, 2)}`);
        
        const foods = await foodModel.find(query);
        
        console.log(`📊 Produtos encontrados: ${foods.length}`);
        
        const testProducts = foods.filter(food => 
            food.name.toLowerCase().includes('teste')
        );
        
        console.log(`🧪 Produtos de teste: ${testProducts.length}`);
        
        res.json({
            success: true,
            hasStore: !!req.store,
            storeId: req.storeId,
            totalProducts: foods.length,
            testProducts: testProducts.length,
            products: foods.map(f => ({ name: f.name, storeId: f.storeId }))
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4002;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de debug rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/test-list`);
});