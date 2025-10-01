import mongoose from 'mongoose';

console.log('🔍 Verificando conexões do MongoDB...');

// Verificar se já existe uma conexão ativa
console.log('Estado da conexão atual:', mongoose.connection.readyState);
console.log('0 = desconectado, 1 = conectado, 2 = conectando, 3 = desconectando');

// Verificar qual banco está sendo usado
if (mongoose.connection.readyState === 1) {
    console.log('Nome do banco:', mongoose.connection.db.databaseName);
    console.log('Host:', mongoose.connection.host);
    console.log('Port:', mongoose.connection.port);
}

// Listar todas as conexões
console.log('Conexões ativas:', mongoose.connections.length);
mongoose.connections.forEach((conn, index) => {
    console.log(`Conexão ${index}:`, {
        readyState: conn.readyState,
        name: conn.name,
        host: conn.host,
        port: conn.port
    });
});

process.exit(0);