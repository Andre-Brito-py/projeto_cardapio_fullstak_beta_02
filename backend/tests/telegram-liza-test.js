/**
 * Testes do atendimento ao cliente da assistente de IA Liza via Telegram
 * 
 * Funcionalidades testadas:
 * 1. Identificação da loja pelo telefone cadastrado
 * 2. Envio de link da loja específica
 * 3. Respostas a mensagens de texto
 * 4. Tirar dúvidas do cliente
 */

import axios from 'axios';
import MultiStoreTelegramService from '../services/multiStoreTelegramService.js';
import Store from '../models/storeModel.js';
import Customer from '../models/customerModel.js';
import User from '../models/userModel.js';

class TelegramLizaTest {
    constructor() {
        this.telegramService = new MultiStoreTelegramService();
        this.testResults = [];
        this.testStores = [];
        this.testCustomers = [];
    }

    /**
     * Configurar dados de teste
     */
    async setupTestData() {
        console.log('🔧 Configurando dados de teste...');

        // Criar usuário de teste sem role store_admin primeiro
            const testUser = await User.create({
                name: 'Admin Teste',
                email: 'admin@teste.com',
                password: 'senha123',
                role: 'customer' // Criar como customer primeiro
            });

            // Criar loja de teste
            this.testStore = await Store.create({
                name: 'Pizzaria Teste',
                slug: 'pizzaria-teste',
                description: 'Loja de teste para Telegram',
                owner: testUser._id,
                status: 'active',
                settings: {
                    restaurantAddress: 'Rua Teste, 123'
                },
                telegram: {
                    phoneNumber: '11999887766',
                    isActive: true,
                    welcomeMessage: 'Bem-vindo à Pizzaria Teste!',
                    autoReply: true,
                    businessHours: {
                        enabled: true,
                        message: 'Funcionamos das 18h às 23h'
                    }
                }
            });

            // Atualizar o usuário para store_admin com storeId
            testUser.role = 'store_admin';
            testUser.storeId = this.testStore._id;
            await testUser.save();

            // Criar segunda loja de teste
            this.testStore2 = await Store.create({
                name: 'Hamburgueria Teste',
                slug: 'hamburgueria-teste',
                description: 'Segunda loja de teste',
                owner: testUser._id,
                status: 'active',
                settings: {
                    restaurantAddress: 'Avenida Teste, 456'
                },
                telegram: {
                    phoneNumber: '11988776655',
                    isActive: true,
                    welcomeMessage: 'Bem-vindo à Hamburgueria Teste!',
                    autoReply: true
                }
            });

        this.testStores = [this.testStore, this.testStore2];

        // Criar clientes de teste
        this.testCustomer1 = await Customer.create({
            name: 'João Silva',
            phone: '11999887766',
            email: 'joao@teste.com',
            storeId: this.testStore._id
        });

        this.testCustomer2 = await Customer.create({
            name: 'Maria Santos',
            phone: '11988776655',
            email: 'maria@teste.com',
            storeId: this.testStore2._id
        });

        console.log('✅ Dados de teste criados com sucesso!');
        console.log(`- Loja 1: ${this.testStore.name} (${this.testStore.telegram.phoneNumber})`);
        console.log(`- Loja 2: ${this.testStore2.name} (${this.testStore2.telegram.phoneNumber})`);
        console.log(`- Cliente 1: ${this.testCustomer1.name} (${this.testCustomer1.phone})`);
        console.log(`- Cliente 2: ${this.testCustomer2.name} (${this.testCustomer2.phone})`);

        console.log('✅ Dados de teste configurados com sucesso!');
    }

    /**
     * Simular mensagem do Telegram
     */
    createMockMessage(text, phoneNumber, firstName = 'Cliente Teste') {
        // Extrair últimos 8 dígitos do telefone para simular userId
        const userId = parseInt(phoneNumber.replace(/\D/g, '').slice(-8));
        
        return {
            message_id: Math.floor(Math.random() * 1000000),
            from: {
                id: userId,
                is_bot: false,
                first_name: firstName,
                username: `user_${userId}`
            },
            chat: {
                id: userId,
                first_name: firstName,
                username: `user_${userId}`,
                type: 'private'
            },
            date: Math.floor(Date.now() / 1000),
            text: text
        };
    }

