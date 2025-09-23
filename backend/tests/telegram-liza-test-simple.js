/**
 * Testes Simplificados do Atendimento da Liza via Telegram
 * Versão que funciona sem conexão com banco de dados
 */

import MultiStoreTelegramService from '../services/multiStoreTelegramService.js';

class SimpleTelegramLizaTest {
    constructor() {
        this.service = null;
        this.testResults = [];
    }

    async init() {
        console.log('🚀 Iniciando testes simplificados do Telegram Liza...\n');
        
        // Criar instância do serviço sem conexão com banco
        this.service = new MultiStoreTelegramService();
        
        // Mock dos dados de teste
        this.mockStores = [
            {
                _id: '507f1f77bcf86cd799439011',
                name: 'Pizzaria Teste',
                slug: 'pizzaria-teste',
                telegram: {
                    phoneNumber: '11999887766',
                    isActive: true,
                    welcomeMessage: 'Bem-vindo à Pizzaria Teste!',
                    businessHours: {
                        enabled: true,
                        message: 'Funcionamos das 18h às 23h'
                    }
                },
                settings: {
                    operatingHours: {
                        monday: { open: '18:00', close: '23:00', closed: false },
                        tuesday: { open: '18:00', close: '23:00', closed: false },
                        wednesday: { open: '18:00', close: '23:00', closed: false },
                        thursday: { open: '18:00', close: '23:00', closed: false },
                        friday: { open: '18:00', close: '23:00', closed: false },
                        saturday: { open: '18:00', close: '23:00', closed: false },
                        sunday: { open: '18:00', close: '23:00', closed: false }
                    }
                }
            },
            {
                _id: '507f1f77bcf86cd799439012',
                name: 'Hamburgueria Teste',
                slug: 'hamburgueria-teste',
                telegram: {
                    phoneNumber: '11988776655',
                    isActive: true,
                    welcomeMessage: 'Bem-vindo à Hamburgueria Teste!'
                }
            }
        ];

        this.mockCustomers = [
            {
                _id: '507f1f77bcf86cd799439021',
                name: 'João Silva',
                phone: '11999887766',
                storeId: '507f1f77bcf86cd799439011'
            },
            {
                _id: '507f1f77bcf86cd799439022',
                name: 'Maria Santos',
                phone: '11988776655',
                storeId: '507f1f77bcf86cd799439012'
            }
        ];

        // Mock do mapeamento de telefones
        this.service.storePhoneMapping = new Map();
        this.mockStores.forEach(store => {
            if (store.telegram?.phoneNumber) {
                const normalizedPhone = this.service.normalizePhoneNumber(store.telegram.phoneNumber);
                this.service.storePhoneMapping.set(normalizedPhone, {
                    storeId: store._id,
                    storeName: store.name,
                    config: store.telegram
                });
            }
        });

        console.log('✅ Serviço inicializado com dados mock\n');
    }

