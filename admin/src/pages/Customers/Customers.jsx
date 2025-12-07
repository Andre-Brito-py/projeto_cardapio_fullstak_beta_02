import React, { useState, useEffect } from 'react';
import './Customers.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from './../../../../frontend/src/assets/assets';

const Customers = ({ url, token }) => {
  const [customers, setCustomers] = useState([]);
  const [autoRegisterCustomers, setAutoRegisterCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState('traditional'); // 'traditional' ou 'autoregister'

  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/customer/list`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, search, limit: 10 }
      });

      if (response.data.success) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const fetchAutoRegisterCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/customer-auto/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { page, search, limit: 10 }
      });

      if (response.data.success) {
        setAutoRegisterCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setCurrentPage(page);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao buscar clientes do cadastro automático:', error);
      toast.error('Erro ao carregar clientes do cadastro automático');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    if (activeTab === 'traditional') {
      fetchCustomers(1, searchTerm);
    } else {
      fetchAutoRegisterCustomers(1, searchTerm);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      if (activeTab === 'traditional') {
        fetchCustomers(newPage, searchTerm);
      } else {
        fetchAutoRegisterCustomers(newPage, searchTerm);
      }
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchTerm('');
    if (tab === 'traditional') {
      fetchCustomers(1, '');
    } else {
      fetchAutoRegisterCustomers(1, '');
    }
  };

  const viewCustomerDetails = async (customerId) => {
    try {
      const response = await axios.get(`${url}/api/customers/${customerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSelectedCustomer(response.data.customer);
        setShowModal(true);
      } else {
        toast.error('Erro ao carregar detalhes do cliente');
      }
    } catch (error) {
      console.error('Erro ao buscar detalhes do cliente:', error);
      toast.error('Erro ao carregar detalhes do cliente');
    }
  };

  const deactivateCustomer = async (customerId) => {
    if (window.confirm('Tem certeza que deseja desativar este cliente?')) {
      try {
        const response = await axios.patch(`${url}/api/customers/${customerId}/deactivate`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          toast.success('Cliente desativado com sucesso');
          fetchCustomers(currentPage, searchTerm);
        } else {
          toast.error(response.data.message || 'Erro ao desativar cliente');
        }
      } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        toast.error('Erro ao desativar cliente');
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPhone = (phone) => {
    // Formatar telefone brasileiro
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  useEffect(() => {
    if (activeTab === 'traditional') {
      fetchCustomers();
    } else {
      fetchAutoRegisterCustomers();
    }
  }, [activeTab]);

  return (
    <div className="customers">
      <div className="customers-header">
        <h2>Gerenciamento de Clientes</h2>
        
        {/* Abas para alternar entre tipos de clientes */}
        <div className="customer-tabs">
          <button 
            className={`tab-button ${activeTab === 'traditional' ? 'active' : ''}`}
            onClick={() => handleTabChange('traditional')}
          >
            Clientes Tradicionais
          </button>
          <button 
            className={`tab-button ${activeTab === 'autoregister' ? 'active' : ''}`}
            onClick={() => handleTabChange('autoregister')}
          >
            Cadastro Automático
          </button>
        </div>

        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Buscar por nome ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">Carregando...</div>
      ) : (
        <>
          <div className="card customers-list">
            <div className="card-header"><h3 className="card-title">Lista de Clientes</h3></div>
            <div className="card-body">
            <table className="customers-table table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Telefone</th>
                  {activeTab === 'traditional' ? (
                    <>
                      <th>Endereço</th>
                      <th>Pedidos</th>
                      <th>Status</th>
                    </>
                  ) : (
                    <>
                      <th>Client ID</th>
                      <th>Email</th>
                      <th>Endereços</th>
                      <th>Pedidos</th>
                      <th>Cadastro</th>
                    </>
                  )}
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {(activeTab === 'traditional' ? customers : autoRegisterCustomers).map((customer) => (
                  <tr key={customer._id}>
                    <td>{customer.name || 'N/A'}</td>
                    <td>{customer.phone}</td>
                    {activeTab === 'traditional' ? (
                      <>
                        <td>{customer.address || 'N/A'}</td>
                        <td>{customer.orderCount || 0}</td>
                        <td>
                          <span className={`status ${customer.isActive ? 'active' : 'inactive'}`}>
                            {customer.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td>{customer.clientId}</td>
                        <td>{customer.email || 'N/A'}</td>
                        <td>{customer.addresses?.length || 0}</td>
                        <td>{customer.orderHistory?.length || 0}</td>
                        <td>{new Date(customer.createdAt).toLocaleDateString('pt-BR')}</td>
                      </>
                    )}
                    <td>
                      <button
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowModal(true);
                        }}
                        className="btn btn-outline"
                      >
                        Ver Detalhes
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                className="btn btn-outline"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button 
                className="btn btn-outline"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de detalhes do cliente */}
      {showModal && selectedCustomer && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalhes do Cliente</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="customer-details">
                {activeTab === 'traditional' ? (
                  // Detalhes do cliente tradicional
                  <>
                    <div className="detail-group">
                      <label>Nome:</label>
                      <span>{selectedCustomer.name}</span>
                    </div>
                    <div className="detail-group">
                      <label>Telefone:</label>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="detail-group">
                      <label>Endereço:</label>
                      <span>{selectedCustomer.address || 'N/A'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Total de Pedidos:</label>
                      <span>{selectedCustomer.orderCount || 0}</span>
                    </div>
                    <div className="detail-group">
                      <label>Cadastrado em:</label>
                      <span>{new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div className="detail-group">
                      <label>Status:</label>
                      <span className={selectedCustomer.isActive ? 'status-active' : 'status-inactive'}>
                        {selectedCustomer.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </>
                ) : (
                  // Detalhes do cliente do cadastro automático
                  <>
                    <div className="detail-group">
                      <label>Nome:</label>
                      <span>{selectedCustomer.name || 'Não informado'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Telefone:</label>
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="detail-group">
                      <label>Client ID:</label>
                      <span>{selectedCustomer.clientId}</span>
                    </div>
                    <div className="detail-group">
                      <label>Email:</label>
                      <span>{selectedCustomer.email || 'Não informado'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Consentimento LGPD:</label>
                      <span className={selectedCustomer.lgpdConsent ? 'status-active' : 'status-inactive'}>
                        {selectedCustomer.lgpdConsent ? 'Aceito' : 'Não aceito'}
                      </span>
                    </div>
                    <div className="detail-group">
                      <label>Total de Pedidos:</label>
                      <span>{selectedCustomer.orderHistory?.length || 0}</span>
                    </div>
                    <div className="detail-group">
                      <label>Valor Total Gasto:</label>
                      <span>R$ {selectedCustomer.statistics?.totalSpent?.toFixed(2) || '0,00'}</span>
                    </div>
                    <div className="detail-group">
                      <label>Último Pedido:</label>
                      <span>
                        {selectedCustomer.statistics?.lastOrderDate 
                          ? new Date(selectedCustomer.statistics.lastOrderDate).toLocaleDateString('pt-BR')
                          : 'Nunca fez pedidos'
                        }
                      </span>
                    </div>
                    <div className="detail-group">
                      <label>Cadastrado em:</label>
                      <span>{new Date(selectedCustomer.createdAt).toLocaleDateString('pt-BR')}</span>
                    </div>
                    
                    {/* Endereços */}
                    <div className="detail-section">
                      <h4>Endereços ({selectedCustomer.addresses?.length || 0})</h4>
                      {selectedCustomer.addresses?.length > 0 ? (
                        <div className="addresses-list">
                          {selectedCustomer.addresses.map((address, index) => (
                            <div key={index} className="address-item">
                              <strong>{address.label}:</strong>
                              <span>{address.street}, {address.number}</span>
                              {address.complement && <span>, {address.complement}</span>}
                              <span>, {address.neighborhood}, {address.city} - {address.state}</span>
                              <span>, CEP: {address.zipCode}</span>
                              {address.isDefault && <span className="default-badge">Padrão</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p>Nenhum endereço cadastrado</p>
                      )}
                    </div>

                    {/* Histórico de Pedidos */}
                    <div className="detail-section">
                      <h4>Últimos Pedidos ({selectedCustomer.orderHistory?.length || 0})</h4>
                      {selectedCustomer.orderHistory?.length > 0 ? (
                        <div className="orders-list">
                          {selectedCustomer.orderHistory.slice(0, 5).map((order, index) => (
                            <div key={index} className="order-item">
                              <div className="order-header">
                                <span className="order-date">
                                  {new Date(order.date).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="order-total">R$ {order.total.toFixed(2)}</span>
                              </div>
                              <div className="order-items">
                                {order.items.slice(0, 3).map((item, itemIndex) => (
                                  <span key={itemIndex} className="order-item-name">
                                    {item.name} ({item.quantity}x)
                                  </span>
                                ))}
                                {order.items.length > 3 && (
                                  <span className="more-items">+{order.items.length - 3} itens</span>
                                )}
                              </div>
                            </div>
                          ))}
                          {selectedCustomer.orderHistory.length > 5 && (
                            <p className="more-orders">+{selectedCustomer.orderHistory.length - 5} pedidos anteriores</p>
                          )}
                        </div>
                      ) : (
                        <p>Nenhum pedido realizado</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers;