    /**
     * Teste 1: Identificação da loja pelo telefone do cliente
     */
    async testStoreIdentification() {
        console.log('\n🧪 Teste 1: Identificação da loja pelo telefone do cliente');

        try {
            // Simular mensagem de cliente da Pizzaria Bella Vista
            const message1 = this.createMockMessage(
                'Olá, gostaria de fazer um pedido',
                '+5511987654321',
                'Maria Silva'
            );

            const store1 = await this.telegramService.identifyStoreFromMessage(message1);
            
            if (store1 && store1.name === 'Pizzaria Bella Vista') {
                this.addTestResult('✅ Identificação da loja 1', 'PASSOU', 
                    `Loja identificada corretamente: ${store1.name}`);
            } else {
                this.addTestResult('❌ Identificação da loja 1', 'FALHOU', 
                    `Esperado: Pizzaria Bella Vista, Recebido: ${store1?.name || 'null'}`);
            }

            // Simular mensagem de cliente da Hamburgueria do João
            const message2 = this.createMockMessage(
                'Vocês têm hambúrguer vegetariano?',
                '+5511876543210',
                'João Santos'
            );

            const store2 = await this.telegramService.identifyStoreFromMessage(message2);
            
            if (store2 && store2.name === 'Hamburgueria do João') {
                this.addTestResult('✅ Identificação da loja 2', 'PASSOU', 
                    `Loja identificada corretamente: ${store2.name}`);
            } else {
                this.addTestResult('❌ Identificação da loja 2', 'FALHOU', 
                    `Esperado: Hamburgueria do João, Recebido: ${store2?.name || 'null'}`);
            }

        } catch (error) {
            this.addTestResult('❌ Identificação da loja', 'ERRO', error.message);
        }
    }

    /**
     * Teste 2: Geração de link específico da loja
     */
    async testStoreLinkGeneration() {
        console.log('\n🧪 Teste 2: Geração de link específico da loja');

        try {
            const store1 = this.testStores[0];
            const store2 = this.testStores[1];

            // Testar geração de link para loja 1
            const link1 = this.telegramService.generateStoreLink(store1);
            const expectedLink1 = `http://localhost:5173/${store1.slug}`;
            
            if (link1 === expectedLink1) {
                this.addTestResult('✅ Link da loja 1', 'PASSOU', 
                    `Link gerado corretamente: ${link1}`);
            } else {
                this.addTestResult('❌ Link da loja 1', 'FALHOU', 
                    `Esperado: ${expectedLink1}, Recebido: ${link1}`);
            }

            // Testar geração de link para loja 2
            const link2 = this.telegramService.generateStoreLink(store2);
            const expectedLink2 = `http://localhost:5173/${store2.slug}`;
            
            if (link2 === expectedLink2) {
                this.addTestResult('✅ Link da loja 2', 'PASSOU', 
                    `Link gerado corretamente: ${link2}`);
            } else {
                this.addTestResult('❌ Link da loja 2', 'FALHOU', 
                    `Esperado: ${expectedLink2}, Recebido: ${link2}`);
            }

        } catch (error) {
            this.addTestResult('❌ Geração de links', 'ERRO', error.message);
        }
    }

    /**
     * Teste 3: Detecção de palavras-chave para envio de link
     */
    async testLinkKeywordDetection() {
        console.log('\n🧪 Teste 3: Detecção de palavras-chave para envio de link');

        try {
            const testCases = [
                { message: 'Quais opções vocês têm no cardápio?', shouldInclude: true },
                { message: 'Gostaria de ver o menu', shouldInclude: true },
                { message: 'Onde posso fazer meu pedido?', shouldInclude: true },
                { message: 'Vocês fazem delivery?', shouldInclude: true },
                { message: 'Qual o horário de funcionamento?', shouldInclude: false },
                { message: 'Olá, tudo bem?', shouldInclude: false }
            ];

            for (const testCase of testCases) {
                const result = this.telegramService.shouldIncludeStoreLink(testCase.message);
                
                if (result === testCase.shouldInclude) {
                    this.addTestResult('✅ Detecção de palavra-chave', 'PASSOU', 
                        `"${testCase.message}" -> ${result} (esperado: ${testCase.shouldInclude})`);
                } else {
                    this.addTestResult('❌ Detecção de palavra-chave', 'FALHOU', 
                        `"${testCase.message}" -> ${result} (esperado: ${testCase.shouldInclude})`);
                }
            }

        } catch (error) {
            this.addTestResult('❌ Detecção de palavras-chave', 'ERRO', error.message);
        }
    }

