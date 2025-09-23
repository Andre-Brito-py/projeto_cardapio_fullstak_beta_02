/**
 * Teste Manual Interativo do Telegram com Liza
 * 
 * Este script permite testar manualmente o atendimento da Liza via Telegram
 * simulando mensagens reais de clientes para diferentes lojas.
 */

import readline from 'readline';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import MultiStoreTelegramService from '../services/multiStoreTelegramService.js';
import Store from '../models/storeModel.js';
import Customer from '../models/customerModel.js';

dotenv.config();

class TelegramManualTest {
    constructor() {
        this.telegramService = new MultiStoreTelegramService();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        this.currentStore = null;
        this.currentCustomer = null;
        this.stores = [];
        this.customers = [];
    }

    /**
     * Inicializar teste manual
     */
    async initialize() {
        console.log('🚀 Iniciando teste manual do Telegram com Liza...\n');

        try {
            // Conectar ao banco
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pede_ai');
            console.log('✅ Conectado ao banco de dados');

            // Inicializar serviço do Telegram
            await this.telegramService.initialize();
            await this.telegramService.loadStorePhoneMapping();
            console.log('✅ Serviço do Telegram inicializado');

            // Carregar lojas e clientes
            await this.loadStoresAndCustomers();

            // Mostrar menu principal
            this.showMainMenu();

        } catch (error) {
            console.error('❌ Erro na inicialização:', error);
            process.exit(1);
        }
    }

    /**
     * Carregar lojas e clientes do banco
     */
    async loadStoresAndCustomers() {
        try {
            this.stores = await Store.find({ 'telegram.isActive': true }).lean();
            this.customers = await Customer.find().populate('storeId', 'name').lean();

            console.log(`📊 Carregadas ${this.stores.length} lojas ativas no Telegram`);
            console.log(`👥 Carregados ${this.customers.length} clientes cadastrados\n`);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
        }
    }

    /**
     * Mostrar menu principal
     */
    showMainMenu() {
        console.log('📋 MENU PRINCIPAL');
        console.log('================');
        console.log('1. Listar lojas disponíveis');
        console.log('2. Listar clientes cadastrados');
        console.log('3. Simular conversa com cliente');
        console.log('4. Testar identificação de loja');
        console.log('5. Testar geração de links');
        console.log('6. Executar testes automáticos');
        console.log('0. Sair\n');

        this.rl.question('Escolha uma opção: ', (answer) => {
            this.handleMainMenuChoice(answer.trim());
        });
    }

    /**
     * Processar escolha do menu principal
     */
    async handleMainMenuChoice(choice) {
        switch (choice) {
            case '1':
                this.listStores();
                break;
            case '2':
                this.listCustomers();
                break;
            case '3':
                await this.simulateConversation();
                break;
            case '4':
                await this.testStoreIdentification();
                break;
            case '5':
                await this.testLinkGeneration();
                break;
            case '6':
                await this.runAutomaticTests();
                break;
            case '0':
                this.exit();
                break;
            default:
                console.log('❌ Opção inválida. Tente novamente.\n');
                this.showMainMenu();
        }
    }

    /**
     * Listar lojas disponíveis
     */
    listStores() {
        console.log('\n🏪 LOJAS DISPONÍVEIS');
        console.log('===================');
        
        if (this.stores.length === 0) {
            console.log('Nenhuma loja encontrada com Telegram ativo.\n');
        } else {
            this.stores.forEach((store, index) => {
                console.log(`${index + 1}. ${store.name}`);
                console.log(`   📞 Telefone: ${store.telegram?.phoneNumber || 'Não informado'}`);
                console.log(`   🔗 Slug: ${store.slug}`);
                console.log(`   📍 Endereço: ${store.settings?.restaurantAddress || 'Não informado'}`);
                console.log('');
            });
        }

        this.showMainMenu();
    }

    /**
     * Listar clientes cadastrados
     */
    listCustomers() {
        console.log('\n👥 CLIENTES CADASTRADOS');
        console.log('======================');
        
        if (this.customers.length === 0) {
            console.log('Nenhum cliente encontrado.\n');
        } else {
            this.customers.forEach((customer, index) => {
                console.log(`${index + 1}. ${customer.name}`);
                console.log(`   📞 Telefone: ${customer.phone}`);
                console.log(`   🏪 Loja: ${customer.storeId?.name || 'Não informado'}`);
                console.log('');
            });
        }

        this.showMainMenu();
    }

