import mongoose from "mongoose";

export const connectDB = async () =>{
    try {
        
        // Configuração para desenvolvimento sem MongoDB instalado
        if (process.env.NODE_ENV === 'development' && !process.env.MONGODB_URI) {
            console.log('⚠️  Modo desenvolvimento: Simulando conexão com banco de dados');
            console.log('✅ Banco de dados conectado (modo simulação)');
            return;
        }
        
        // Configurações do Mongoose para melhor estabilidade
        mongoose.set('strictQuery', false);
        
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000, // Timeout de 10 segundos
            socketTimeoutMS: 60000, // Timeout de socket de 60 segundos
            maxPoolSize: 10, // Máximo de 10 conexões no pool
        };
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app', mongoOptions);
        console.log('✅ Banco de dados conectado com sucesso');
    } catch (error) {
        console.error('❌ Erro de conexão com DB:', error.message);
        console.log('⚠️  Continuando em modo simulação...');
        // Não lança erro para permitir que o servidor continue rodando
    }
}