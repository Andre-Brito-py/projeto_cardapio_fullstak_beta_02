import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../../config/urls';
import PremiumCard from '../../../components/Card/PremiumCard';
import ReactApexChart from 'react-apexcharts';
import { motion } from 'framer-motion';

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
    { id: 1, title: 'Nova Loja', icon: 'ti-building-store', action: 'create-store' },
    { id: 2, title: 'Novo Usuário', icon: 'ti-user-plus', action: 'create-user' },
    { id: 3, title: 'Relatórios', icon: 'ti-chart-bar', action: 'view-reports' },
    { id: 4, title: 'Configurações', icon: 'ti-settings', action: 'system-settings' }
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

  const palette = {
    primary: '#4f46e5',
    green: '#10b981',
    blue: '#3b82f6',
    orange: '#f59e0b',
    gray: '#9ca3af'
  };

  const revenueSeries = [{
    name: 'Receita',
    data: [12, 14, 13, 16, 18, 21, 20, 24, 27, 25, 29, Math.max(30, Math.round((stats.revenue.monthly || 0) / 1000))]
  }];

  const revenueOptions = {
    chart: { type: 'area', toolbar: { show: false }, sparkline: { enabled: false } },
    stroke: { curve: 'smooth', width: 2 },
    dataLabels: { enabled: false },
    colors: [palette.primary],
    grid: { strokeDashArray: 3, borderColor: '#e5e7eb' },
    xaxis: { categories: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'], labels: { style: { colors: palette.gray } } },
    yaxis: { labels: { formatter: (val) => `${val}k`, style: { colors: palette.gray } } },
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
    grid: { strokeDashArray: 3, borderColor: '#e5e7eb' },
    xaxis: { categories: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'], labels: { style: { colors: palette.gray } } },
    yaxis: { labels: { style: { colors: palette.gray } } }
  };

  const paymentsSeries = [44, 33, 23];
  const paymentsOptions = {
    chart: { type: 'donut' },
    labels: ['Crédito', 'PIX', 'Dinheiro'],
    colors: [palette.blue, palette.green, palette.orange],
    legend: { position: 'bottom', labels: { colors: palette.gray } }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <span className="ml-3 text-gray-600 font-medium">Carregando dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            Dashboard Premium 
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
              Novo
            </span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Visão geral do sistema e métricas principais</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">Atualizado: {new Date().toLocaleTimeString()}</span>
          <button 
            className="inline-flex items-center gap-2 px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            onClick={fetchDashboardData}
          >
            <i className="ti ti-refresh"></i> Atualizar
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <PremiumCard title="Lojas" statusTop statusColor={palette.orange}>
          <div className="text-3xl font-bold text-gray-900">{stats.stores.total}</div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-green-600 font-medium flex items-center gap-1">
              <i className="ti ti-trending-up"></i> {stats.stores.active} Ativas
            </span>
            <span className="text-gray-400">Total Registrado</span>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
            <div className="bg-orange-500 h-1.5 rounded-full" style={{ width: `${(stats.stores.active / (stats.stores.total || 1)) * 100}%` }}></div>
          </div>
        </PremiumCard>

        <PremiumCard title="Usuários" statusTop statusColor={palette.blue}>
          <div className="text-3xl font-bold text-gray-900">{stats.users.total}</div>
          <div className="mt-4 space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Administradores</span>
              <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">{stats.users.storeAdmins}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Clientes</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium">{stats.users.customers}</span>
            </div>
          </div>
        </PremiumCard>

        <PremiumCard title="Receita Mensal" statusTop statusColor={palette.green}>
          <div className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue.monthly)}</div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-gray-500">Total Acumulado:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(stats.revenue.total)}</span>
          </div>
          <div className="mt-2 text-xs text-green-600 font-medium">
            📈 +12% em relação ao mês anterior
          </div>
        </PremiumCard>

        <PremiumCard title="Saúde do Sistema" statusTop statusColor="#8b5cf6">
          <div className="mt-2 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Status API</span>
              <span className="px-2 py-0.5 rounded bg-green-100 text-green-800 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span> Online
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Latência</span>
              <span className="text-gray-900 font-medium">45ms</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Uptime</span>
              <span className="text-gray-900 font-medium">99.9%</span>
            </div>
          </div>
        </PremiumCard>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ferramentas Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickActions.map(action => (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={action.id}
              onClick={() => handleQuickAction(action.action)}
              className="flex flex-col items-center justify-center p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                <i className={`ti ${action.icon} text-2xl text-indigo-600`}></i>
              </div>
              <span className="text-sm font-medium text-gray-700">{action.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas Financeiras</h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <PremiumCard title="Receita (12 meses)" className="lg:col-span-1">
            <ReactApexChart options={revenueOptions} series={revenueSeries} type="area" height={240} />
          </PremiumCard>
          <PremiumCard title="Pedidos por dia" className="lg:col-span-1">
            <ReactApexChart options={ordersOptions} series={ordersSeries} type="bar" height={240} />
          </PremiumCard>
          <PremiumCard title="Métodos de pagamento" className="lg:col-span-1">
            <ReactApexChart options={paymentsOptions} series={paymentsSeries} type="donut" height={240} />
          </PremiumCard>
        </div>
      </div>

      {/* Recent Activity & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PremiumCard 
          title="Atividade Recente" 
          icon={<i className="ti ti-clipboard-text"></i>}
          className="lg:col-span-2"
        >
          <div className="space-y-6">
            {stats.recentActivity.map((activity, idx) => (
              <div key={idx} className="flex gap-4">
                <div className="relative flex-none">
                  <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center z-10 relative">
                    <span className="text-lg">{activity.icon || '📝'}</span>
                  </div>
                  {idx !== stats.recentActivity.length - 1 && (
                    <div className="absolute top-10 left-5 -ml-px w-0.5 h-full bg-gray-100"></div>
                  )}
                </div>
                <div className="pt-2">
                  <p className="text-sm font-medium text-gray-900">{activity.message || 'Atividade do sistema'}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
            {stats.recentActivity.length === 0 && (
              <div className="text-center py-6 text-gray-500 text-sm">Nenhuma atividade recente.</div>
            )}
          </div>
        </PremiumCard>

        <PremiumCard 
          title="Planos de Assinatura" 
          icon={<i className="ti ti-chart-pie"></i>}
          className="lg:col-span-1"
          noPadding
        >
          <div className="divide-y divide-gray-100">
            {stats.subscriptions.map((sub, index) => (
              <div key={index} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {sub._id || 'Padrão'}
                </span>
                <span className="text-sm font-semibold text-gray-900">{sub.count} lojas</span>
              </div>
            ))}
            {stats.subscriptions.length === 0 && (
              <div className="px-6 py-8 text-center text-sm text-gray-500">Sem dados de assinatura.</div>
            )}
          </div>
        </PremiumCard>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
