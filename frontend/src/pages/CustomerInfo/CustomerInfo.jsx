import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { StoreContext } from '../../components/context/StoreContext';
import './CustomerInfo.css';

const CustomerInfo = () => {
  const { url, storeId } = useContext(StoreContext);
  const navigate = useNavigate();
  
  const [step, setStep] = useState('phone'); // 'phone', 'select', 'register'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [existingCustomers, setExistingCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  // Buscar cliente por telefone
  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Por favor, digite seu telefone');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${url}/api/customers/find-by-phone`, {
        phone: phoneNumber,
        storeId: storeId
      });

      if (response.data.success) {
        if (response.data.isExistingCustomer) {
          // Cliente existente encontrado
          setExistingCustomers([response.data.customer]);
          setStep('select');
        } else {
          // Novo cliente
          setCustomerData(prev => ({ ...prev, phone: phoneNumber }));
          setStep('register');
        }
      } else {
        setError(response.data.message || 'Erro ao buscar cliente');
      }
    } catch (error) {
      console.error('Erro ao buscar cliente:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Selecionar cliente existente
  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    // Salvar dados do cliente no localStorage para usar no checkout
    localStorage.setItem('selectedCustomer', JSON.stringify(customer));
    navigate('/order');
  };

  // Criar novo cliente
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!customerData.name.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    
    const requiredAddressFields = {
      street: 'Rua',
      number: 'Número',
      neighborhood: 'Bairro',
      city: 'Cidade',
      state: 'Estado',
      zipCode: 'CEP'
    };
    
    for (const [field, label] of Object.entries(requiredAddressFields)) {
      if (!customerData.address[field].trim()) {
        setError(`${label} é obrigatório`);
        return;
      }
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post(`${url}/api/customers/create`, {
        name: customerData.name,
        phone: customerData.phone,
        address: customerData.address,
        storeId: storeId
      });

      if (response.data.success) {
        // Salvar dados do cliente no localStorage
        localStorage.setItem('selectedCustomer', JSON.stringify(response.data.customer));
        navigate('/order');
      } else {
        setError(response.data.message || 'Erro ao criar cliente');
      }
    } catch (error) {
      console.error('Erro ao criar cliente:', error);
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Atualizar dados do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setCustomerData(prev => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value
        }
      }));
    } else {
      setCustomerData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Voltar para etapa anterior
  const handleBack = () => {
    if (step === 'select' || step === 'register') {
      setStep('phone');
      setPhoneNumber('');
      setExistingCustomers([]);
      setSelectedCustomer(null);
      setError('');
    }
  };

  // Adicionar novo cliente (quando já existe um)
  const handleAddNewCustomer = () => {
    setCustomerData(prev => ({ ...prev, phone: phoneNumber }));
    setStep('register');
  };

  return (
    <div className="customer-info">
      <div className="customer-info-container">
        <div className="customer-info-header">
          <h2>Informações do Cliente</h2>
          <p>Para finalizar seu pedido, precisamos de suas informações</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {/* Etapa 1: Inserir telefone */}
        {step === 'phone' && (
          <form onSubmit={handlePhoneSubmit} className="phone-form">
            <div className="form-group">
              <label htmlFor="phone">Número do Telefone</label>
              <input
                type="tel"
                id="phone"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(11) 99999-9999"
                required
              />
            </div>
            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        )}

        {/* Etapa 2: Selecionar cliente existente */}
        {step === 'select' && (
          <div className="customer-selection">
            <div className="back-button" onClick={handleBack}>
              ← Voltar
            </div>
            
            <h3>Cliente Encontrado</h3>
            <p>Encontramos um perfil com este telefone. Deseja usar estas informações?</p>
            
            {existingCustomers.map((customer) => (
              <div key={customer._id} className="customer-card">
                <div className="customer-info-display">
                  <h4>{customer.name}</h4>
                  <p><strong>Telefone:</strong> {customer.phone}</p>
                  <p><strong>Endereço:</strong> {customer.address.street}, {customer.address.number}</p>
                  <p>{customer.address.neighborhood}, {customer.address.city} - {customer.address.state}</p>
                  <p><strong>CEP:</strong> {customer.address.zipCode}</p>
                </div>
                <button 
                  onClick={() => handleSelectCustomer(customer)}
                  className="btn-primary"
                >
                  Usar este endereço
                </button>
              </div>
            ))}
            
            <div className="add-new-customer">
              <p>Ou</p>
              <button onClick={handleAddNewCustomer} className="btn-secondary">
                Adicionar novo endereço
              </button>
            </div>
          </div>
        )}

        {/* Etapa 3: Registrar novo cliente */}
        {step === 'register' && (
          <form onSubmit={handleCreateCustomer} className="customer-form">
            <div className="back-button" onClick={handleBack}>
              ← Voltar
            </div>
            
            <h3>Cadastrar Informações</h3>
            
            <div className="form-group">
              <label htmlFor="name">Nome Completo *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={customerData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone-display">Telefone</label>
              <input
                type="tel"
                id="phone-display"
                value={customerData.phone}
                disabled
              />
            </div>

            <div className="address-section">
              <h4>Endereço de Entrega</h4>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="street">Rua *</label>
                  <input
                    type="text"
                    id="street"
                    name="address.street"
                    value={customerData.address.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="number">Número *</label>
                  <input
                    type="text"
                    id="number"
                    name="address.number"
                    value={customerData.address.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="complement">Complemento</label>
                <input
                  type="text"
                  id="complement"
                  name="address.complement"
                  value={customerData.address.complement}
                  onChange={handleInputChange}
                  placeholder="Apartamento, bloco, etc."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="neighborhood">Bairro *</label>
                  <input
                    type="text"
                    id="neighborhood"
                    name="address.neighborhood"
                    value={customerData.address.neighborhood}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="city">Cidade *</label>
                  <input
                    type="text"
                    id="city"
                    name="address.city"
                    value={customerData.address.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="state">Estado *</label>
                  <input
                    type="text"
                    id="state"
                    name="address.state"
                    value={customerData.address.state}
                    onChange={handleInputChange}
                    maxLength="2"
                    placeholder="SP"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="zipCode">CEP *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="address.zipCode"
                    value={customerData.address.zipCode}
                    onChange={handleInputChange}
                    placeholder="00000-000"
                    required
                  />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary">
              {isLoading ? 'Salvando...' : 'Continuar para Pagamento'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default CustomerInfo;