    /**
     * Simular conversa com cliente
     */
    async simulateConversation() {
        console.log('\n💬 SIMULAÇÃO DE CONVERSA');
        console.log('========================');

        // Escolher cliente
        if (this.customers.length === 0) {
            console.log('❌ Nenhum cliente cadastrado. Cadastre um cliente primeiro.\n');
            this.showMainMenu();
            return;
        }

        console.log('Escolha um cliente:');
        this.customers.forEach((customer, index) => {
            console.log(`${index + 1}. ${customer.name} (${customer.phone}) - ${customer.storeId?.name}`);
        });

        this.rl.question('\nNúmero do cliente: ', async (answer) => {
            const customerIndex = parseInt(answer) - 1;
            
            if (customerIndex < 0 || customerIndex >= this.customers.length) {
                console.log('❌ Cliente inválido.\n');
                this.showMainMenu();
                return;
            }

            this.currentCustomer = this.customers[customerIndex];
            console.log(`\n✅ Cliente selecionado: ${this.currentCustomer.name}`);
            console.log('Digite "sair" para voltar ao menu principal\n');

            this.startConversationLoop();
        });
    }

    /**
     * Loop de conversa
     */
    startConversationLoop() {
        this.rl.question(`${this.currentCustomer.name}: `, async (message) => {
            if (message.toLowerCase() === 'sair') {
                this.currentCustomer = null;
                this.showMainMenu();
                return;
            }

            try {
                // Criar mensagem simulada
                const mockMessage = this.createMockMessage(
                    message,
                    this.currentCustomer.phone,
                    this.currentCustomer.name
                );

                // Identificar loja
                const store = await this.telegramService.identifyStoreFromMessage(mockMessage);
                
                if (!store) {
                    console.log('❌ Loja não identificada\n');
                    this.startConversationLoop();
                    return;
                }

                console.log(`🏪 Loja identificada: ${store.name}`);

                // Processar mensagem com Liza
                const lizaResponse = await this.telegramService.getLizaResponse({
                    message: message,
                    userName: this.currentCustomer.name,
                    userId: mockMessage.from.id,
                    chatId: mockMessage.chat.id,
                    store: store,
                    platform: 'telegram'
                });

                if (lizaResponse) {
                    // Verificar se deve incluir link
                    if (this.telegramService.shouldIncludeStoreLink(message)) {
                        const storeLink = this.telegramService.generateStoreLink(store);
                        console.log(`🤖 Liza: ${lizaResponse}\n\n🔗 Acesse nosso cardápio: ${storeLink}\n`);
                    } else {
                        console.log(`🤖 Liza: ${lizaResponse}\n`);
                    }
                } else {
                    console.log('🤖 Liza: Desculpe, estou com dificuldades técnicas no momento.\n');
                }

            } catch (error) {
                console.error('❌ Erro ao processar mensagem:', error.message);
            }

            this.startConversationLoop();
        });
    }

    /**
     * Testar identificação de loja
     */
    async testStoreIdentification() {
        console.log('\n🔍 TESTE DE IDENTIFICAÇÃO DE LOJA');
        console.log('=================================');

        this.rl.question('Digite um número de telefone para testar: ', async (phone) => {
            try {
                const mockMessage = this.createMockMessage('Teste', phone, 'Cliente Teste');
                const store = await this.telegramService.identifyStoreFromMessage(mockMessage);

                if (store) {
                    console.log(`✅ Loja identificada: ${store.name}`);
                    console.log(`📞 Telefone da loja: ${store.telegram?.phoneNumber}`);
                    console.log(`🔗 Link: ${this.telegramService.generateStoreLink(store)}\n`);
                } else {
                    console.log('❌ Nenhuma loja identificada para este telefone\n');
                }

            } catch (error) {
                console.error('❌ Erro:', error.message);
            }

            this.showMainMenu();
        });
    }

    /**
     * Testar geração de links
     */
    async testLinkGeneration() {
        console.log('\n🔗 TESTE DE GERAÇÃO DE LINKS');
        console.log('============================');

        this.stores.forEach((store, index) => {
            const link = this.telegramService.generateStoreLink(store);
            console.log(`${index + 1}. ${store.name}: ${link}`);
        });

        console.log('');
        this.showMainMenu();
    }

    /**
     * Executar testes automáticos
     */
    async runAutomaticTests() {
        console.log('\n🧪 EXECUTANDO TESTES AUTOMÁTICOS');
        console.log('================================');

        try {
            const { default: TelegramLizaTest } = await import('./telegram-liza-test.js');
            const tester = new TelegramLizaTest();
            await tester.runAllTests();
        } catch (error) {
            console.error('❌ Erro ao executar testes automáticos:', error);
        }

        console.log('\nPressione Enter para continuar...');
        this.rl.question('', () => {
            this.showMainMenu();
        });
    }

    /**
     * Criar mensagem simulada
     */
    createMockMessage(text, phoneNumber, firstName = 'Cliente Teste') {
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
     * Sair do programa
     */
    exit() {
        console.log('\n👋 Encerrando teste manual...');
        this.rl.close();
        mongoose.disconnect();
        process.exit(0);
    }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    const test = new TelegramManualTest();
    test.initialize().catch(console.error);
}

export default TelegramManualTest;