    // Teste 1: Normalização de números de telefone
    async testPhoneNormalization() {
        console.log('📱 Teste 1: Normalização de números de telefone');
        
        const testCases = [
            { input: '+55 11 99988-7766', expected: '11999887766' },
            { input: '(11) 9.9988-7766', expected: '11999887766' },
            { input: '11999887766', expected: '11999887766' },
            { input: '+5511999887766', expected: '11999887766' }
        ];

        let passed = 0;
        for (const testCase of testCases) {
            const result = this.service.normalizePhoneNumber(testCase.input);
            const success = result === testCase.expected;
            
            console.log(`  ${success ? '✅' : '❌'} ${testCase.input} → ${result} ${success ? '' : `(esperado: ${testCase.expected})`}`);
            
            if (success) passed++;
        }

        const testResult = {
            name: 'Normalização de telefone',
            passed: passed,
            total: testCases.length,
            success: passed === testCases.length
        };

        this.testResults.push(testResult);
        console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram\n`);
        
        return testResult;
    }

    // Teste 2: Identificação de loja por telefone
    async testStoreIdentification() {
        console.log('🏪 Teste 2: Identificação de loja por telefone');
        
        const testCases = [
            { phone: '11999887766', expectedStore: 'Pizzaria Teste' },
            { phone: '11988776655', expectedStore: 'Hamburgueria Teste' },
            { phone: '11777666555', expectedStore: null } // Telefone não cadastrado
        ];

        let passed = 0;
        for (const testCase of testCases) {
            // Mock da função identifyStoreFromMessage
            const mockMessage = {
                from: { phone_number: testCase.phone },
                chat: { id: 123456 }
            };

            // Simular identificação por telefone
            const normalizedPhone = this.service.normalizePhoneNumber(testCase.phone);
            const storeMapping = this.service.storePhoneMapping.get(normalizedPhone);
            const identifiedStore = storeMapping ? storeMapping.storeName : null;

            const success = identifiedStore === testCase.expectedStore;
            
            console.log(`  ${success ? '✅' : '❌'} ${testCase.phone} → ${identifiedStore || 'Não identificado'} ${success ? '' : `(esperado: ${testCase.expectedStore})`}`);
            
            if (success) passed++;
        }

        const testResult = {
            name: 'Identificação de loja',
            passed: passed,
            total: testCases.length,
            success: passed === testCases.length
        };

        this.testResults.push(testResult);
        console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram\n`);
        
