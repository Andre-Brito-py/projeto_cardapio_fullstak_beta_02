#!/usr/bin/env node

/**
 * Script para executar testes do atendimento da Liza via Telegram
 * 
 * Uso:
 * node scripts/run-telegram-tests.js
 * 
 * ou
 * 
 * npm run test:telegram
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import TelegramLizaTest from '../tests/telegram-liza-test.js';

// Carregar variáveis de ambiente
dotenv.config();

async function main() {
    console.log('🔧 Configurando ambiente de teste...');
    
    try {
        // Conectar ao banco de dados
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/pede_ai_test';
        await mongoose.connect(mongoUri);
        console.log('✅ Conectado ao banco de dados de teste');

        // Executar testes
        const tester = new TelegramLizaTest();
        await tester.runAllTests();

    } catch (error) {
        console.error('❌ Erro ao executar testes:', error);
        process.exit(1);
    } finally {
        // Desconectar do banco
        await mongoose.disconnect();
        console.log('🔌 Desconectado do banco de dados');
        process.exit(0);
    }
}

// Executar script
main().catch(console.error);