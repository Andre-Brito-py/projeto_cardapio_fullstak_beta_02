import React, { useState, useEffect } from 'react';
import './Customers.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { assets } from './../../../../frontend/src/assets/assets';

const Customers = ({ url, token }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchCustomers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/customers/store`, {
        params: {
          page,
          limit: 10,
          search
        },
        headers: { token }
      });
      
      if (response.data.success) {
        setCustomers(response.data.customers);
        setTotalPages(response.data.totalPages);
        setCurrentPage(response.data.currentPage);
      } else {
        toast.error(response.data.message || 'Erro ao carregar clientes');
      }
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchCustomers(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchCustomers(newPage, searchTerm);
    }
  };

  const viewCustomerDetails = async (customerId) => {
    try {
      const response = await axios.get(`${url}/api/customers/${customerId}`, {
        headers: { token }
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
          headers: { token }
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
    fetchCustomers();
  }, []);

  return (
    <div className='customers'>
      <div className="customers-header">
        <h2>Clientes da Loja</h2>
        <div className="customers-search">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Buscar</button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="loading">Carregando clientes...</div>
      ) : (
        <>
          <div className='customers-list'>
            <div className="customers-list-table">
              <div className="customers-list-table-format title">
                <b>Nome</b>
                <b>Telefone</b>
                <b>Endereço</b>
                <b>Cidade</b>
                <b>CEP</b>
                <b>Total Pedidos</b>
                <b>Último Pedido</b>
                <b>Status</b>
                <b>Ações</b>
              </div>
              {customers.map((customer, index) => {
                return (
                  <div key={index} className='customers-list-table-format'>
                    <p>{customer.name}</p>
                    <p>{formatPhone(customer.phone)}</p>
                    <p title={`${customer.address?.street || ''}, ${customer.address?.number || ''}`}>
                      {customer.address?.street ? `${customer.address.street}, ${customer.address.number}` : 'N/A'}
                    </p>
                    <p>{customer.address?.city || 'N/A'}</p>
                    <p>{customer.address?.zipCode || 'N/A'}</p>
                    <p>{customer.totalOrders || 0}</p>
                    <p>{customer.lastOrderDate ? formatDate(customer.lastOrderDate) : 'Nunca'}</p>
                    <p className={customer.isActive ? 'status-active' : 'status-inactive'}>
                      {customer.isActive ? 'Ativo' : 'Inativo'}
                    </p>
                    <div className="customer-actions">
                      <button 
                        onClick={() => viewCustomerDetails(customer._id)}
                        className="btn-view"
                      >
                        Ver Detalhes
                      </button>
                      {customer.isActive && (
                        <button 
                          onClick={() => deactivateCustomer(customer._id)}
                          className="btn-deactivate"
                        >
                          Desativar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Anterior
              </button>
              <span>Página {currentPage} de {totalPages}</span>
              <button 
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
                <div className="detail-group">
                  <label>Nome:</label>
                  <span>{selectedCustomer.name}</span>
                </div>
                <div className="detail-group">
                  <label>Telefone:</label>
                  <span>{formatPhone(selectedCustomer.phone)}</span>
                </div>
                <div className="detail-group">
                  <label>Rua:</label>
                  <span>{selectedCustomer.address?.street || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Número:</label>
                  <span>{selectedCustomer.address?.number || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Complemento:</label>
                  <span>{selectedCustomer.address?.complement || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Bairro:</label>
                  <span>{selectedCustomer.address?.neighborhood || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Cidade:</label>
                  <span>{selectedCustomer.address?.city || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Estado:</label>
                  <span>{selectedCustomer.address?.state || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>CEP:</label>
                  <span>{selectedCustomer.address?.zipCode || 'N/A'}</span>
                </div>
                <div className="detail-group">
                  <label>Total de Pedidos:</label>
                  <span>{selectedCustomer.totalOrders || 0}</span>
                </div>
                <div className="detail-group">
                  <label>Último Pedido:</label>
                  <span>{selectedCustomer.lastOrderDate ? formatDate(selectedCustomer.lastOrderDate) : 'Nunca fez pedidos'}</span>
                </div>
                <div className="detail-group">
                  <label>Cadastrado em:</label>
                  <span>{formatDate(selectedCustomer.createdAt)}</span>
                </div>
                <div className="detail-group">
                  <label>Status:</label>
                  <span className={selectedCustomer.isActive ? 'status-active' : 'status-inactive'}>
                    {selectedCustomer.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Customers;