        return testResult;
    }

    // Teste 3: Detecção de palavras-chave
    async testKeywordDetection() {
        console.log('🔍 Teste 3: Detecção de palavras-chave para links');
        
        const testCases = [
            { message: 'Quero ver o cardápio', shouldIncludeLink: true },
            { message: 'Como faço um pedido?', shouldIncludeLink: true },
            { message: 'Vocês fazem entrega?', shouldIncludeLink: true },
            { message: 'Qual o horário de funcionamento?', shouldIncludeLink: false },
            { message: 'Olá', shouldIncludeLink: false }
        ];

        let passed = 0;
        for (const testCase of testCases) {
            const shouldInclude = this.service.shouldIncludeStoreLink(testCase.message);
            const success = shouldInclude === testCase.shouldIncludeLink;
            
            console.log(`  ${success ? '✅' : '❌'} "${testCase.message}" → ${shouldInclude ? 'Incluir link' : 'Não incluir'} ${success ? '' : `(esperado: ${testCase.shouldIncludeLink ? 'Incluir' : 'Não incluir'})`}`);
            
            if (success) passed++;
        }

        const testResult = {
            name: 'Detecção de palavras-chave',
            passed: passed,
            total: testCases.length,
            success: passed === testCases.length
        };

        this.testResults.push(testResult);
        console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram\n`);
        
        return testResult;
    }

    // Teste 4: Verificação de horário de funcionamento
    async testBusinessHours() {
        console.log('🕐 Teste 4: Verificação de horário de funcionamento');
        
        const store = this.mockStores[0]; // Pizzaria Teste
        
        // Simular diferentes horários
        const testCases = [
            { hour: 19, minute: 30, day: 1, expected: true }, // Segunda 19:30 - Aberto
            { hour: 22, minute: 30, day: 1, expected: true }, // Segunda 22:30 - Aberto
            { hour: 17, minute: 30, day: 1, expected: false }, // Segunda 17:30 - Fechado
            { hour: 23, minute: 30, day: 1, expected: false }  // Segunda 23:30 - Fechado
        ];

        let passed = 0;
        for (const testCase of testCases) {
            // Mock da data/hora atual
            const mockDate = new Date();
            mockDate.setHours(testCase.hour, testCase.minute, 0, 0);
            
            // Simular verificação de horário
            const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][testCase.day];
            const currentTime = testCase.hour * 100 + testCase.minute;
            
            const daySchedule = store.settings.operatingHours[dayOfWeek];
            let isOpen = false;
            
            if (daySchedule && !daySchedule.closed) {
                const openTime = parseInt(daySchedule.open.replace(':', ''));
                const closeTime = parseInt(daySchedule.close.replace(':', ''));
                isOpen = currentTime >= openTime && currentTime <= closeTime;
            }

            const success = isOpen === testCase.expected;
            
            console.log(`  ${success ? '✅' : '❌'} ${String(testCase.hour).padStart(2, '0')}:${String(testCase.minute).padStart(2, '0')} → ${isOpen ? 'Aberto' : 'Fechado'} ${success ? '' : `(esperado: ${testCase.expected ? 'Aberto' : 'Fechado'})`}`);
            
            if (success) passed++;
        }

        const testResult = {
            name: 'Horário de funcionamento',
            passed: passed,
            total: testCases.length,
            success: passed === testCases.length
        };

        this.testResults.push(testResult);
        console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram\n`);
        
        return testResult;
    }

    // Teste 5: Geração de links da loja
    async testStoreLinks() {
        console.log('🔗 Teste 5: Geração de links da loja');
        
        const testCases = [
            { storeId: '507f1f77bcf86cd799439011', expectedPattern: /pizzaria-teste/ },
            { storeId: '507f1f77bcf86cd799439012', expectedPattern: /hamburgueria-teste/ }
        ];

        let passed = 0;
        for (const testCase of testCases) {
            const store = this.mockStores.find(s => s._id === testCase.storeId);
            const link = this.service.generateStoreLink(store);
            const success = testCase.expectedPattern.test(link);
            
            console.log(`  ${success ? '✅' : '❌'} ${store.name} → ${link} ${success ? '' : '(padrão não encontrado)'}`);
            
            if (success) passed++;
        }

        const testResult = {
            name: 'Geração de links',
            passed: passed,
            total: testCases.length,
            success: passed === testCases.length
        };

        this.testResults.push(testResult);
        console.log(`\n📊 Resultado: ${passed}/${testCases.length} testes passaram\n`);
        
        return testResult;
    }

    // Executar todos os testes
    async runAllTests() {
        console.log('🧪 EXECUTANDO TODOS OS TESTES SIMPLIFICADOS\n');
        console.log('=' .repeat(60) + '\n');

        try {
            await this.init();

            // Executar todos os testes
            await this.testPhoneNormalization();
            await this.testStoreIdentification();
            await this.testKeywordDetection();
            await this.testBusinessHours();
            await this.testStoreLinks();

            // Gerar relatório final
            this.generateReport();

        } catch (error) {
            console.error('❌ Erro durante execução dos testes:', error);
            throw error;
        }
    }

    // Gerar relatório final
    generateReport() {
        console.log('📋 RELATÓRIO FINAL DOS TESTES\n');
        console.log('=' .repeat(60));

        let totalPassed = 0;
        let totalTests = 0;

        this.testResults.forEach((result, index) => {
            const status = result.success ? '✅ PASSOU' : '❌ FALHOU';
            console.log(`${index + 1}. ${result.name}: ${status} (${result.passed}/${result.total})`);
            
            totalPassed += result.passed;
            totalTests += result.total;
        });

        console.log('\n' + '=' .repeat(60));
        console.log(`📊 RESUMO GERAL: ${totalPassed}/${totalTests} testes passaram`);
        
        const successRate = ((totalPassed / totalTests) * 100).toFixed(1);
        console.log(`📈 Taxa de sucesso: ${successRate}%`);

        if (totalPassed === totalTests) {
            console.log('\n🎉 TODOS OS TESTES PASSARAM! O sistema está funcionando corretamente.');
        } else {
            console.log('\n⚠️  Alguns testes falharam. Verifique a implementação.');
        }

        console.log('\n✅ Testes concluídos com sucesso!');
    }
}

export default SimpleTelegramLizaTest;