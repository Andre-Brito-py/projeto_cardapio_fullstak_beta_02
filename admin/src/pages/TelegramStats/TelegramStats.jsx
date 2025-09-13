import React, { useState, useEffect } from 'react';
import './TelegramStats.css';

const TelegramStats = () => {
  const [stats, setStats] = useState({
    totalContacts: 0,
    activeContacts: 0,
    totalCampaigns: 0,
    sentMessages: 0,
    deliveryRate: 0,
    engagementRate: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [chartData, setChartData] = useState({
    contacts: [],
    campaigns: [],
    messages: []
  });

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`/api/telegram/stats?range=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setChartData(data.chartData);
      } else {
        console.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatPercentage = (num) => {
    return `${num.toFixed(1)}%`;
  };

  const getTimeRangeLabel = (range) => {
    const labels = {
      '1d': 'Últimas 24 horas',
      '7d': 'Últimos 7 dias',
      '30d': 'Últimos 30 dias',
      '90d': 'Últimos 90 dias'
    };
    return labels[range] || 'Período personalizado';
  };

  const renderActivityItem = (activity, index) => {
    const getActivityIcon = (type) => {
      switch (type) {
        case 'contact_added': return '👤';
        case 'campaign_sent': return '📤';
        case 'message_delivered': return '✅';
        case 'contact_engaged': return '💬';
        default: return '📊';
      }
    };

    const getActivityColor = (type) => {
      switch (type) {
        case 'contact_added': return '#27ae60';
        case 'campaign_sent': return '#3498db';
        case 'message_delivered': return '#2ecc71';
        case 'contact_engaged': return '#e74c3c';
        default: return '#95a5a6';
      }
    };

    return (
      <div key={index} className="activity-item">
        <div 
          className="activity-icon"
          style={{ backgroundColor: getActivityColor(activity.type) }}
        >
          {getActivityIcon(activity.type)}
        </div>
        <div className="activity-content">
          <div className="activity-description">{activity.description}</div>
          <div className="activity-time">{activity.time}</div>
        </div>
        <div className="activity-count">{activity.count}</div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="telegram-stats">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando estatísticas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-stats">
      {/* Header */}
      <div className="page-header">
        <h1>📊 Estatísticas do Telegram</h1>
        <p>Acompanhe o desempenho em tempo real das suas campanhas e contatos</p>
      </div>

      {/* Controles */}
      <div className="stats-controls">
        <div className="time-range-selector">
          <label>Período:</label>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="1d">Últimas 24 horas</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
        </div>
        <div className="last-update">
          Última atualização: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Cards de Estatísticas Principais */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalContacts)}</div>
            <div className="stat-label">Total de Contatos</div>
            <div className="stat-change positive">+{stats.newContactsToday || 0} hoje</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.activeContacts)}</div>
            <div className="stat-label">Contatos Ativos</div>
            <div className="stat-change">{formatPercentage((stats.activeContacts / stats.totalContacts) * 100)}</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">📢</div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.totalCampaigns)}</div>
            <div className="stat-label">Campanhas Enviadas</div>
            <div className="stat-change">{getTimeRangeLabel(timeRange)}</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">💬</div>
          <div className="stat-content">
            <div className="stat-number">{formatNumber(stats.sentMessages)}</div>
            <div className="stat-label">Mensagens Enviadas</div>
            <div className="stat-change">{getTimeRangeLabel(timeRange)}</div>
          </div>
        </div>
      </div>

      {/* Métricas de Performance */}
      <div className="performance-metrics">
        <div className="metrics-card">
          <h3>📈 Métricas de Performance</h3>
          <div className="metrics-grid">
            <div className="metric-item">
              <div className="metric-circle" style={{ '--percentage': stats.deliveryRate }}>
                <span className="metric-value">{formatPercentage(stats.deliveryRate)}</span>
              </div>
              <div className="metric-label">Taxa de Entrega</div>
            </div>
            <div className="metric-item">
              <div className="metric-circle" style={{ '--percentage': stats.engagementRate }}>
                <span className="metric-value">{formatPercentage(stats.engagementRate)}</span>
              </div>
              <div className="metric-label">Taxa de Engajamento</div>
            </div>
            <div className="metric-item">
              <div className="metric-circle" style={{ '--percentage': stats.openRate || 0 }}>
                <span className="metric-value">{formatPercentage(stats.openRate || 0)}</span>
              </div>
              <div className="metric-label">Taxa de Abertura</div>
            </div>
          </div>
        </div>

        {/* Atividade Recente */}
        <div className="activity-card">
          <h3>🕒 Atividade Recente</h3>
          <div className="activity-list">
            {stats.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((activity, index) => renderActivityItem(activity, index))
            ) : (
              <div className="no-activity">
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos Simples */}
      <div className="charts-section">
        <div className="chart-card">
          <h3>📊 Crescimento de Contatos</h3>
          <div className="simple-chart">
            {chartData.contacts && chartData.contacts.length > 0 ? (
              <div className="chart-bars">
                {chartData.contacts.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill"
                      style={{ 
                        height: `${(item.value / Math.max(...chartData.contacts.map(c => c.value))) * 100}%` 
                      }}
                    ></div>
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Dados insuficientes para exibir gráfico</div>
            )}
          </div>
        </div>

        <div className="chart-card">
          <h3>📤 Campanhas por Período</h3>
          <div className="simple-chart">
            {chartData.campaigns && chartData.campaigns.length > 0 ? (
              <div className="chart-bars">
                {chartData.campaigns.map((item, index) => (
                  <div key={index} className="chart-bar">
                    <div 
                      className="bar-fill campaigns"
                      style={{ 
                        height: `${(item.value / Math.max(...chartData.campaigns.map(c => c.value))) * 100}%` 
                      }}
                    ></div>
                    <div className="bar-label">{item.label}</div>
                    <div className="bar-value">{item.value}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Dados insuficientes para exibir gráfico</div>
            )}
          </div>
        </div>
      </div>

      {/* Resumo por Tags */}
      <div className="tags-summary">
        <h3>🏷️ Distribuição por Tags</h3>
        <div className="tags-stats">
          {stats.tagStats && stats.tagStats.length > 0 ? (
            stats.tagStats.map((tag, index) => (
              <div key={index} className="tag-stat">
                <div className="tag-name">{tag.name}</div>
                <div className="tag-count">{tag.count} contatos</div>
                <div className="tag-percentage">{formatPercentage((tag.count / stats.totalContacts) * 100)}</div>
                <div 
                  className="tag-bar"
                  style={{ width: `${(tag.count / stats.totalContacts) * 100}%` }}
                ></div>
              </div>
            ))
          ) : (
            <div className="no-tags">
              <p>Nenhuma tag configurada ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TelegramStats;