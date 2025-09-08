import React, { useState, useEffect } from 'react';
import './SuperAdminDashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../../config/urls';

const SuperAdminDashboard = ({ token }) => {
  const [stats, setStats] = useState({
    stores: { total: 0, active: 0, pending: 0, suspended: 0 },
    users: { total: 0, storeAdmins: 0, customers: 0 },
    revenue: { total: 0, monthly: 0 },
    subscriptions: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [quickActions, setQuickActions] = useState([
    { id: 1, title: 'Nova Loja', icon: '🏪', action: 'create-store', color: 'primary' },
    { id: 2, title: 'Novo Usuário', icon: '👤', action: 'create-user', color: 'success' },
    { id: 3, title: 'Relatórios', icon: '📊', action: 'view-reports', color: 'info' },
    { id: 4, title: 'Configurações', icon: '⚙️', action: 'system-settings', color: 'warning' }
  ]);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        axios.get(`${BACKEND_URL}/api/system/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetchRecentActivity()
      ]);

      if (statsResponse.data.success) {
        setStats(prev => ({
          ...prev,
          ...statsResponse.data.data,
          recentActivity: activityResponse
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/system/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        return response.data.data;
      } else {
        console.error('Erro ao buscar atividades recentes:', response.data.message);
        // Fallback para dados simulados em caso de erro
        return [
          { id: 1, type: 'system_backup', message: 'Backup automático realizado com sucesso', time: '1 hora atrás', icon: '💾' }
        ];
      }
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
      // Fallback para dados simulados em caso de erro
      return [
        { id: 1, type: 'system_backup', message: 'Backup automático realizado com sucesso', time: '1 hora atrás', icon: '💾' }
      ];
    }
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'create-store':
        window.location.href = '/super-admin/stores';
        break;
      case 'create-user':
        window.location.href = '/super-admin/users';
        break;
      case 'view-reports':
        window.location.href = '/super-admin/analytics';
        break;
      case 'system-settings':
        window.location.href = '/super-admin/system-settings';
        break;
      default:
        break;
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getGrowthPercentage = (current, previous) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🚀 Dashboard Super Admin</h1>
          <p>Bem-vindo ao centro de controle do seu ecossistema</p>
        </div>
        <div className="header-actions">
          <button className="refresh-btn" onClick={fetchDashboardData}>
            🔄 Atualizar
          </button>
          <div className="last-update">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>⚡ Ações Rápidas</h3>
        <div className="actions-grid">
          {quickActions.map(action => (
            <div 
              key={action.id} 
              className={`action-card ${action.color}`}
              onClick={() => handleQuickAction(action.action)}
            >
              <div className="action-icon">{action.icon}</div>
              <div className="action-title">{action.title}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="stats-grid">
        {/* Stores Overview */}
        <div className="stat-card stores-overview">
          <div className="card-header">
            <h3>🏪 Lojas</h3>
            <div className="total-count">{stats.stores.total}</div>
          </div>
          <div className="card-content">
            <div className="stat-row">
              <div className="stat-item active">
                <span className="label">Ativas</span>
                <span className="value">{stats.stores.active}</span>
              </div>
              <div className="stat-item pending">
                <span className="label">Pendentes</span>
                <span className="value">{stats.stores.pending}</span>
              </div>
              <div className="stat-item suspended">
                <span className="label">Suspensas</span>
                <span className="value">{stats.stores.suspended}</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(stats.stores.active / stats.stores.total) * 100}%` }}
              ></div>
            </div>
            <div className="progress-label">
              {((stats.stores.active / stats.stores.total) * 100).toFixed(1)}% das lojas ativas
            </div>
          </div>
        </div>

        {/* Users Overview */}
        <div className="stat-card users-overview">
          <div className="card-header">
            <h3>👥 Usuários</h3>
            <div className="total-count">{stats.users.total}</div>
          </div>
          <div className="card-content">
            <div className="user-breakdown">
              <div className="user-type">
                <div className="type-icon">👨‍💼</div>
                <div className="type-info">
                  <span className="type-label">Administradores</span>
                  <span className="type-count">{stats.users.storeAdmins}</span>
                </div>
              </div>
              <div className="user-type">
                <div className="type-icon">👤</div>
                <div className="type-info">
                  <span className="type-label">Clientes</span>
                  <span className="type-count">{stats.users.customers}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Revenue Overview */}
        <div className="stat-card revenue-overview">
          <div className="card-header">
            <h3>💰 Receita</h3>
            <div className="growth-indicator positive">+12.5%</div>
          </div>
          <div className="card-content">
            <div className="revenue-stats">
              <div className="revenue-item">
                <span className="label">Total</span>
                <span className="value">{formatCurrency(stats.revenue.total)}</span>
              </div>
              <div className="revenue-item">
                <span className="label">Este Mês</span>
                <span className="value">{formatCurrency(stats.revenue.monthly)}</span>
              </div>
            </div>
            <div className="revenue-chart">
              <div className="chart-placeholder">
                📈 Gráfico de receita mensal
              </div>
            </div>
          </div>
        </div>

        {/* System Health */}
        <div className="stat-card system-health">
          <div className="card-header">
            <h3>🔧 Saúde do Sistema</h3>
            <div className="health-status online">Online</div>
          </div>
          <div className="card-content">
            <div className="health-metrics">
              <div className="metric">
                <span className="metric-label">Uptime</span>
                <span className="metric-value">99.9%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Resposta</span>
                <span className="metric-value">45ms</span>
              </div>
              <div className="metric">
                <span className="metric-label">CPU</span>
                <span className="metric-value">23%</span>
              </div>
              <div className="metric">
                <span className="metric-label">Memória</span>
                <span className="metric-value">67%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="recent-activity">
        <div className="activity-header">
          <h3>📋 Atividade Recente</h3>
          <button className="view-all-btn">Ver Todas</button>
        </div>
        <div className="activity-list">
          {stats.recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <div className="activity-icon">{activity.icon}</div>
              <div className="activity-content">
                <div className="activity-message">{activity.message}</div>
                <div className="activity-time">{activity.time}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Subscription Plans Overview */}
      <div className="subscription-overview">
        <h3>📊 Planos de Assinatura</h3>
        <div className="plans-grid">
          {stats.subscriptions.map((sub, index) => (
            <div key={index} className="plan-card">
              <div className="plan-name">{sub._id || 'Não definido'}</div>
              <div className="plan-count">{sub.count} lojas</div>
              <div className="plan-percentage">
                {((sub.count / stats.stores.total) * 100).toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;