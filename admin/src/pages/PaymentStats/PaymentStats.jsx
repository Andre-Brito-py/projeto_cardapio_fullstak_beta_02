import React, { useState, useEffect } from 'react';
import './PaymentStats.css';
import axios from 'axios';
import { url } from '../../assets/assets';
import { toast } from 'react-toastify';

const PaymentStats = ({ token }) => {
  const [stats, setStats] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [filteredStats, setFilteredStats] = useState({ count: 0, revenue: 0, method: 'Todos' });

  const fetchPaymentStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/payment-stats/payment-stats`, {
        headers: { token },
        params: {
          startDate: startDate || undefined,
          endDate: endDate || undefined
        }
      });

      if (response.data.success) {
        setStats(response.data.data.stats);
        setTotalOrders(response.data.data.totalOrders);
        setTotalRevenue(response.data.data.totalRevenue);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPaymentStats();
    }
  }, [token, startDate, endDate]);

  useEffect(() => {
    // Calcular estatísticas filtradas
    if (paymentFilter === 'all') {
      setFilteredStats({
        count: totalOrders,
        revenue: totalRevenue,
        method: 'Todos os métodos'
      });
    } else {
      const filtered = stats.find(stat => stat._id === paymentFilter);
      if (filtered) {
        setFilteredStats({
          count: filtered.count,
          revenue: filtered.totalAmount,
          method: getPaymentMethodLabel(paymentFilter)
        });
      }
    }
  }, [paymentFilter, stats, totalOrders, totalRevenue]);

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'pix': 'PIX',
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'vale_refeicao': 'Vale Refeição',
      'vale_alimentacao': 'Vale Alimentação'
    };
    return labels[method] || method;
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'pix': '💳',
      'dinheiro': '💵',
      'cartao_credito': '💳',
      'cartao_debito': '💳',
      'vale_refeicao': '🍽️',
      'vale_alimentacao': '🛒'
    };
    return icons[method] || '💰';
  };

  const getPaymentMethodColor = (method) => {
    const colors = {
      'pix': '#00d4aa',
      'dinheiro': '#28a745',
      'cartao_credito': '#007bff',
      'cartao_debito': '#6f42c1',
      'vale_refeicao': '#fd7e14',
      'vale_alimentacao': '#20c997'
    };
    return colors[method] || '#6c757d';
  };

  if (loading) {
    return (
      <div className="payment-stats">
        <div className="loading">Carregando estatísticas...</div>
      </div>
    );
  }

  return (
    <div className="payment-stats">
      <div className="stats-header">
        <h2>📊 Estatísticas por Método de Pagamento</h2>
        <p>Visualize o desempenho dos diferentes métodos de pagamento</p>
      </div>

      <div className="date-filters">
        <div className="filter-group">
          <label>Data Inicial:</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>Data Final:</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <button onClick={fetchPaymentStats} className="refresh-btn">
          🔄 Atualizar
        </button>
      </div>

      <div className="payment-filter">
        <label>Filtrar por método:</label>
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
        >
          <option value="all">Todos os métodos</option>
          <option value="pix">PIX</option>
          <option value="dinheiro">Dinheiro</option>
          <option value="cartao_credito">Cartão de Crédito</option>
          <option value="cartao_debito">Cartão de Débito</option>
          <option value="vale_refeicao">Vale Refeição</option>
          <option value="vale_alimentacao">Vale Alimentação</option>
        </select>
      </div>

      <div className="filtered-summary">
        <h3>Resumo Filtrado</h3>
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon">📊</div>
            <div className="summary-content">
              <h4>Pedidos</h4>
              <p className="summary-number">{filteredStats.count}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💰</div>
            <div className="summary-content">
              <h4>Faturamento</h4>
              <p className="summary-number">R$ {filteredStats.revenue.toFixed(2)}</p>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon">💳</div>
            <div className="summary-content">
              <h4>Método</h4>
              <p className="summary-text">{filteredStats.method}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="stats-overview">
        <div className="stats-card total">
          <h3>Total de Pedidos</h3>
          <p className="stats-number">{totalOrders}</p>
        </div>
        <div className="stats-card revenue">
          <h3>Faturamento Total</h3>
          <p className="stats-number">R$ {totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <div 
            key={stat._id} 
            className={`stats-card payment-${stat._id}`}
            style={{ borderLeftColor: getPaymentMethodColor(stat._id) }}
          >
            <div className="card-header">
              <span className="payment-icon">{getPaymentMethodIcon(stat._id)}</span>
              <h3>{getPaymentMethodLabel(stat._id)}</h3>
            </div>
            <div className="card-content">
              <div className="stat-item">
                <span className="stat-label">Pedidos:</span>
                <span className="stat-value">{stat.count}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Faturamento:</span>
                <span className="stat-value">R$ {stat.totalAmount.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Ticket Médio:</span>
                <span className="stat-value">R$ {stat.averageAmount.toFixed(2)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Participação:</span>
                <span className="stat-value">{stat.percentage}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PaymentStats;