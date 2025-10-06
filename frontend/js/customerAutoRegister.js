/**
 * Sistema de Cadastro Automático de Clientes
 * Gerencia cookies, modal de cadastro e integração com API
 */

class CustomerAutoRegister {
    constructor() {
        this.cookieName = 'client_registered';
        this.cookieExpireDays = 365;
        this.apiBaseUrl = 'http://localhost:4001/api';
        this.storeId = this.getStoreId();
        this.clientData = null;
        
        this.init();
    }

    /**
     * Inicializa o sistema de cadastro automático
     */
    init() {
        // Verificar se já existe cookie de cliente registrado
        const existingClientId = this.getCookie(this.cookieName);
        
        if (existingClientId) {
            // Cliente já registrado, carregar dados
            this.loadExistingCustomer(existingClientId);
        } else {
            // Novo cliente, mostrar modal de cadastro
            this.showRegistrationModal();
        }
    }

    /**
     * Obtém o ID da loja (pode ser do localStorage, URL ou configuração)
     */
    getStoreId() {
        // Tentar obter do localStorage primeiro
        let storeId = localStorage.getItem('storeId');
        
        // Se não encontrar, tentar obter da URL
        if (!storeId) {
            const urlParams = new URLSearchParams(window.location.search);
            storeId = urlParams.get('storeId');
        }
        
        // Se ainda não encontrar, usar um valor padrão ou solicitar
        if (!storeId) {
            // Aqui você pode definir um storeId padrão ou implementar lógica específica
            console.warn('StoreId não encontrado. Usando valor padrão.');
            storeId = '507f1f77bcf86cd799439011'; // Exemplo de ObjectId
        }
        
        return storeId;
    }

