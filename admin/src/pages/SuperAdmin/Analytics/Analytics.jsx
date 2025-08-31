import React, { useState, useEffect } from 'react';
import './Analytics.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../../config/urls';

const Analytics = ({ token }) => {
  const [stats, setStats] = useState({
    stores: { total: 0, active: 0, pending: 0, suspended: 0 },
    users: { total: 0, storeAdmins: 0, customers: 0 },
    revenue: { total: 0, monthly: 0, daily: 0, weekly: 0 },
    subscriptions: [],
    growth: { stores: 0, users: 0, revenue: 0 },
    topStores: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [chartData, setChartData] = useState({
    revenue: [],
    stores: [],
    users: []
  });

  useEffect(() => {
    fetchSystemStats();
    fetchChartData();
  }, [selectedPeriod]);

  const fetchSystemStats = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/system/stats?period=${selectedPeriod}`, {
        headers: { token }
      });

      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas do sistema');
    } finally {
      setLoading(false);
    }
  };

  const fetchChartData = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/system/chart-data?period=${selectedPeriod}`, {
        headers: { token }
      });

      if (response.data.success) {
        setChartData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do gráfico:', error);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  const getStoreStatusPercentage = (status) => {
    if (stats.stores.total === 0) return 0;
    return ((stats.stores[status] / stats.stores.total) * 100).toFixed(1);
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return '📈';
    if (growth < 0) return '📉';
    return '➖';
  };

  const getGrowthClass = (growth) => {
    if (growth > 0) return 'positive';
    if (growth < 0) return 'negative';
    return 'neutral';
  };

  const renderSimpleChart = (data, type) => {
    if (!data || data.length === 0) return <div className="no-chart-data">Sem dados</div>;
    
    const maxValue = Math.max(...data.map(item => item.value));
    
    return (
      <div className="simple-chart">
        {data.slice(-7).map((item, index) => (
          <div key={index} className="chart-bar">
            <div 
              className={`bar bar-${type}`}
              style={{ height: `${(item.value / maxValue) * 100}%` }}
              title={`${item.label}: ${type === 'revenue' ? formatCurrency(item.value) : formatNumber(item.value)}`}
            ></div>
            <div className="bar-label">{item.label}</div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="analytics-container">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Carregando estatísticas avançadas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="header-content">
          <h1>📊 Analytics Avançado</h1>
          <p>Análise completa do ecossistema com métricas em tempo real</p>
        </div>
        <div className="header-controls">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-selector"
          >
            <option value="daily">Últimos 7 dias</option>
            <option value="weekly">Últimas 4 semanas</option>
            <option value="monthly">Últimos 6 meses</option>
            <option value="yearly">Últimos 2 anos</option>
          </select>
          <button onClick={fetchSystemStats} className="refresh-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="kpi-grid">
        <div className="kpi-card revenue">
          <div className="kpi-icon">💰</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatCurrency(stats.revenue.total)}</div>
            <div className="kpi-label">Receita Total</div>
            <div className={`kpi-growth ${getGrowthClass(stats.growth.revenue)}`}>
              {getGrowthIcon(stats.growth.revenue)} {Math.abs(stats.growth.revenue)}%
            </div>
          </div>
        </div>

        <div className="kpi-card stores">
          <div className="kpi-icon">🏪</div>
          <div className="kpi-content">
            <div className="kpi-value">{stats.stores.total}</div>
            <div className="kpi-label">Total de Lojas</div>
            <div className={`kpi-growth ${getGrowthClass(stats.growth.stores)}`}>
              {getGrowthIcon(stats.growth.stores)} {Math.abs(stats.growth.stores)}%
            </div>
          </div>
        </div>

        <div className="kpi-card users">
          <div className="kpi-icon">👥</div>
          <div className="kpi-content">
            <div className="kpi-value">{formatNumber(stats.users.total)}</div>
            <div className="kpi-label">Usuários Ativos</div>
            <div className={`kpi-growth ${getGrowthClass(stats.growth.users)}`}>
              {getGrowthIcon(stats.growth.users)} {Math.abs(stats.growth.users)}%
            </div>
          </div>
        </div>

        <div className="kpi-card conversion">
          <div className="kpi-icon">📈</div>
          <div className="kpi-content">
            <div className="kpi-value">{getStoreStatusPercentage('active')}%</div>
            <div className="kpi-label">Taxa de Ativação</div>
            <div className="kpi-growth positive">
              📊 Lojas Ativas
            </div>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h3>💰 Evolução da Receita</h3>
            <span className="chart-period">{selectedPeriod}</span>
          </div>
          <div className="chart-content">
            {renderSimpleChart(chartData.revenue, 'revenue')}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>🏪 Crescimento de Lojas</h3>
            <span className="chart-period">{selectedPeriod}</span>
          </div>
          <div className="chart-content">
            {renderSimpleChart(chartData.stores, 'stores')}
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h3>👥 Crescimento de Usuários</h3>
            <span className="chart-period">{selectedPeriod}</span>
          </div>
          <div className="chart-content">
            {renderSimpleChart(chartData.users, 'users')}
          </div>
        </div>
      </div>

      {/* Análise Detalhada */}
      <div className="analytics-detailed">
        {/* Status das Lojas */}
        <div className="analytics-card stores-status">
          <div className="card-header">
            <h3>🏪 Status das Lojas</h3>
            <span className="total-count">{stats.stores.total}</span>
          </div>
          <div className="card-content">
            <div className="status-grid">
              <div className="status-item active">
                <div className="status-circle"></div>
                <div className="status-info">
                  <div className="status-value">{stats.stores.active}</div>
                  <div className="status-label">Ativas ({getStoreStatusPercentage('active')}%)</div>
                </div>
              </div>
              <div className="status-item pending">
                <div className="status-circle"></div>
                <div className="status-info">
                  <div className="status-value">{stats.stores.pending}</div>
                  <div className="status-label">Pendentes ({getStoreStatusPercentage('pending')}%)</div>
                </div>
              </div>
              <div className="status-item suspended">
                <div className="status-circle"></div>
                <div className="status-info">
                  <div className="status-value">{stats.stores.suspended}</div>
                  <div className="status-label">Suspensas ({getStoreStatusPercentage('suspended')}%)</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Lojas */}
        <div className="analytics-card top-stores">
          <div className="card-header">
            <h3>🏆 Top Lojas por Receita</h3>
          </div>
          <div className="card-content">
            {stats.topStores && stats.topStores.length > 0 ? (
              <div className="top-stores-list">
                {stats.topStores.slice(0, 5).map((store, index) => (
                  <div key={index} className="top-store-item">
                    <div className="store-rank">#{index + 1}</div>
                    <div className="store-info">
                      <div className="store-name">{store.name}</div>
                      <div className="store-revenue">{formatCurrency(store.revenue)}</div>
                    </div>
                    <div className="store-growth">
                      {store.growth > 0 ? '📈' : store.growth < 0 ? '📉' : '➖'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>Dados de receita não disponíveis</p>
              </div>
            )}
          </div>
        </div>

        {/* Planos de Assinatura */}
        <div className="analytics-card subscriptions-detailed">
          <div className="card-header">
            <h3>📋 Distribuição de Planos</h3>
          </div>
          <div className="card-content">
            {stats.subscriptions && stats.subscriptions.length > 0 ? (
              <div className="subscriptions-grid">
                {stats.subscriptions.map((sub, index) => (
                  <div key={index} className="subscription-item">
                    <div className="subscription-name">{sub._id || 'Básico'}</div>
                    <div className="subscription-count">{sub.count} lojas</div>
                    <div className="subscription-percentage">
                      {((sub.count / stats.stores.total) * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">
                <p>Nenhum plano configurado</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Métricas Avançadas */}
      <div className="advanced-metrics">
        <h3>📊 Métricas Avançadas</h3>
        <div className="metrics-grid">
          <div className="metric-item">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-title">Receita Média por Loja</div>
              <div className="metric-value">
                {stats.stores.active > 0 
                  ? formatCurrency(stats.revenue.total / stats.stores.active)
                  : formatCurrency(0)
                }
              </div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-title">Usuários por Loja</div>
              <div className="metric-value">
                {stats.stores.total > 0 
                  ? Math.round(stats.users.total / stats.stores.total)
                  : 0
                } usuários
              </div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">📈</div>
            <div className="metric-content">
              <div className="metric-title">Receita Diária Média</div>
              <div className="metric-value">
                {formatCurrency(stats.revenue.daily || 0)}
              </div>
            </div>
          </div>
          <div className="metric-item">
            <div className="metric-icon">⚡</div>
            <div className="metric-content">
              <div className="metric-title">Taxa de Conversão</div>
              <div className="metric-value">
                {stats.users.customers > 0 && stats.users.total > 0
                  ? ((stats.users.customers / stats.users.total) * 100).toFixed(1)
                  : 0
                }%
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;