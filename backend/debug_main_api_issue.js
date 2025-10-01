import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

const app = express();
const PORT = 4010;

// Middlewares básicos
app.use(express.json());
app.use(cors());

// Conectar ao banco principal
await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');

// Middleware de debug para logar todas as requisições
app.use((req, res, next) => {
    console.log(`\n=== ${req.method} ${req.path} ===`);
    console.log('Headers:', req.headers);
    console.log('Query:', req.query);
    console.log('Body:', req.body);
    next();
});

// Rota para testar query direta no banco
app.get('/debug/direct-query', async (req, res) => {
    try {
        console.log('\n--- TESTE DIRETO NO BANCO ---');
        
        // Query 1: Todos os produtos
        const allProducts = await foodModel.find({});
        console.log(`Total de produtos no banco: ${allProducts.length}`);
        
        // Query 2: Produtos ativos
        const activeProducts = await foodModel.find({ isActive: true });
        console.log(`Produtos ativos: ${activeProducts.length}`);
        
        // Query 3: Produtos de teste (busca mais ampla)
        const testProducts1 = await foodModel.find({ 
            name: { $regex: 'teste', $options: 'i' }
        });
        console.log(`Produtos com 'teste' no nome: ${testProducts1.length}`);
        
        const testProducts2 = await foodModel.find({ 
            name: { $regex: 'Teste', $options: 'i' }
        });
        console.log(`Produtos com 'Teste' no nome: ${testProducts2.length}`);
        
        const testProducts3 = await foodModel.find({ 
            name: /teste/i
        });
        console.log(`Produtos com regex /teste/i: ${testProducts3.length}`);
        
        // Query 4: Produtos de teste ativos
        const testProducts = await foodModel.find({ 
            name: { $regex: 'teste', $options: 'i' },
            isActive: true 
        });
        console.log(`Produtos de teste ativos: ${testProducts.length}`);
        
        // Query 5: Query exata da função listFood
        const listFoodQuery = { 
            $or: [
                { storeId: { $exists: false } },
                { storeId: null }
            ],
            isActive: true 
        };
        const listFoodProducts = await foodModel.find(listFoodQuery);
        console.log(`Query listFood: ${listFoodProducts.length}`);
        
        res.json({
            success: true,
            data: {
                total: allProducts.length,
                active: activeProducts.length,
                testProducts1: testProducts1.length,
                testProducts2: testProducts2.length,
                testProducts3: testProducts3.length,
                testProducts: testProducts.length,
                listFoodQuery: listFoodProducts.length,
                testProductsDetails: testProducts.map(p => ({
                    name: p.name,
                    isActive: p.isActive,
                    storeId: p.storeId
                })),
                allProductNames: allProducts.map(p => p.name)
            }
        });
    } catch (error) {
        console.error('Erro no teste direto:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Rota para simular exatamente a função listFood
app.get('/debug/simulate-listfood', async (req, res) => {
    try {
        console.log('\n--- SIMULANDO listFood ---');
        console.log('req.store:', req.store || 'UNDEFINED');
        
        const query = req.store 
            ? { storeId: req.store._id, isActive: true } 
            : { 
                $or: [
                    { storeId: { $exists: false } },
                    { storeId: null }
                ],
                isActive: true 
            };
            
        console.log('Query construída:', JSON.stringify(query, null, 2));
        
        const foods = await foodModel.find(query).sort({ createdAt: -1 });
        console.log(`Produtos encontrados: ${foods.length}`);
        
        const testFoods = foods.filter(food => 
            food.name.toLowerCase().includes('teste')
        );
        console.log(`Produtos de teste: ${testFoods.length}`);
        
        res.json({
            success: true,
            data: foods,
            testCount: testFoods.length,
            query: query
        });
    } catch (error) {
        console.error('Erro na simulação:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🔍 Servidor de debug da API principal rodando na porta ${PORT}`);
    console.log(`📊 Teste direto: http://localhost:${PORT}/debug/direct-query`);
    console.log(`🎯 Simulação listFood: http://localhost:${PORT}/debug/simulate-listfood`);
});