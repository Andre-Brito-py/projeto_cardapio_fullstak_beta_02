/**
 * Gerenciador de Endereços e Histórico de Pedidos
 * Complementa o sistema de cadastro automático
 */

class CustomerManager {
    constructor(customerAutoRegister) {
        this.autoRegister = customerAutoRegister;
        this.apiBaseUrl = 'http://localhost:4001/api';
        this.addresses = [];
        this.orders = [];
        
        this.init();
    }

    /**
     * Inicializa o gerenciador
     */
    init() {
        // Escutar eventos do sistema de cadastro
        window.addEventListener('customerRegistered', (e) => {
            this.onCustomerReady(e.detail);
        });
        
        window.addEventListener('customerLoaded', (e) => {
            this.onCustomerReady(e.detail);
        });
    }

    /**
     * Chamado quando cliente está pronto (registrado ou carregado)
     */
    onCustomerReady(customerData) {
        this.addresses = customerData.addresses || [];
        this.orders = customerData.orderHistory || [];
        
        // Criar interface se não existir
        this.createCustomerInterface();
        
        // Atualizar dados na interface
        this.updateAddressList();
        this.updateOrderHistory();
    }

    /**
     * Cria a interface do cliente na página
     */
    createCustomerInterface() {
        // Verificar se interface já existe
        if (document.getElementById('customerInterface')) {
            return;
        }

        const interfaceHTML = `
            <div id="customerInterface" class="customer-interface">
                <div class="customer-interface-header">
                    <h3>Minha Conta</h3>
                    <button id="toggleCustomerInterface" class="customer-toggle-btn">
                        <span class="customer-toggle-icon">▼</span>
                    </button>
                </div>
                
                <div id="customerInterfaceContent" class="customer-interface-content">
                    <!-- Seção de Endereços -->
                    <div class="customer-section">
                        <div class="customer-section-header">
                            <h4>Meus Endereços</h4>
                            <button id="addAddressBtn" class="customer-btn-small">
                                + Adicionar
                            </button>
                        </div>
                        <div id="addressList" class="customer-address-list">
                            <!-- Endereços serão inseridos aqui -->
                        </div>
                    </div>
                    
                    <!-- Seção de Histórico -->
                    <div class="customer-section">
                        <div class="customer-section-header">
                            <h4>Últimos Pedidos</h4>
                            <button id="viewAllOrdersBtn" class="customer-btn-small">
                                Ver todos
                            </button>
                        </div>
                        <div id="orderHistory" class="customer-order-history">
                            <!-- Histórico será inserido aqui -->
                        </div>
                    </div>
                    
                    <!-- Seção de Configurações -->
                    <div class="customer-section">
                        <div class="customer-section-header">
                            <h4>Configurações</h4>
                        </div>
                        <div class="customer-settings">
                            <button id="deleteDataBtn" class="customer-btn-danger">
                                Excluir meus dados (LGPD)
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Inserir interface no final do body
        document.body.insertAdjacentHTML('beforeend', interfaceHTML);
        
        // Adicionar estilos
        this.addInterfaceStyles();
        
        // Configurar eventos
        this.setupInterfaceEvents();
    }

    /**
     * Adiciona estilos CSS para a interface
     */
    addInterfaceStyles() {
        if (document.getElementById('customerInterfaceStyles')) {
            return;
        }

        const styles = `
            <style id="customerInterfaceStyles">
                .customer-interface {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    width: 350px;
                    max-width: calc(100vw - 40px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
                    border: 1px solid #e5e7eb;
                    z-index: 9999;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                }
                
                .customer-interface-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 16px 20px;
                    border-bottom: 1px solid #e5e7eb;
                    background: #f8fafc;
                    border-radius: 12px 12px 0 0;
                }
                
                .customer-interface-header h3 {
                    margin: 0;
                    font-size: 18px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .customer-toggle-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 4px;
                    border-radius: 4px;
                    transition: background-color 0.2s;
                }
                
                .customer-toggle-btn:hover {
                    background-color: #e5e7eb;
                }
                
                .customer-toggle-icon {
                    font-size: 14px;
                    color: #6b7280;
                    transition: transform 0.2s;
                }
                
                .customer-interface.collapsed .customer-toggle-icon {
                    transform: rotate(-90deg);
                }
                
                .customer-interface-content {
                    max-height: 400px;
                    overflow-y: auto;
                    transition: max-height 0.3s ease-out;
                }
                
                .customer-interface.collapsed .customer-interface-content {
                    max-height: 0;
                    overflow: hidden;
                }
                
                .customer-section {
                    padding: 16px 20px;
                    border-bottom: 1px solid #f3f4f6;
                }
                
                .customer-section:last-child {
                    border-bottom: none;
                }
                
                .customer-section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 12px;
                }
                