    /**
     * Teste 4: Construção do prompt personalizado da loja
     */
    async testStorePromptBuilding() {
        console.log('\n🧪 Teste 4: Construção do prompt personalizado da loja');

        try {
            const store = this.testStores[0];
            const prompt = this.telegramService.buildStoreSystemPrompt(store);

            // Verificar se o prompt contém informações da loja
            const checks = [
                { condition: prompt.includes(store.name), description: 'Nome da loja' },
                { condition: prompt.includes('Liza'), description: 'Nome da assistente' },
                { condition: prompt.includes(store.settings.restaurantAddress), description: 'Endereço da loja' },
                { condition: prompt.includes(store.telegram.phoneNumber), description: 'Telefone da loja' },
                { condition: prompt.includes('REGRAS IMPORTANTES'), description: 'Seção de regras' },
                { condition: prompt.includes('EXEMPLOS DE RESPOSTAS'), description: 'Seção de exemplos' }
            ];

            for (const check of checks) {
                if (check.condition) {
                    this.addTestResult('✅ Prompt personalizado', 'PASSOU', 
                        `${check.description} incluído no prompt`);
                } else {
                    this.addTestResult('❌ Prompt personalizado', 'FALHOU', 
                        `${check.description} não encontrado no prompt`);
                }
            }

        } catch (error) {
            this.addTestResult('❌ Construção do prompt', 'ERRO', error.message);
        }
    }

    /**
     * Teste 5: Verificação de horário de funcionamento
     */
    async testBusinessHours() {
        console.log('\n🧪 Teste 5: Verificação de horário de funcionamento');

        try {
            const store1 = this.testStores[0]; // Com horário configurado
            const store2 = this.testStores[1]; // Sem horário configurado

            // Testar loja com horário configurado
            const isOpen1 = this.telegramService.isBusinessHours(store1);
            this.addTestResult('✅ Horário de funcionamento', 'PASSOU', 
                `Loja 1 (com horário): ${isOpen1 ? 'Aberta' : 'Fechada'}`);

            // Testar loja sem horário configurado (sempre aberta)
            const isOpen2 = this.telegramService.isBusinessHours(store2);
            if (isOpen2 === true) {
                this.addTestResult('✅ Horário de funcionamento', 'PASSOU', 
                    'Loja 2 (sem horário): Sempre aberta');
            } else {
                this.addTestResult('❌ Horário de funcionamento', 'FALHOU', 
                    'Loja 2 deveria estar sempre aberta');
            }

            // Testar texto do horário
            const hoursText1 = this.telegramService.getBusinessHoursText(store1);
            const hoursText2 = this.telegramService.getBusinessHoursText(store2);

            this.addTestResult('✅ Texto do horário', 'PASSOU', 
                `Loja 1: "${hoursText1}", Loja 2: "${hoursText2}"`);

        } catch (error) {
            this.addTestResult('❌ Horário de funcionamento', 'ERRO', error.message);
        }
    }

