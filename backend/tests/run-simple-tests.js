#!/usr/bin/env node

/**
 * Script para executar os testes simplificados do Telegram Liza
 * Funciona sem conexão com banco de dados
 */

import SimpleTelegramLizaTest from './telegram-liza-test-simple.js';

async function runTests() {
    const tester = new SimpleTelegramLizaTest();
    
    try {
        await tester.runAllTests();
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Falha na execução dos testes:', error.message);
        process.exit(1);
    }
}

// Executar os testes
runTests();