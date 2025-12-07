import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../config/urls';
import './ContactableCustomers.css';

const ContactableCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    segment: 'all',
    contactMethod: 'all',
    limit: 50
  });

  const fetchContactableCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/contactable-customers`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      if (response.data.success) {
        setCustomers(response.data.customers);
      } else {
        toast.error('Erro ao carregar clientes contactáveis');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const markAsContacted = async (customerId, method) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/analytics/mark-contacted`, {
        customerId,
        method,
        contactedAt: new Date().toISOString()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Cliente marcado como contatado!');
        fetchContactableCustomers(); // Recarregar lista
      } else {
        toast.error('Erro ao marcar cliente');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao marcar cliente');
    }
  };

  const exportContacts = () => {
    if (customers.length === 0) {
      toast.warning('Nenhum cliente para exportar');
      return;
    }

    const csvContent = [
      ['Nome', 'Telefone', 'WhatsApp', 'Segmento', 'Último Pedido', 'Total Pedidos'].join(','),
      ...customers.map(customer => [
        customer.name || 'N/A',
        customer.phone || 'N/A',
        customer.whatsappNumber || 'N/A',
        customer.customerSegment || 'regular',
        customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('pt-BR') : 'Nunca',
        customer.totalOrders || 0
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `clientes_contactaveis_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Lista exportada com sucesso!');
  };

  useEffect(() => {
    fetchContactableCustomers();
  }, [filters]);

  const getSegmentColor = (segment) => {
    const colors = {
      'new': '#4CAF50',
      'loyal': '#2196F3',
      'inactive': '#FF9800',
      'regular': '#9C27B0'
    };
    return colors[segment] || '#757575';
  };

  const getSegmentLabel = (segment) => {
    const labels = {
      'new': '🆕 Novo',
      'loyal': '💎 Fiel',
      'inactive': '😴 Inativo',
      'regular': '👤 Regular'
    };
    return labels[segment] || '👤 Regular';
  };

  return (
    <div className="contactable-customers">
      <div className="section-header">
        <h2>📱 Clientes Contactáveis para Liza</h2>
        <p>Lista de clientes disponíveis para campanhas via WhatsApp</p>
      </div>

      {/* Filtros */}
      <div className="filters-section">
        <div className="filter-group">
          <label>Segmento:</label>
          <select 
            value={filters.segment} 
            onChange={(e) => setFilters({...filters, segment: e.target.value})}
          >
            <option value="all">Todos os Segmentos</option>
            <option value="new">Novos Clientes</option>
            <option value="loyal">Clientes Fiéis</option>
            <option value="inactive">Clientes Inativos</option>
            <option value="regular">Clientes Regulares</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Método de Contato:</label>
          <select 
            value={filters.contactMethod} 
            onChange={(e) => setFilters({...filters, contactMethod: e.target.value})}
          >
            <option value="all">Todos os Métodos</option>
            <option value="whatsapp">Apenas WhatsApp</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Limite:</label>
          <select 
            value={filters.limit} 
            onChange={(e) => setFilters({...filters, limit: parseInt(e.target.value)})}
          >
            <option value={25}>25 clientes</option>
            <option value={50}>50 clientes</option>
            <option value={100}>100 clientes</option>
            <option value={200}>200 clientes</option>
          </select>
        </div>

        <button className="export-btn" onClick={exportContacts}>
          📊 Exportar CSV
        </button>
      </div>

      {/* Lista de Clientes */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando clientes...</p>
        </div>
      ) : (
        <div className="customers-list">
          <div className="list-header">
            <span>Encontrados: {customers.length} clientes</span>
          </div>
          
          <div className="customers-grid">
            {customers.map((customer) => (
              <div key={customer._id} className="customer-card">
                <div className="customer-header">
                  <h3>{customer.name}</h3>
                  <span 
                    className="segment-badge" 
                    style={{ backgroundColor: getSegmentColor(customer.customerSegment) }}
                  >
                    {getSegmentLabel(customer.customerSegment)}
                  </span>
                </div>

                <div className="customer-info">
                  <div className="info-row">
                    <span className="label">📞 Telefone:</span>
                    <span className="value">{customer.phone || 'N/A'}</span>
                  </div>
                  
                  {customer.whatsappNumber && (
                    <div className="info-row">
                      <span className="label">📱 WhatsApp:</span>
                      <span className="value">{customer.whatsappNumber}</span>
                      <button 
                        className="contact-btn whatsapp"
                        onClick={() => markAsContacted(customer._id, 'whatsapp')}
                      >
                        Contatado
                      </button>
                    </div>
                  )}
                  
                  
                  
                  <div className="info-row">
                    <span className="label">🛒 Total Pedidos:</span>
                    <span className="value">{customer.totalOrders || 0}</span>
                  </div>
                  
                  <div className="info-row">
                    <span className="label">📅 Último Pedido:</span>
                    <span className="value">
                      {customer.lastOrderDate 
                        ? new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {customers.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>Nenhum cliente encontrado</h3>
              <p>Tente ajustar os filtros para encontrar clientes contactáveis.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ContactableCustomers;