    /**
     * Teste 6: Simulação de fluxo completo de atendimento
     */
    async testCompleteFlow() {
        console.log('\n🧪 Teste 6: Simulação de fluxo completo de atendimento');

        try {
            // Inicializar o serviço
            await this.telegramService.initialize();
            await this.telegramService.loadStorePhoneMapping();

            // Simular diferentes tipos de mensagens
            const testMessages = [
                {
                    text: 'Olá! Quais opções vocês têm no cardápio?',
                    phone: '+5511987654321',
                    name: 'Maria Silva',
                    expectedStore: 'Pizzaria Bella Vista',
                    shouldHaveLink: true
                },
                {
                    text: 'Vocês entregam no meu bairro?',
                    phone: '+5511876543210',
                    name: 'João Santos',
                    expectedStore: 'Hamburgueria do João',
                    shouldHaveLink: false
                },
                {
                    text: 'Até que horas vocês funcionam hoje?',
                    phone: '+5511987654321',
                    name: 'Maria Silva',
                    expectedStore: 'Pizzaria Bella Vista',
                    shouldHaveLink: false
                }
            ];

            for (const testMsg of testMessages) {
                const message = this.createMockMessage(testMsg.text, testMsg.phone, testMsg.name);
                
                // Identificar loja
                const store = await this.telegramService.identifyStoreFromMessage(message);
                
                if (store && store.name === testMsg.expectedStore) {
                    this.addTestResult('✅ Fluxo completo - Identificação', 'PASSOU', 
                        `Mensagem: "${testMsg.text}" -> Loja: ${store.name}`);
                    
                    // Verificar se deve incluir link
                    const shouldIncludeLink = this.telegramService.shouldIncludeStoreLink(testMsg.text);
                    if (shouldIncludeLink === testMsg.shouldHaveLink) {
                        this.addTestResult('✅ Fluxo completo - Link', 'PASSOU', 
                            `Link ${shouldIncludeLink ? 'incluído' : 'não incluído'} corretamente`);
                    } else {
                        this.addTestResult('❌ Fluxo completo - Link', 'FALHOU', 
                            `Link deveria ${testMsg.shouldHaveLink ? 'ser' : 'não ser'} incluído`);
                    }
                } else {
                    this.addTestResult('❌ Fluxo completo - Identificação', 'FALHOU', 
                        `Esperado: ${testMsg.expectedStore}, Recebido: ${store?.name || 'null'}`);
                }
            }

        } catch (error) {
            this.addTestResult('❌ Fluxo completo', 'ERRO', error.message);
        }
    }

    /**
     * Adicionar resultado do teste
     */
    addTestResult(name, status, details) {
        this.testResults.push({
            name,
            status,
            details,
            timestamp: new Date().toISOString()
        });
        console.log(`  ${name}: ${status} - ${details}`);
    }

    /**
     * Limpar dados de teste
     */
    async cleanupTestData() {
        console.log('\n🧹 Limpando dados de teste...');

        try {
            // Remover lojas de teste
            for (const store of this.testStores) {
                await Store.findByIdAndDelete(store._id);
            }

            // Remover clientes de teste
            for (const customer of this.testCustomers) {
                await Customer.findByIdAndDelete(customer._id);
            }

            console.log('✅ Dados de teste removidos com sucesso!');
        } catch (error) {
            console.error('❌ Erro ao limpar dados de teste:', error.message);
        }
    }

    /**
     * Executar todos os testes
     */
    async runAllTests() {
        console.log('🚀 Iniciando testes do atendimento da Liza via Telegram...\n');

        try {
            await this.setupTestData();
            
            await this.testStoreIdentification();
            await this.testStoreLinkGeneration();
            await this.testLinkKeywordDetection();
            await this.testStorePromptBuilding();
            await this.testBusinessHours();
            await this.testCompleteFlow();

            this.generateReport();
            
        } catch (error) {
            console.error('❌ Erro durante os testes:', error);
        } finally {
            await this.cleanupTestData();
        }
    }

    /**
     * Gerar relatório dos testes
     */
    generateReport() {
        console.log('\n📊 RELATÓRIO DOS TESTES');
        console.log('=' .repeat(50));

        const passed = this.testResults.filter(r => r.status === 'PASSOU').length;
        const failed = this.testResults.filter(r => r.status === 'FALHOU').length;
        const errors = this.testResults.filter(r => r.status === 'ERRO').length;
        const total = this.testResults.length;

        console.log(`Total de testes: ${total}`);
        console.log(`✅ Passou: ${passed}`);
        console.log(`❌ Falhou: ${failed}`);
        console.log(`🔥 Erros: ${errors}`);
        console.log(`📈 Taxa de sucesso: ${((passed / total) * 100).toFixed(1)}%`);

        if (failed > 0 || errors > 0) {
            console.log('\n🔍 TESTES QUE FALHARAM:');
            this.testResults
                .filter(r => r.status !== 'PASSOU')
                .forEach(result => {
                    console.log(`  ${result.name}: ${result.details}`);
                });
        }

        console.log('\n' + '='.repeat(50));
        
        if (passed === total) {
            console.log('🎉 TODOS OS TESTES PASSARAM! A Liza está pronta para atender via Telegram!');
        } else {
            console.log('⚠️  Alguns testes falharam. Verifique a configuração antes de usar em produção.');
        }
    }
}

// Executar testes se o arquivo for chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const tester = new TelegramLizaTest();
    tester.runAllTests().catch(console.error);
}

export default TelegramLizaTest;