                .customer-section-header h4 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .customer-btn-small {
                    padding: 6px 12px;
                    font-size: 12px;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .customer-btn-small:hover {
                    background-color: #2563eb;
                }
                
                .customer-btn-danger {
                    padding: 8px 16px;
                    font-size: 12px;
                    background-color: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                    transition: background-color 0.2s;
                }
                
                .customer-btn-danger:hover {
                    background-color: #dc2626;
                }
                
                .customer-address-list {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .customer-address-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 14px;
                }
                
                .customer-address-label {
                    font-weight: 600;
                    color: #1f2937;
                    margin-bottom: 4px;
                }
                
                .customer-address-text {
                    color: #6b7280;
                    line-height: 1.4;
                }
                
                .customer-order-history {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .customer-order-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    font-size: 14px;
                }
                
                .customer-order-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 4px;
                }
                
                .customer-order-date {
                    font-weight: 500;
                    color: #1f2937;
                }
                
                .customer-order-total {
                    font-weight: 600;
                    color: #059669;
                }
                
                .customer-order-items {
                    color: #6b7280;
                    font-size: 12px;
                }
                
                .customer-empty-state {
                    text-align: center;
                    color: #9ca3af;
                    font-size: 14px;
                    padding: 20px;
                }
                
                @media (max-width: 640px) {
                    .customer-interface {
                        bottom: 10px;
                        right: 10px;
                        left: 10px;
                        width: auto;
                        max-width: none;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos da interface
     */
    setupInterfaceEvents() {
        // Toggle da interface
        document.getElementById('toggleCustomerInterface').addEventListener('click', () => {
            const customerInterface = document.getElementById('customerInterface');
            customerInterface.classList.toggle('collapsed');
        });

        // Adicionar endereço
        document.getElementById('addAddressBtn').addEventListener('click', () => {
            this.showAddAddressModal();
        });

        // Ver todos os pedidos
        document.getElementById('viewAllOrdersBtn').addEventListener('click', () => {
            this.showAllOrdersModal();
        });

        // Excluir dados
        document.getElementById('deleteDataBtn').addEventListener('click', () => {
            this.autoRegister.requestDataDeletion();
        });
    }

    /**
     * Atualiza a lista de endereços
     */
    updateAddressList() {
        const addressList = document.getElementById('addressList');
        
        if (!this.addresses || this.addresses.length === 0) {
            addressList.innerHTML = `
                <div class="customer-empty-state">
                    Nenhum endereço cadastrado
                </div>
            `;
            return;
        }

        addressList.innerHTML = this.addresses.map(address => `
            <div class="customer-address-item">
                <div class="customer-address-label">${address.label}</div>
                <div class="customer-address-text">
                    ${address.street}, ${address.number}
                    ${address.complement ? ` - ${address.complement}` : ''}
                    <br>
                    ${address.neighborhood}, ${address.city} - ${address.state}
                    <br>
                    CEP: ${address.zipCode}
                </div>
            </div>
        `).join('');
    }

    /**
     * Atualiza o histórico de pedidos
     */
    updateOrderHistory() {
        const orderHistory = document.getElementById('orderHistory');
        
        if (!this.orders || this.orders.length === 0) {
            orderHistory.innerHTML = `
                <div class="customer-empty-state">
                    Nenhum pedido realizado
                </div>
            `;
            return;
        }

        // Mostrar apenas os últimos 3 pedidos
        const recentOrders = this.orders.slice(0, 3);
        
        orderHistory.innerHTML = recentOrders.map(order => `
            <div class="customer-order-item">
                <div class="customer-order-header">
                    <div class="customer-order-date">
                        ${new Date(order.orderDate).toLocaleDateString('pt-BR')}
                    </div>
                    <div class="customer-order-total">
                        R$ ${order.totalAmount.toFixed(2)}
                    </div>
                </div>
                <div class="customer-order-items">
                    ${order.items.length} ${order.items.length === 1 ? 'item' : 'itens'}
                </div>
            </div>
        `).join('');
    }

    /**
     * Mostra modal para adicionar endereço
     */
    showAddAddressModal() {
        const modalHTML = `
            <div id="addAddressModal" class="customer-modal-overlay">
                <div class="customer-modal">
                    <div class="customer-modal-header">
                        <h3>Adicionar Endereço</h3>
                    </div>
                    
                    <div class="customer-modal-body">
                        <form id="addAddressForm">
                            <div class="customer-form-group">
                                <label for="addressLabel">Rótulo do endereço:</label>
                                <select id="addressLabel" required>
                                    <option value="">Selecione...</option>
                                    <option value="Casa">Casa</option>
                                    <option value="Trabalho">Trabalho</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>
                            
                            <div class="customer-form-group">
                                <label for="addressStreet">Rua/Avenida:</label>
                                <input type="text" id="addressStreet" required>
                            </div>
                            
                            <div class="customer-form-row">
                                <div class="customer-form-group">
                                    <label for="addressNumber">Número:</label>
                                    <input type="text" id="addressNumber" required>
                                </div>
                                <div class="customer-form-group">
                                    <label for="addressComplement">Complemento:</label>
                                    <input type="text" id="addressComplement">
                                </div>
                            </div>
                            
                            <div class="customer-form-group">
                                <label for="addressNeighborhood">Bairro:</label>
                                <input type="text" id="addressNeighborhood" required>
                            </div>
                            
                            <div class="customer-form-row">
                                <div class="customer-form-group">
                                    <label for="addressCity">Cidade:</label>
                                    <input type="text" id="addressCity" required>
                                </div>
                                <div class="customer-form-group">
                                    <label for="addressState">Estado:</label>
                                    <select id="addressState" required>
                                        <option value="">UF</option>
                                        <option value="AC">AC</option>
                                        <option value="AL">AL</option>
                                        <option value="AP">AP</option>
                                        <option value="AM">AM</option>
                                        <option value="BA">BA</option>
                                        <option value="CE">CE</option>
                                        <option value="DF">DF</option>
                                        <option value="ES">ES</option>
                                        <option value="GO">GO</option>
                                        <option value="MA">MA</option>
                                        <option value="MT">MT</option>
                                        <option value="MS">MS</option>
                                        <option value="MG">MG</option>
                                        <option value="PA">PA</option>
                                        <option value="PB">PB</option>
                                        <option value="PR">PR</option>
                                        <option value="PE">PE</option>
                                        <option value="PI">PI</option>
                                        <option value="RJ">RJ</option>
                                        <option value="RN">RN</option>
                                        <option value="RS">RS</option>
                                        <option value="RO">RO</option>
                                        <option value="RR">RR</option>
                                        <option value="SC">SC</option>
                                        <option value="SP">SP</option>
                                        <option value="SE">SE</option>
                                        <option value="TO">TO</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div class="customer-form-group">
                                <label for="addressZipCode">CEP:</label>
                                <input type="text" id="addressZipCode" placeholder="00000-000" maxlength="9" required>
                            </div>
                        </form>
                    </div>
                    
                    <div class="customer-modal-footer">
                        <button id="cancelAddAddress" class="customer-btn-secondary">
                            Cancelar
                        </button>
                        <button id="confirmAddAddress" class="customer-btn-primary">
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupAddAddressEvents();
    }

    /**
     * Configura eventos do modal de adicionar endereço
     */
    setupAddAddressEvents() {
        const zipCodeInput = document.getElementById('addressZipCode');
        const confirmBtn = document.getElementById('confirmAddAddress');
        const cancelBtn = document.getElementById('cancelAddAddress');

        // Formatação do CEP
        zipCodeInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            if (value.length <= 8) {
                value = value.replace(/(\d{5})(\d{0,3})/, '$1-$2');
            }
            e.target.value = value;
        });

        // Confirmar adição
        confirmBtn.addEventListener('click', () => {
            this.handleAddAddress();
        });

        // Cancelar
        cancelBtn.addEventListener('click', () => {
            this.closeAddAddressModal();
        });

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAddAddressModal();
            }
        });
    }

    /**
     * Processa a adição de endereço
     */
    async handleAddAddress() {
        const form = document.getElementById('addAddressForm');
        const formData = new FormData(form);
        
        const address = {
            label: document.getElementById('addressLabel').value,
            street: document.getElementById('addressStreet').value,
            number: document.getElementById('addressNumber').value,
            complement: document.getElementById('addressComplement').value,
            neighborhood: document.getElementById('addressNeighborhood').value,
            city: document.getElementById('addressCity').value,
            state: document.getElementById('addressState').value,
            zipCode: document.getElementById('addressZipCode').value.replace(/\D/g, '')
        };

        // Validação básica
        const requiredFields = ['label', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
        const missingFields = requiredFields.filter(field => !address[field]);
        
        if (missingFields.length > 0) {
            alert('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        const confirmBtn = document.getElementById('confirmAddAddress');
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Adicionando...';

        try {
            const customerData = this.autoRegister.getCustomerData();
            
            const response = await fetch(`${this.apiBaseUrl}/address`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: customerData.clientId,
                    address: address
                })
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar lista local
                this.addresses.push(result.data.address);
                this.updateAddressList();
                
                // Fechar modal
                this.closeAddAddressModal();
                
                // Mostrar sucesso
                this.showNotification('Endereço adicionado com sucesso!', 'success');
                
            } else {
                throw new Error(result.message || 'Erro ao adicionar endereço');
            }

        } catch (error) {
            console.error('Erro ao adicionar endereço:', error);
            alert('Erro ao adicionar endereço. Tente novamente.');
            
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Adicionar';
        }
    }

    /**
     * Fecha modal de adicionar endereço
     */
    closeAddAddressModal() {
        const modal = document.getElementById('addAddressModal');
        if (modal) {
            modal.remove();
        }
    }

    /**
     * Mostra modal com todos os pedidos
     */
    showAllOrdersModal() {
        const modalHTML = `
            <div id="allOrdersModal" class="customer-modal-overlay">
                <div class="customer-modal customer-modal-large">
                    <div class="customer-modal-header">
                        <h3>Histórico de Pedidos</h3>
                        <button id="closeAllOrdersModal" class="customer-close-btn">×</button>
                    </div>
                    
                    <div class="customer-modal-body">
                        <div id="allOrdersList" class="customer-all-orders-list">
                            ${this.renderAllOrders()}
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Configurar evento de fechar
        document.getElementById('closeAllOrdersModal').addEventListener('click', () => {
            document.getElementById('allOrdersModal').remove();
        });
    }

    /**
     * Renderiza todos os pedidos
     */
    renderAllOrders() {
        if (!this.orders || this.orders.length === 0) {
            return '<div class="customer-empty-state">Nenhum pedido encontrado</div>';
        }

        return this.orders.map(order => `
            <div class="customer-order-item-detailed">
                <div class="customer-order-header">
                    <div class="customer-order-date">
                        ${new Date(order.orderDate).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        })}
                    </div>
                    <div class="customer-order-total">
                        R$ ${order.totalAmount.toFixed(2)}
                    </div>
                </div>
                <div class="customer-order-items-detailed">
                    ${order.items.map(item => `
                        <div class="customer-order-item-line">
                            ${item.quantity}x ${item.name} - R$ ${item.price.toFixed(2)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
    }

    /**
     * Mostra notificação
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
            ${type === 'success' ? 'background-color: #10b981;' : 'background-color: #3b82f6;'}
        `;
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    /**
     * Adiciona pedido ao histórico (chamado quando um pedido é finalizado)
     */
    async addOrderToHistory(orderData) {
        try {
            const customerData = this.autoRegister.getCustomerData();
            
            if (!customerData) {
                console.log('Cliente não registrado, não salvando histórico');
                return;
            }

            const response = await fetch(`${this.apiBaseUrl}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: customerData.clientId,
                    order: orderData
                })
            });

            const result = await response.json();

            if (result.success) {
                // Atualizar lista local
                this.orders.unshift(result.data.order);
                this.updateOrderHistory();
                
                console.log('Pedido adicionado ao histórico');
            }

        } catch (error) {
            console.error('Erro ao adicionar pedido ao histórico:', error);
        }
    }

    /**
     * Métodos públicos
     */
    
    // Obter endereços do cliente
    getAddresses() {
        return this.addresses;
    }
    
    // Obter histórico de pedidos
    getOrderHistory() {
        return this.orders;
    }
    
    // Recarregar dados do servidor
    async refreshData() {
        const customerData = this.autoRegister.getCustomerData();
        if (!customerData) return;

        try {
            // Recarregar endereços
            const addressResponse = await fetch(`${this.apiBaseUrl}/addresses?clientId=${customerData.clientId}`);
            const addressResult = await addressResponse.json();
            
            if (addressResult.success) {
                this.addresses = addressResult.data.addresses;
                this.updateAddressList();
            }

            // Recarregar pedidos
            const orderResponse = await fetch(`${this.apiBaseUrl}/orders?clientId=${customerData.clientId}`);
            const orderResult = await orderResponse.json();
            
            if (orderResult.success) {
                this.orders = orderResult.data.orders;
                this.updateOrderHistory();
            }

        } catch (error) {
            console.error('Erro ao recarregar dados:', error);
        }
    }
}

// Exportar para uso global
window.CustomerManager = CustomerManager;