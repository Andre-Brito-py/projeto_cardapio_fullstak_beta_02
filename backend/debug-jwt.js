import 'dotenv/config';
import jwt from 'jsonwebtoken';

console.log('=== DEBUG JWT ===');
console.log('JWT_SECRET from env:', process.env.JWT_SECRET);
console.log('JWT_SECRET length:', process.env.JWT_SECRET?.length);

// Testar geração e verificação de token
const testPayload = {
    storeId: '676b4b7b8b8b8b8b8b8b8b8b',
    type: 'waiter',
    timestamp: Date.now()
};

try {
    // Gerar token
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log('Token gerado:', token);
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Token decodificado:', decoded);
    
    console.log('✅ JWT funcionando corretamente');
} catch (error) {
    console.error('❌ Erro no JWT:', error.message);
}

process.exit(0);