/**
 * Integração do Sistema de Cadastro Automático de Clientes
 * Este arquivo inicializa e integra todos os componentes do sistema
 */

class CustomerIntegration {
    constructor() {
        this.autoRegister = null;
        this.manager = null;
        this.initialized = false;
        
        this.init();
    }

    /**
     * Inicializa o sistema completo
     */
    async init() {
        try {
            // Aguardar DOM estar pronto
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeSystem());
            } else {
                this.initializeSystem();
            }
        } catch (error) {
            console.error('Erro ao inicializar sistema de clientes:', error);
        }
    }

    /**
     * Inicializa todos os componentes do sistema
     */
    async initializeSystem() {
        try {
            console.log('Inicializando sistema de cadastro automático...');

            // Verificar se as classes estão disponíveis
            if (typeof CustomerAutoRegister === 'undefined') {
                console.error('CustomerAutoRegister não encontrado');
                return;
            }

            if (typeof CustomerManager === 'undefined') {
                console.error('CustomerManager não encontrado');
                return;
            }

            // Inicializar sistema de cadastro automático
            this.autoRegister = new CustomerAutoRegister();
            
            // Aguardar inicialização do cadastro
            await this.waitForAutoRegisterInit();
            
            // Inicializar gerenciador de dados
            this.manager = new CustomerManager(this.autoRegister);
            
            // Configurar integração com sistema de pedidos
            this.setupOrderIntegration();
            
            // Marcar como inicializado
            this.initialized = true;
            
            console.log('Sistema de cadastro automático inicializado com sucesso');
            
            // Disparar evento de sistema pronto
            window.dispatchEvent(new CustomEvent('customerSystemReady', {
                detail: {
                    autoRegister: this.autoRegister,
                    manager: this.manager
                }
            }));

        } catch (error) {
            console.error('Erro ao inicializar sistema:', error);
        }
    }

    /**
     * Aguarda a inicialização do sistema de cadastro
     */
    waitForAutoRegisterInit() {
        return new Promise((resolve) => {
            // Se já inicializou, resolver imediatamente
            if (this.autoRegister && this.autoRegister.initialized) {
                resolve();
                return;
            }

            // Escutar eventos de inicialização
            const handleInit = () => {
                window.removeEventListener('customerRegistered', handleInit);
                window.removeEventListener('customerLoaded', handleInit);
                resolve();
            };

            window.addEventListener('customerRegistered', handleInit);
            window.addEventListener('customerLoaded', handleInit);

            // Timeout de segurança
            setTimeout(() => {
                window.removeEventListener('customerRegistered', handleInit);
                window.removeEventListener('customerLoaded', handleInit);
                resolve();
            }, 5000);
        });
    }

    /**
     * Configura integração com sistema de pedidos
     */
    setupOrderIntegration() {
        // Interceptar finalizações de pedidos
        this.interceptOrderCompletion();
        
        // Configurar seleção de endereços no checkout
        this.setupAddressSelection();
    }

    /**
     * Intercepta finalizações de pedidos para salvar no histórico
     */
    interceptOrderCompletion() {
        // Escutar eventos personalizados de pedido finalizado
        window.addEventListener('orderCompleted', (e) => {
            if (this.manager && e.detail) {
                this.manager.addOrderToHistory(e.detail);
            }
        });

        // Interceptar possíveis chamadas de API de pedidos
        this.interceptFetchCalls();
    }

    /**
     * Intercepta chamadas fetch para detectar pedidos
     */
    interceptFetchCalls() {
        const originalFetch = window.fetch;
        
        window.fetch = async (...args) => {
            const response = await originalFetch.apply(this, args);
            
            // Verificar se é uma chamada de criação de pedido
            const url = args[0];
            const options = args[1] || {};
            
            if (typeof url === 'string' && 
                (url.includes('/api/order') || url.includes('/api/pedido')) && 
                options.method === 'POST') {
                
                try {
                    // Clonar response para não interferir no original
                    const clonedResponse = response.clone();
                    const data = await clonedResponse.json();
                    
                    // Se pedido foi criado com sucesso, adicionar ao histórico
                    if (data.success && data.order) {
                        this.handleOrderCreated(data.order);
                    }
                } catch (error) {
                    // Ignorar erros de parsing
                }
            }
            
            return response;
        };
    }

    /**
     * Processa pedido criado
     */
    handleOrderCreated(orderData) {
        if (!this.manager) return;

        // Converter dados do pedido para formato esperado
        const orderForHistory = {
            orderId: orderData._id || orderData.id,
            orderDate: orderData.createdAt || new Date().toISOString(),
            totalAmount: orderData.totalAmount || orderData.total || 0,
            items: orderData.items || [],
            status: orderData.status || 'completed'
        };

        // Adicionar ao histórico
        this.manager.addOrderToHistory(orderForHistory);
    }

    /**
     * Configura seleção de endereços no checkout
     */
    setupAddressSelection() {
        // Procurar por formulários de checkout existentes
        const checkoutForms = document.querySelectorAll('form[id*="checkout"], form[class*="checkout"], .checkout-form');
        
        checkoutForms.forEach(form => {
            this.enhanceCheckoutForm(form);
        });

        // Observer para formulários adicionados dinamicamente
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                        const checkoutForms = node.querySelectorAll ? 
                            node.querySelectorAll('form[id*="checkout"], form[class*="checkout"], .checkout-form') : 
                            [];
                        
                        checkoutForms.forEach(form => {
                            this.enhanceCheckoutForm(form);
                        });
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Melhora formulário de checkout com seleção de endereços
     */
    enhanceCheckoutForm(form) {
        // Verificar se já foi processado
        if (form.dataset.customerEnhanced) return;
        form.dataset.customerEnhanced = 'true';

        // Procurar campos de endereço
        const addressFields = form.querySelectorAll('input[name*="address"], input[name*="endereco"], textarea[name*="address"]');
        
        if (addressFields.length === 0) return;

        // Adicionar seletor de endereços salvos
        this.addAddressSelector(form, addressFields[0]);
    }

    /**
     * Adiciona seletor de endereços salvos ao formulário
     */
    addAddressSelector(form, addressField) {
        if (!this.manager) return;

        const addresses = this.manager.getAddresses();
        if (!addresses || addresses.length === 0) return;

        // Criar seletor
        const selectorHTML = `
            <div class="customer-address-selector" style="margin-bottom: 15px;">
                <label style="display: block; margin-bottom: 5px; font-weight: 500;">
                    Usar endereço salvo:
                </label>
                <select id="savedAddressSelector" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;">
                    <option value="">Selecione um endereço...</option>
                    ${addresses.map((addr, index) => `
                        <option value="${index}">
                            ${addr.label} - ${addr.street}, ${addr.number}, ${addr.neighborhood}
                        </option>
                    `).join('')}
                </select>
            </div>
        `;

        // Inserir antes do campo de endereço
        addressField.insertAdjacentHTML('beforebegin', selectorHTML);

        // Configurar evento de seleção
        const selector = form.querySelector('#savedAddressSelector');
        selector.addEventListener('change', (e) => {
            const selectedIndex = e.target.value;
            if (selectedIndex !== '') {
                const selectedAddress = addresses[selectedIndex];
                this.fillAddressFields(form, selectedAddress);
            }
        });
    }

    /**
     * Preenche campos de endereço com dados salvos
     */
    fillAddressFields(form, address) {
        const fieldMappings = {
            'street': ['street', 'rua', 'endereco', 'address'],
            'number': ['number', 'numero', 'num'],
            'complement': ['complement', 'complemento', 'comp'],
            'neighborhood': ['neighborhood', 'bairro', 'district'],
            'city': ['city', 'cidade'],
            'state': ['state', 'estado', 'uf'],
            'zipCode': ['zipcode', 'cep', 'zip']
        };

        Object.keys(fieldMappings).forEach(addressKey => {
            const possibleNames = fieldMappings[addressKey];
            
            for (const name of possibleNames) {
                const field = form.querySelector(`input[name*="${name}"], select[name*="${name}"], textarea[name*="${name}"]`);
                if (field && address[addressKey]) {
                    field.value = addressKey === 'zipCode' ? 
                        address[addressKey].replace(/(\d{5})(\d{3})/, '$1-$2') : 
                        address[addressKey];
                    break;
                }
            }
        });
    }

    /**
     * Métodos públicos para integração externa
     */

    // Obter instância do sistema de cadastro
    getAutoRegister() {
        return this.autoRegister;
    }

    // Obter instância do gerenciador
    getManager() {
        return this.manager;
    }

    // Verificar se sistema está inicializado
    isInitialized() {
        return this.initialized;
    }

    // Obter dados do cliente atual
    getCurrentCustomer() {
        return this.autoRegister ? this.autoRegister.getCustomerData() : null;
    }

    // Forçar registro de cliente
    async forceCustomerRegistration() {
        if (this.autoRegister) {
            return await this.autoRegister.showRegistrationModal();
        }
        return null;
    }

    // Adicionar pedido manualmente ao histórico
    async addOrder(orderData) {
        if (this.manager) {
            return await this.manager.addOrderToHistory(orderData);
        }
    }

    // Recarregar dados do cliente
    async refreshCustomerData() {
        if (this.manager) {
            return await this.manager.refreshData();
        }
    }
}

// Aguardar o carregamento completo da página
document.addEventListener('DOMContentLoaded', function() {
    // Aguardar um pouco mais para garantir que todos os scripts foram carregados
    setTimeout(() => {
        const customerSystem = new CustomerIntegration();
        customerSystem.init();
        
        // Disponibilizar globalmente
        window.CustomerSystem = customerSystem;
        window.CustomerIntegration = CustomerIntegration;
        window.getCustomerSystem = () => customerSystem;
    }, 1000);
});