    /**
     * Carrega dados de cliente existente
     */
    async loadExistingCustomer(clientId) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clientId: clientId,
                    storeId: this.storeId
                })
            });

            const result = await response.json();
            
            if (result.success && result.data.isExisting) {
                this.clientData = result.data;
                this.onCustomerLoaded(this.clientData);
            } else {
                // Cookie inválido ou cliente não encontrado, solicitar novo cadastro
                this.deleteCookie(this.cookieName);
                this.showRegistrationModal();
            }
        } catch (error) {
            console.error('Erro ao carregar cliente existente:', error);
            this.showRegistrationModal();
        }
    }

    /**
     * Mostra o modal de cadastro de telefone
     */
    showRegistrationModal() {
        // Verificar se modal já existe
        if (document.getElementById('customerRegistrationModal')) {
            return;
        }

        const modalHTML = `
            <div id="customerRegistrationModal" class="customer-modal-overlay">
                <div class="customer-modal">
                    <div class="customer-modal-header">
                        <h3>Bem-vindo!</h3>
                        <p>Para facilitar seus próximos pedidos, precisamos do seu número de telefone.</p>
                    </div>
                    
                    <div class="customer-modal-body">
                        <div class="customer-form-group">
                            <label for="customerPhone">Número de telefone:</label>
                            <input 
                                type="tel" 
                                id="customerPhone" 
                                placeholder="(11) 99999-9999"
                                maxlength="15"
                                required
                            >
                            <div id="phoneError" class="customer-error-message"></div>
                        </div>
                        
                        <div class="customer-lgpd-notice">
                            <div class="customer-checkbox-group">
                                <input type="checkbox" id="lgpdConsent" required>
                                <label for="lgpdConsent">
                                    Concordo que meus dados sejam utilizados apenas para:
                                </label>
                            </div>
                            <ul class="customer-data-usage">
                                <li>Salvar histórico de pedidos</li>
                                <li>Facilitar próximas compras</li>
                                <li>Gerenciar endereços de entrega</li>
                            </ul>
                            <p class="customer-lgpd-rights">
                                Você pode solicitar a exclusão dos seus dados a qualquer momento.
                            </p>
                        </div>
                    </div>
                    
                    <div class="customer-modal-footer">
                        <button id="cancelRegistration" class="customer-btn-secondary">
                            Continuar sem cadastro
                        </button>
                        <button id="confirmRegistration" class="customer-btn-primary">
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Adicionar modal ao DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        
        // Adicionar estilos CSS
        this.addModalStyles();
        
        // Configurar eventos
        this.setupModalEvents();
        
        // Focar no campo de telefone
        setTimeout(() => {
            document.getElementById('customerPhone').focus();
        }, 100);
    }

    /**
     * Adiciona estilos CSS para o modal
     */
    addModalStyles() {
        if (document.getElementById('customerModalStyles')) {
            return;
        }

        const styles = `
            <style id="customerModalStyles">
                .customer-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-color: rgba(0, 0, 0, 0.7);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 10000;
                    animation: fadeIn 0.3s ease-out;
                }
                
                .customer-modal {
                    background: white;
                    border-radius: 12px;
                    padding: 0;
                    max-width: 480px;
                    width: 90%;
                    max-height: 90vh;
                    overflow-y: auto;
                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s ease-out;
                }
                
                .customer-modal-header {
                    padding: 24px 24px 16px;
                    border-bottom: 1px solid #e5e7eb;
                }
                
                .customer-modal-header h3 {
                    margin: 0 0 8px;
                    font-size: 24px;
                    font-weight: 600;
                    color: #1f2937;
                }
                
                .customer-modal-header p {
                    margin: 0;
                    color: #6b7280;
                    font-size: 16px;
                    line-height: 1.5;
                }
                
                .customer-modal-body {
                    padding: 24px;
                }
                
                .customer-form-group {
                    margin-bottom: 24px;
                }
                
                .customer-form-group label {
                    display: block;
                    margin-bottom: 8px;
                    font-weight: 500;
                    color: #374151;
                }
                
                .customer-form-group input[type="tel"] {
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.2s;
                    box-sizing: border-box;
                }
                
                .customer-form-group input[type="tel"]:focus {
                    outline: none;
                    border-color: #3b82f6;
                    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
                }
                
                .customer-error-message {
                    color: #ef4444;
                    font-size: 14px;
                    margin-top: 8px;
                    display: none;
                }
                
                .customer-lgpd-notice {
                    background-color: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 16px;
                }
                
                .customer-checkbox-group {
                    display: flex;
                    align-items: flex-start;
                    margin-bottom: 12px;
                }
                
                .customer-checkbox-group input[type="checkbox"] {
                    margin-right: 8px;
                    margin-top: 2px;
                    flex-shrink: 0;
                }
                
                .customer-checkbox-group label {
                    margin: 0;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .customer-data-usage {
                    margin: 8px 0 12px 24px;
                    padding: 0;
                    font-size: 14px;
                    color: #4b5563;
                }
                
                .customer-data-usage li {
                    margin-bottom: 4px;
                }
                
                .customer-lgpd-rights {
                    font-size: 12px;
                    color: #6b7280;
                    margin: 0;
                    font-style: italic;
                }
                
                .customer-modal-footer {
                    padding: 16px 24px 24px;
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                }
                
                .customer-btn-primary,
                .customer-btn-secondary {
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    border: none;
                }
                
                .customer-btn-primary {
                    background-color: #3b82f6;
                    color: white;
                }
                
                .customer-btn-primary:hover {
                    background-color: #2563eb;
                }
                
                .customer-btn-primary:disabled {
                    background-color: #9ca3af;
                    cursor: not-allowed;
                }
                
                .customer-btn-secondary {
                    background-color: #f3f4f6;
                    color: #374151;
                    border: 1px solid #d1d5db;
                }
                
                .customer-btn-secondary:hover {
                    background-color: #e5e7eb;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                @keyframes slideIn {
                    from { 
                        opacity: 0;
                        transform: translateY(-20px) scale(0.95);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
                
                @media (max-width: 640px) {
                    .customer-modal {
                        width: 95%;
                        margin: 20px;
                    }
                    
                    .customer-modal-footer {
                        flex-direction: column;
                    }
                    
                    .customer-btn-primary,
                    .customer-btn-secondary {
                        width: 100%;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }

    /**
     * Configura eventos do modal
     */
    setupModalEvents() {
        const phoneInput = document.getElementById('customerPhone');
        const confirmBtn = document.getElementById('confirmRegistration');
        const cancelBtn = document.getElementById('cancelRegistration');
        const lgpdCheckbox = document.getElementById('lgpdConsent');
        const phoneError = document.getElementById('phoneError');

        // Formatação automática do telefone
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length <= 11) {
                if (value.length <= 2) {
                    value = value.replace(/(\d{0,2})/, '($1');
                } else if (value.length <= 7) {
                    value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
                } else {
                    value = value.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
                }
            }
            
            e.target.value = value;
            this.validatePhone();
        });

        // Validação em tempo real
        phoneInput.addEventListener('blur', () => {
            this.validatePhone();
        });

        // Controle do botão confirmar
        const updateConfirmButton = () => {
            const phoneValid = this.isValidPhone(phoneInput.value);
            const consentGiven = lgpdCheckbox.checked;
            
            confirmBtn.disabled = !phoneValid || !consentGiven;
        };

        phoneInput.addEventListener('input', updateConfirmButton);
        lgpdCheckbox.addEventListener('change', updateConfirmButton);

        // Evento de confirmação
        confirmBtn.addEventListener('click', () => {
            this.handleRegistration();
        });

        // Evento de cancelamento
        cancelBtn.addEventListener('click', () => {
            this.handleCancelRegistration();
        });

        // Fechar modal com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.handleCancelRegistration();
            }
        });

        // Submissão com Enter
        phoneInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !confirmBtn.disabled) {
                this.handleRegistration();
            }
        });
    }

    /**
     * Valida o número de telefone
     */
    validatePhone() {
        const phoneInput = document.getElementById('customerPhone');
        const phoneError = document.getElementById('phoneError');
        const phone = phoneInput.value;

        if (!phone) {
            this.showPhoneError('Número de telefone é obrigatório');
            return false;
        }

        if (!this.isValidPhone(phone)) {
            this.showPhoneError('Número de telefone inválido');
            return false;
        }

        this.hidePhoneError();
        return true;
    }

    /**
     * Verifica se o telefone é válido
     */
    isValidPhone(phone) {
        const cleanPhone = phone.replace(/\D/g, '');
        return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    }

    /**
     * Mostra erro de telefone
     */
    showPhoneError(message) {
        const phoneError = document.getElementById('phoneError');
        const phoneInput = document.getElementById('customerPhone');
        
        phoneError.textContent = message;
        phoneError.style.display = 'block';
        phoneInput.style.borderColor = '#ef4444';
    }

    /**
     * Esconde erro de telefone
     */
    hidePhoneError() {
        const phoneError = document.getElementById('phoneError');
        const phoneInput = document.getElementById('customerPhone');
        
        phoneError.style.display = 'none';
        phoneInput.style.borderColor = '#d1d5db';
    }

    /**
     * Processa o registro do cliente
     */
    async handleRegistration() {
        const phoneInput = document.getElementById('customerPhone');
        const lgpdCheckbox = document.getElementById('lgpdConsent');
        const confirmBtn = document.getElementById('confirmRegistration');

        if (!this.validatePhone()) {
            return;
        }

        if (!lgpdCheckbox.checked) {
            alert('É necessário concordar com o uso dos dados para continuar.');
            return;
        }

        // Desabilitar botão durante o processo
        confirmBtn.disabled = true;
        confirmBtn.textContent = 'Processando...';

        try {
            const cleanPhone = phoneInput.value.replace(/\D/g, '');
            
            const response = await fetch(`${this.apiBaseUrl}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: cleanPhone,
                    storeId: this.storeId,
                    lgpdConsent: true
                })
            });

            const result = await response.json();

            if (result.success) {
                // Salvar cookie com clientId
                this.setCookie(this.cookieName, result.data.clientId, this.cookieExpireDays);
                
                // Armazenar dados do cliente
                this.clientData = result.data;
                
                // Fechar modal
                this.closeModal();
                
                // Notificar sucesso
                this.onCustomerRegistered(this.clientData);
                
            } else {
                throw new Error(result.message || 'Erro ao registrar cliente');
            }

        } catch (error) {
            console.error('Erro no registro:', error);
            alert('Erro ao processar cadastro. Tente novamente.');
            
            // Reabilitar botão
            confirmBtn.disabled = false;
            confirmBtn.textContent = 'Confirmar';
        }
    }

    /**
     * Processa o cancelamento do registro
     */
    handleCancelRegistration() {
        // Fechar modal
        this.closeModal();
        
        // Notificar que o usuário optou por não se cadastrar
        this.onRegistrationCancelled();
    }

    /**
     * Fecha o modal de registro
     */
    closeModal() {
        const modal = document.getElementById('customerRegistrationModal');
        if (modal) {
            modal.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                modal.remove();
            }, 300);
        }
    }

    /**
     * Gerencia cookies
     */
    setCookie(name, value, days) {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
    }

    getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    deleteCookie(name) {
        document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
    }

    /**
     * Callbacks para eventos do sistema
     */
    onCustomerRegistered(customerData) {
        console.log('Cliente registrado:', customerData);
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('customerRegistered', {
            detail: customerData
        }));
        
        // Mostrar mensagem de boas-vindas
        this.showWelcomeMessage(customerData);
    }

    onCustomerLoaded(customerData) {
        console.log('Cliente carregado:', customerData);
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('customerLoaded', {
            detail: customerData
        }));
    }

    onRegistrationCancelled() {
        console.log('Cadastro cancelado pelo usuário');
        
        // Disparar evento customizado
        window.dispatchEvent(new CustomEvent('registrationCancelled'));
    }

    /**
     * Mostra mensagem de boas-vindas
     */
    showWelcomeMessage(customerData) {
        // Criar notificação de boas-vindas
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 16px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10001;
            animation: slideInRight 0.3s ease-out;
            max-width: 300px;
        `;
        
        notification.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">
                Cadastro realizado com sucesso!
            </div>
            <div style="font-size: 14px; opacity: 0.9;">
                Agora seus pedidos serão salvos automaticamente.
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Remover após 4 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 4000);
    }

    /**
     * Métodos públicos para integração
     */
    
    // Obter dados do cliente atual
    getCustomerData() {
        return this.clientData;
    }
    
    // Verificar se cliente está registrado
    isCustomerRegistered() {
        return !!this.clientData;
    }
    
    // Forçar novo cadastro (limpar cookie)
    forceNewRegistration() {
        this.deleteCookie(this.cookieName);
        this.clientData = null;
        this.showRegistrationModal();
    }
    
    // Solicitar exclusão de dados (LGPD)
    async requestDataDeletion() {
        if (!this.clientData) {
            alert('Nenhum cliente registrado para excluir.');
            return;
        }
        
        const confirmed = confirm(
            'Tem certeza que deseja excluir todos os seus dados?\n\n' +
            'Esta ação não pode ser desfeita e você perderá:\n' +
            '• Histórico de pedidos\n' +
            '• Endereços salvos\n' +
            '• Preferências\n\n' +
            'Clique em OK para confirmar a exclusão.'
        );
        
        if (!confirmed) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/customer/${this.clientData.clientId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    confirmDelete: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                // Limpar dados locais
                this.deleteCookie(this.cookieName);
                this.clientData = null;
                
                alert('Seus dados foram excluídos com sucesso conforme a LGPD.');
                
                // Disparar evento
                window.dispatchEvent(new CustomEvent('customerDataDeleted'));
                
                // Mostrar modal de novo cadastro
                this.showRegistrationModal();
                
            } else {
                throw new Error(result.message || 'Erro ao excluir dados');
            }
            
        } catch (error) {
            console.error('Erro ao excluir dados:', error);
            alert('Erro ao excluir dados. Tente novamente.');
        }
    }
}

// Adicionar animações CSS adicionais
const additionalStyles = `
    <style>
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', additionalStyles);

// Exportar para uso global
window.CustomerAutoRegister = CustomerAutoRegister;