import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Função para gerar token de garçom
const generateWaiterToken = (storeId) => {
    return jwt.sign(
        { 
            storeId: storeId,
            type: 'waiter',
            timestamp: Date.now()
        },
        'random#secret',
        { expiresIn: '30d' } // Token válido por 30 dias
    );
};

// Gerar token para a loja de teste
const storeId = '676b4b7b8b8b8b8b8b8b8b8b'; // ID da loja de teste
const token = generateWaiterToken(storeId);
const baseUrl = 'http://localhost:5174';
const waiterLink = `${baseUrl}/waiter-order/${storeId}?token=${token}`;

console.log('Token JWT gerado:', token);
console.log('Link do garçom:', waiterLink);
console.log('\nPara testar, acesse:', waiterLink);