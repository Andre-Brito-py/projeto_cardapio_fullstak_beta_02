import React, { useState, useEffect } from 'react';
import './OrderStats.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import ReactApexChart from 'react-apexcharts';

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
          'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
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
          'Authorization': `Bearer ${token}`
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
      'delivery': <i className="ti ti-truck"></i>,
      'waiter': <i className="ti ti-user"></i>,
      'in_person': <i className="ti ti-building-store"></i>,
      'counter': <i className="ti ti-building"></i>
    };
    return icons[type] || <i className="ti ti-package"></i>;
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const paletteVars = getComputedStyle(document.documentElement);
  const palette = {
    primary: paletteVars.getPropertyValue('--primary')?.trim() || '#f76707',
    blue: paletteVars.getPropertyValue('--tblr-blue')?.trim() || '#206bc4',
    green: paletteVars.getPropertyValue('--tblr-green')?.trim() || '#2fb344',
    orange: paletteVars.getPropertyValue('--tblr-orange')?.trim() || '#f59f00'
  };

  const categoriesDays = dailyStats.map(d => formatDate(d._id));
  const seriesOrders = [{ name: 'Pedidos', data: dailyStats.map(d => d.totalOrders) }];
  const seriesRevenue = [{ name: 'Faturamento', data: dailyStats.map(d => Number(d.totalRevenue.toFixed(2))) }];
  const optionsBar = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    colors: [palette.blue],
    grid: { strokeDashArray: 3 },
    xaxis: { categories: categoriesDays }
  };
  const optionsArea = {
    chart: { type: 'area', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    colors: [palette.primary],
    grid: { strokeDashArray: 3 },
    xaxis: { categories: categoriesDays },
    yaxis: { labels: { formatter: (v) => `R$ ${v.toFixed(0)}` } }
  };
  const aggTypes = ['delivery','waiter','in_person','counter'].map(t => ({
    type: t,
    count: dailyStats.reduce((sum, d) => sum + (d.deliveryTypes.find(x => x.type === t)?.count || 0), 0)
  }));
  const donutLabels = aggTypes.map(x => getDeliveryTypeLabel(x.type));
  const donutSeries = aggTypes.map(x => x.count);
  const donutOptions = {
    chart: { type: 'donut' },
    labels: donutLabels,
    colors: [palette.orange, palette.green, palette.blue, palette.primary],
    legend: { position: 'bottom' }
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
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h2 className="m-0">Estatísticas de Saídas</h2>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="d-flex flex-column">
              <label className="form-label m-0">Inicial</label>
              <input type="date" value={dateRange.startDate} onChange={(e) => handleDateChange('startDate', e.target.value)} className="form-control" />
            </div>
            <div className="d-flex flex-column">
              <label className="form-label m-0">Final</label>
              <input type="date" value={dateRange.endDate} onChange={(e) => handleDateChange('endDate', e.target.value)} className="form-control" />
            </div>
            <button className="btn btn-outline" onClick={() => setDateRange({ startDate: '', endDate: '' })}>Limpar</button>
          </div>
        </div>
        <div className="card-body">

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
            <i className="ti ti-truck"></i> Entrega
          </button>
          <button 
            className={selectedType === 'waiter' ? 'active' : ''}
            onClick={() => setSelectedType('waiter')}
          >
            <i className="ti ti-user"></i> Garçom
          </button>
          <button 
            className={selectedType === 'in_person' ? 'active' : ''}
            onClick={() => setSelectedType('in_person')}
          >
            <i className="ti ti-building-store"></i> Presencial
          </button>
          <button 
            className={selectedType === 'counter' ? 'active' : ''}
            onClick={() => setSelectedType('counter')}
          >
            <i className="ti ti-building"></i> Balcão
          </button>
        </div>
      </div>

      {(selectedType !== 'all' || dateRange.startDate || dateRange.endDate) && (
        <div className="filtered-summary">
          <h3>Resumo dos Filtros Aplicados</h3>
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon"><i className="ti ti-package"></i></div>
              <div className="summary-content">
                <h4>Pedidos Filtrados</h4>
                <p className="summary-number">{filteredStats.orders}</p>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon"><i className="ti ti-currency-real"></i></div>
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
                      <p className="table-info"><i className="ti ti-tools-kitchen-2"></i> Mesa {order.tableNumber}</p>
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

      {dailyStats.length > 0 && (
        <div className="charts-grid">
          <div className="card">
            <div className="card-header"><h3 className="m-0">Pedidos (7 dias)</h3></div>
            <div className="card-body">
              <ReactApexChart options={optionsBar} series={seriesOrders} type="bar" height={240} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="m-0">Faturamento (7 dias)</h3></div>
            <div className="card-body">
              <ReactApexChart options={optionsArea} series={seriesRevenue} type="area" height={240} />
            </div>
          </div>
          <div className="card">
            <div className="card-header"><h3 className="m-0">Distribuição por tipo</h3></div>
            <div className="card-body">
              <ReactApexChart options={donutOptions} series={donutSeries} type="donut" height={240} />
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default OrderStats;
