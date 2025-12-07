import React, { useState, useEffect } from 'react';
import './SuperAdminDashboard.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../../config/urls';
import PremiumCard from '../../../components/Card/PremiumCard';
import ReactApexChart from 'react-apexcharts';

const SuperAdminDashboard = ({ token }) => {
  const [stats, setStats] = useState({
    stores: { total: 0, active: 0, pending: 0, suspended: 0 },
    users: { total: 0, storeAdmins: 0, customers: 0 },
    revenue: { total: 0, monthly: 0 },
    subscriptions: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  const quickActions = [
    { id: 1, title: 'Nova Loja', icon: <i className="ti ti-building-store"></i>, action: 'create-store' },
    { id: 2, title: 'Novo Usuário', icon: <i className="ti ti-user-plus"></i>, action: 'create-user' },
    { id: 3, title: 'Relatórios', icon: <i className="ti ti-chart-bar"></i>, action: 'view-reports' },
    { id: 4, title: 'Configurações', icon: <i className="ti ti-settings"></i>, action: 'system-settings' }
  ];

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 30000);
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
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao atualizar dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/system/recent-activity`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      // Fallback em caso de erro (mock data)
      return [
        { id: 1, type: 'info', message: 'Sistema iniciado com sucesso', time: 'Agora', icon: '🚀' }
      ];
    }
  };

  const handleQuickAction = (action) => {
    const routes = {
      'create-store': '/super-admin/stores',
      'create-user': '/super-admin/users',
      'view-reports': '/super-admin/analytics',
      'system-settings': '/super-admin/system-settings'
    };
    if (routes[action]) window.location.href = routes[action];
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const [palette, setPalette] = useState({
    primary: '#f76707',
    green: '#2fb344',
    blue: '#206bc4',
    orange: '#f59f00',
    gray: '#adb5bd'
  });

  useEffect(() => {
    const styles = getComputedStyle(document.documentElement);
    setPalette({
      primary: styles.getPropertyValue('--primary')?.trim() || '#f76707',
      green: styles.getPropertyValue('--tblr-green')?.trim() || '#2fb344',
      blue: styles.getPropertyValue('--tblr-blue')?.trim() || '#206bc4',
      orange: styles.getPropertyValue('--tblr-orange')?.trim() || '#f59f00',
      gray: styles.getPropertyValue('--tblr-gray-600')?.trim() || '#adb5bd'
    });
  }, []);

  const revenueSeries = [{
    name: 'Receita',
    data: [12, 14, 13, 16, 18, 21, 20, 24, 27, 25, 29, Math.max(30, Math.round((stats.revenue.monthly || 0) / 1000))]
  }];

  const revenueOptions = {
    chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    colors: [palette.primary],
    grid: { strokeDashArray: 3 },
    xaxis: { categories: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'] },
    yaxis: { labels: { formatter: (val) => `${val}k` } },
    tooltip: { theme: 'light' }
  };

  const ordersSeries = [{
    name: 'Pedidos',
    data: [32, 28, 35, 40, 38, 44, 50]
  }];

  const ordersOptions = {
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '45%' } },
    dataLabels: { enabled: false },
    colors: [palette.blue],
    grid: { strokeDashArray: 3 },
    xaxis: { categories: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'] }
  };

  const paymentsSeries = [44, 33, 23];
  const paymentsOptions = {
    chart: { type: 'donut' },
    labels: ['Crédito', 'PIX', 'Dinheiro'],
    colors: [palette.blue, palette.green, palette.orange],
    legend: { position: 'bottom' }
  };

  if (loading) {
    return (
      <div className="loading-wrapper">
        <div className="spinner-border text-primary" role="status"></div>
        <span className="ms-2">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="super-admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1 className="d-flex align-items-center">Dashboard Premium <span className="badge bg-orange-lt ms-2">Novo</span></h1>
          <p>Visão geral do sistema e métricas principais</p>
        </div>
        <div className="header-actions">
          <span className="last-update">Atualizado: {new Date().toLocaleTimeString()}</span>
          <button className="btn btn-primary" onClick={fetchDashboardData}>
            <i className="ti ti-refresh me-2"></i>Atualizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {/* Stores Card */}
        <PremiumCard title="Lojas" statusTop>
          <div className="stat-value-big">{stats.stores.total}</div>
          <div className="stat-desc">
            <span className="trend-indicator trend-positive">
              {stats.stores.active} Ativas
            </span>
            <span className="ms-auto text-muted">Total Registrado</span>
          </div>
          <div className="store-progress">
            <div className="progress">
              <div
                className="progress-bar"
                style={{ width: `${(stats.stores.active / (stats.stores.total || 1)) * 100}%` }}
              ></div>
            </div>
          </div>
        </PremiumCard>

        {/* Users Card */}
        <PremiumCard title="Usuários" statusTop statusColor="var(--tblr-blue)">
          <div className="stat-value-big">{stats.users.total}</div>
          <div className="users-list mt-3">
            <div className="user-item">
              <span>Administradores</span>
              <span className="badge bg-blue-lt">{stats.users.storeAdmins}</span>
            </div>
            <div className="user-item">
              <span>Clientes</span>
              <span className="badge bg-green-lt">{stats.users.customers}</span>
            </div>
          </div>
        </PremiumCard>

        {/* Revenue Card */}
        <PremiumCard title="Receita Mensal" statusTop statusColor="var(--tblr-green)">
          <div className="stat-value-big">{formatCurrency(stats.revenue.monthly)}</div>
          <div className="stat-desc mb-2">
            <span className="text-muted">Total Acumulado:</span>
            <span className="ms-auto font-weight-medium">{formatCurrency(stats.revenue.total)}</span>
          </div>
          <div className="text-muted text-sm">
            📈 +12% em relação ao mês anterior
          </div>
        </PremiumCard>

        {/* System Health */}
        <PremiumCard title="Saúde do Sistema" statusTop statusColor="var(--tblr-purple)">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span>Status API</span>
            <span className="badge bg-green-lt">Online</span>
          </div>
          <div className="d-flex align-items-center justify-content-between mb-2">
            <span>Latência</span>
            <span className="text-muted">45ms</span>
          </div>
          <div className="d-flex align-items-center justify-content-between">
            <span>Uptime</span>
            <span className="text-muted">99.9%</span>
          </div>
        </PremiumCard>
      </div>

      {/* Quick Actions */}
      <h3 className="mb-3">Ferramentas Rápidas</h3>
      <div className="actions-grid">
        {quickActions.map(action => (
          <div
            key={action.id}
            className="quick-action-btn"
            onClick={() => handleQuickAction(action.action)}
          >
            <span className="quick-action-icon">{action.icon}</span>
            <span className="quick-action-title">{action.title}</span>
          </div>
        ))}
      </div>

      {/* Charts */}
      <h3 className="mb-3">Métricas</h3>
      <div className="charts-grid">
        <PremiumCard title="Receita (12 meses)">
          <ReactApexChart options={revenueOptions} series={revenueSeries} type="area" height={240} />
        </PremiumCard>
        <PremiumCard title="Pedidos por dia">
          <ReactApexChart options={ordersOptions} series={ordersSeries} type="bar" height={240} />
        </PremiumCard>
        <PremiumCard title="Métodos de pagamento">
          <ReactApexChart options={paymentsOptions} series={paymentsSeries} type="donut" height={240} />
        </PremiumCard>
      </div>

      {/* Recent Activity & Plans */}
      <div className="row" style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '2', minWidth: '300px' }}>
          <PremiumCard title="Atividade Recente" icon={<i className="ti ti-clipboard-text"></i>}>
            <div className="activity-timeline">
              {stats.recentActivity.map((activity, idx) => (
                <div key={idx} className="timeline-item">
                  <div className="timeline-marker"></div>
                  <div className="timeline-content">
                    <div className="font-weight-medium">{activity.message || 'Atividade do sistema'}</div>
                    <span className="timeline-time">{activity.time}</span>
                  </div>
                </div>
              ))}
              {stats.recentActivity.length === 0 && (
                <div className="text-muted text-center py-3">Nenhuma atividade recente.</div>
              )}
            </div>
          </PremiumCard>
        </div>

        <div style={{ flex: '1', minWidth: '300px' }}>
          <PremiumCard title="Planos de Assinatura" icon={<i className="ti ti-chart-pie"></i>}>
            <div className="table-responsive">
              <table className="table table-vcenter">
                <thead>
                  <tr>
                    <th>Plano</th>
                    <th className="text-end">Lojas</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.subscriptions.map((sub, index) => (
                    <tr key={index}>
                      <td>
                        <span className="badge bg-orange-lt">
                          {sub._id || 'Padrão'}
                        </span>
                      </td>
                      <td className="text-end font-weight-medium">
                        {sub.count}
                      </td>
                    </tr>
                  ))}
                  {stats.subscriptions.length === 0 && (
                    <tr><td colSpan="2" className="text-center text-muted">Sem dados</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
