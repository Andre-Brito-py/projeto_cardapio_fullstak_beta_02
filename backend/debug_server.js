// Configuração das variáveis de ambiente (DEVE ser o primeiro import)
import 'dotenv/config';

// Importações principais
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';

// Importações das rotas
import foodRouter from './routes/foodRoute.js';

// Configuração da aplicação
const app = express();
const port = process.env.PORT || 4006;

// Middleware básico
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials: true
}));

// Middleware de debug global
app.use((req, res, next) => {
    console.log(`\n🔍 ${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`📋 Headers:`, JSON.stringify(req.headers, null, 2));
    
    // Interceptar a resposta
    const originalJson = res.json;
    res.json = function(data) {
        console.log(`📤 Resposta para ${req.url}:`);
        console.log(`   Success: ${data.success}`);
        if (data.data && Array.isArray(data.data)) {
            console.log(`   Total items: ${data.data.length}`);
            const testItems = data.data.filter(item => item.name && item.name.toLowerCase().includes('teste'));
            console.log(`   Test items: ${testItems.length}`);
            if (testItems.length > 0) {
                console.log(`   Test items found:`, testItems.map(item => ({ name: item.name, storeId: item.storeId })));
            }
        }
        return originalJson.call(this, data);
    };
    
    next();
});

// Conexão com o banco de dados MongoDB
connectDB();

// Configuração das rotas da API
app.use('/api/food', foodRouter);

// Servir imagens estáticas
app.use('/images', express.static('uploads'));

// Inicialização do servidor
app.listen(port, () => {
    console.log(`🚀 Servidor de debug rodando na porta ${port}`);
    console.log(`📍 API: http://localhost:${port}/api/food/list`);
});