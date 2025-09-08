import React, { useState, useEffect } from 'react';
import './OrderStats.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const OrderStats = ({ url, token }) => {
  const [stats, setStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [filteredStats, setFilteredStats] = useState({ orders: 0, revenue: 0 });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch delivery statistics
  const fetchDeliveryStats = async () => {
    try {
      const params = new URLSearchParams();
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);

      const response = await axios.get(`${url}/api/order-stats/delivery-stats?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });

      if (response.data.success) {
        setStats(response.data.data.stats);
        setTotalOrders(response.data.data.totalOrders);
        setTotalRevenue(response.data.data.totalRevenue || 0);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  // Fetch orders by delivery type
  const fetchOrdersByType = async (page = 1) => {
    try {
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('deliveryType', selectedType);
      if (dateRange.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange.endDate) params.append('endDate', dateRange.endDate);
      params.append('page', page);
      params.append('limit', '10');

      const response = await axios.get(`${url}/api/order-stats/orders-by-type?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });

      if (response.data.success) {
        setOrders(response.data.data.orders);
        setCurrentPage(response.data.data.pagination.currentPage);
        setTotalPages(response.data.data.pagination.totalPages);
        
        // Calculate filtered statistics
        const filteredOrders = response.data.data.orders.length;
        const filteredRevenue = response.data.data.orders.reduce((sum, order) => sum + order.amount, 0);
        setFilteredStats({ orders: filteredOrders, revenue: filteredRevenue });
      } else {
        toast.error('Erro ao carregar pedidos');
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      toast.error('Erro ao carregar pedidos');
    }
  };

  // Fetch daily statistics
  const fetchDailyStats = async () => {
    try {
      const response = await axios.get(`${url}/api/order-stats/daily-stats?days=7`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });

      if (response.data.success) {
        setDailyStats(response.data.data.dailyStats);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas diárias:', error);
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      fetchDeliveryStats(),
      fetchOrdersByType(1),
      fetchDailyStats()
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [dateRange]);

  useEffect(() => {
    fetchOrdersByType(1);
  }, [selectedType]);

  // Handle date range change
  const handleDateChange = (field, value) => {
    setDateRange(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchOrdersByType(page);
  };

  // Get delivery type label
  const getDeliveryTypeLabel = (type) => {
    const labels = {
      'delivery': 'Entrega',
      'waiter': 'Garçom',
      'in_person': 'Presencial',
      'counter': 'Balcão'
    };
    return labels[type] || type;
  };

  // Get delivery type icon
  const getDeliveryTypeIcon = (type) => {
    const icons = {
      'delivery': '🚚',
      'waiter': '👨‍💼',
      'in_person': '🏪',
      'counter': '🏬'
    };
    return icons[type] || '📦';
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="order-stats loading">
        <div className="loading-spinner">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className="order-stats">
      <div className="stats-header">
        <h2>📊 Estatísticas de Saídas de Produtos</h2>
        
        {/* Date Range Filter */}
        <div className="date-filters">
          <div className="date-input-group">
            <label>Data Inicial:</label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange('startDate', e.target.value)}
            />
          </div>
          <div className="date-input-group">
            <label>Data Final:</label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange('endDate', e.target.value)}
            />
          </div>
          <button 
            className="clear-filters-btn"
            onClick={() => setDateRange({ startDate: '', endDate: '' })}
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-cards">
        <div className="stats-card total">
          <div className="card-icon">📈</div>
          <div className="card-content">
            <h3>Total de Pedidos</h3>
            <p className="card-number">{totalOrders}</p>
          </div>
        </div>
        
        <div className="stats-card revenue">
          <div className="card-icon">💰</div>
          <div className="card-content">
            <h3>Faturamento Total</h3>
            <p className="card-number">R$ {totalRevenue.toFixed(2)}</p>
          </div>
        </div>
        
        {stats.map((stat, index) => (
          <div key={index} className={`stats-card ${stat.deliveryType}`}>
            <div className="card-icon">{getDeliveryTypeIcon(stat.deliveryType)}</div>
            <div className="card-content">
              <h3>{getDeliveryTypeLabel(stat.deliveryType)}</h3>
              <p className="card-number">{stat.count}</p>
              <p className="card-percentage">{stat.percentage}%</p>
              <p className="card-revenue">R$ {stat.totalAmount.toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Type Filter */}
      <div className="type-filter">
        <h3>Filtrar por Tipo de Saída</h3>
        <div className="filter-buttons">
          <button 
            className={selectedType === 'all' ? 'active' : ''}
            onClick={() => setSelectedType('all')}
          >
            Todos
          </button>
          <button 
            className={selectedType === 'delivery' ? 'active' : ''}
            onClick={() => setSelectedType('delivery')}
          >
            🚚 Entrega
          </button>
          <button 
            className={selectedType === 'waiter' ? 'active' : ''}
            onClick={() => setSelectedType('waiter')}
          >
            👨‍💼 Garçom
          </button>
          <button 
            className={selectedType === 'in_person' ? 'active' : ''}
            onClick={() => setSelectedType('in_person')}
          >
            🏪 Presencial
          </button>
          <button 
            className={selectedType === 'counter' ? 'active' : ''}
            onClick={() => setSelectedType('counter')}
          >
            🏬 Balcão
          </button>
        </div>
      </div>

      {/* Filtered Statistics Summary */}
      {(selectedType !== 'all' || dateRange.startDate || dateRange.endDate) && (
        <div className="filtered-summary">
          <h3>📊 Resumo dos Filtros Aplicados</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">📦</div>
              <div className="summary-content">
                <h4>Pedidos Filtrados</h4>
                <p className="summary-number">{filteredStats.orders}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💵</div>
              <div className="summary-content">
                <h4>Faturamento Filtrado</h4>
                <p className="summary-number">R$ {filteredStats.revenue.toFixed(2)}</p>
              </div>
            </div>
            {selectedType !== 'all' && (
              <div className="summary-card">
                <div className="summary-icon">{getDeliveryTypeIcon(selectedType)}</div>
                <div className="summary-content">
                  <h4>Tipo Selecionado</h4>
                  <p className="summary-text">{getDeliveryTypeLabel(selectedType)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Orders List */}
      <div className="orders-section">
        <h3>Pedidos Recentes</h3>
        <div className="orders-list">
          {orders.length === 0 ? (
            <div className="no-orders">Nenhum pedido encontrado para os filtros selecionados.</div>
          ) : (
            orders.map((order, index) => (
              <div key={index} className="order-item">
                <div className="order-info">
                  <div className="order-header">
                    <span className="order-id">#{order._id.slice(-6)}</span>
                    <span className={`delivery-type-badge ${order.deliveryType}`}>
                      {getDeliveryTypeIcon(order.deliveryType)} {getDeliveryTypeLabel(order.deliveryType)}
                    </span>
                    <span className="order-date">{formatDate(order.date)}</span>
                  </div>
                  
                  <div className="order-details">
                    <p className="customer-name">
                      {order.address?.firstName} {order.address?.lastName}
                    </p>
                    <p className="order-items">
                      {order.items.map((item, idx) => 
                        `${item.name} x${item.quantity}`
                      ).join(', ')}
                    </p>
                    {order.tableNumber && (
                      <p className="table-info">🍽️ Mesa {order.tableNumber}</p>
                    )}
                  </div>
                </div>
                
                <div className="order-amount">
                  <span className="amount">R$ {order.amount.toFixed(2)}</span>
                  <span className={`status ${order.status.toLowerCase().replace(' ', '-')}`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              Anterior
            </button>
            
            <span className="page-info">
              Página {currentPage} de {totalPages}
            </span>
            
            <button 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* Daily Stats Chart */}
      {dailyStats.length > 0 && (
        <div className="daily-stats-section">
          <h3>Estatísticas dos Últimos 7 Dias</h3>
          <div className="daily-stats-chart">
            {dailyStats.map((day, index) => (
              <div key={index} className="daily-stat-item">
                <div className="day-date">{formatDate(day._id)}</div>
                <div className="day-orders">{day.totalOrders} pedidos</div>
                <div className="day-revenue">R$ {day.totalRevenue.toFixed(2)}</div>
                <div className="day-types">
                  {day.deliveryTypes.map((type, typeIndex) => (
                    <span key={typeIndex} className={`type-count ${type.type}`}>
                      {getDeliveryTypeIcon(type.type)} {type.count}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderStats;