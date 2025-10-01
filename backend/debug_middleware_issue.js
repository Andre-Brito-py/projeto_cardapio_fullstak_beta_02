import express from 'express';
import mongoose from 'mongoose';
import { identifyStore } from './middleware/multiTenancy.js';
import foodModel from './models/foodModel.js';

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

// Rota de teste
app.get('/debug-list', async (req, res) => {
    try {
        console.log('\n=== EXECUTANDO QUERY ===');
        
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
            
        console.log(`📋 Query: ${JSON.stringify(query, null, 2)}`);
        
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
            query: query,
            products: foods.map(f => ({ 
                name: f.name, 
                storeId: f.storeId,
                isActive: f.isActive 
            }))
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = 4004;
app.listen(PORT, () => {
    console.log(`🚀 Servidor de debug middleware rodando na porta ${PORT}`);
    console.log(`📍 Teste: http://localhost:${PORT}/debug-list`);
});