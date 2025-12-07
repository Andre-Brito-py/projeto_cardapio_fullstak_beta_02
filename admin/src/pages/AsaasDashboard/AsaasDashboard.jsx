import React, { useState, useEffect } from 'react';
import './AsaasDashboard.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import PremiumCard from '../../components/Card/PremiumCard';

const AsaasDashboard = ({ url }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    status: '',
    plano: '',
    page: 1,
    limit: 20
  });
  const [logFilters, setLogFilters] = useState({
    status: '',
    evento: '',
    page: 1,
    limit: 50
  });

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/asaas/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });

      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
      toast.error('Erro ao carregar dados do dashboard');
    }
  };

  // Buscar logs de pagamentos (Simplificado para o exemplo)
  const fetchPaymentLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/asaas/admin/payment-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: logFilters
      });
      if (response.data.success) {
        setPaymentLogs(response.data.data.logs);
      }
    } catch (error) {
      console.error('Logs error', error);
      // Fallback para evitar tela branca
      setPaymentLogs([]);
    }
  };

  const reprocessPayment = async (paymentId) => { /* ... existing logic ... */ };
  const syncWithAsaas = async (lojaId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${url}/api/asaas/subscriptions/${lojaId}/sync`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success('Dados sincronizados com sucesso');
        fetchDashboardData();
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados:', error);
      toast.error('Erro ao sincronizar dados');
    }
  };

  useEffect(() => {
    fetchDashboardData();
    if (activeTab === 'logs') fetchPaymentLogs();
    setLoading(false);
  }, [filters, logFilters, activeTab]);

  const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleString('pt-BR') : 'N/A';
  const formatCurrency = (value) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);

  const getStatusBadgeClass = (status) => {
    const map = {
      active: 'bg-green-lt',
      RECEIVED: 'bg-green-lt',
      CONFIRMED: 'bg-green-lt',
      expired: 'bg-red-lt',
      OVERDUE: 'bg-red-lt',
      cancelled: 'bg-red-lt',
      pending: 'bg-orange-lt',
      PENDING: 'bg-orange-lt',
      trial: 'bg-blue-lt'
    };
    return map[status] || 'bg-secondary';
  };

  if (loading) return <div className="p-3">Carregando...</div>;

  return (
    <div className="asaas-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Financeiro</h1>
        <p>Monitoramento de Assinaturas e Receita</p>
      </div>

      <div className="dashboard-tabs">
        <button className={activeTab === 'overview' ? 'active' : ''} onClick={() => setActiveTab('overview')}>Visão Geral</button>
        <button className={activeTab === 'stores' ? 'active' : ''} onClick={() => setActiveTab('stores')}>Lojas</button>
        <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>Logs Financeiros</button>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="overview-tab">
          <div className="stats-grid">
            <PremiumCard title="Total de Lojas" statusTop>
              <div className="stat-value">{dashboardData.estatisticas.totalLojas}</div>
            </PremiumCard>
            <PremiumCard title="Lojas Ativas" statusTop statusColor="var(--tblr-green)">
              <div className="stat-value text-success">{dashboardData.estatisticas.lojasAtivas}</div>
            </PremiumCard>
            <PremiumCard title="Canceladas" statusTop statusColor="var(--tblr-gray)">
              <div className="stat-value text-muted">{dashboardData.estatisticas.lojasCanceladas}</div>
            </PremiumCard>
            <PremiumCard title="Expiradas" statusTop statusColor="var(--tblr-red)">
              <div className="stat-value text-danger">{dashboardData.estatisticas.lojasExpiradas}</div>
            </PremiumCard>
          </div>

          <div className="upcoming-renewals">
            <PremiumCard title={`Próximos Vencimentos (${dashboardData.proximosVencimentos.length})`}>
              <div className="table-responsive">
                <table className="table table-vcenter">
                  <thead>
                    <tr>
                      <th>Loja</th>
                      <th>Plano</th>
                      <th>Vencimento</th>
                      <th>Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.proximosVencimentos.map((loja) => (
                      <tr key={loja._id}>
                        <td>{loja.name}</td>
                        <td><span className="badge bg-blue-lt">{loja.subscription.plan}</span></td>
                        <td>{formatDate(loja.subscription.validadePlano)}</td>
                        <td>
                          <button onClick={() => syncWithAsaas(loja._id)} className="action-btn sync">
                            Sync
                          </button>
                        </td>
                      </tr>
                    ))}
                    {dashboardData.proximosVencimentos.length === 0 && (
                      <tr><td colSpan="4" className="text-center text-muted">Sem vencimentos próximos.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </PremiumCard>
          </div>
        </div>
      )}

      {activeTab === 'stores' && dashboardData && (
        <div className="stores-tab">
          <PremiumCard title="Gestão de Lojas">
            <div className="filters">
              {/* Simplified filters for UI clarity */}
              <select className="form-select" onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
                <option value="">Status: Todos</option>
                <option value="active">Ativo</option>
                <option value="expired">Expirado</option>
              </select>
            </div>
            <div className="table-responsive">
              <table className="table table-vcenter">
                <thead>
                  <tr>
                    <th>Loja</th>
                    <th>Responsável</th>
                    <th>Plano</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.lojas.map((loja) => (
                    <tr key={loja._id}>
                      <td>
                        <div className="font-weight-medium">{loja.name}</div>
                        <div className="text-muted text-sm">{loja.slug}</div>
                      </td>
                      <td>
                        <div>{loja.owner.name}</div>
                        <div className="text-muted text-sm">{loja.owner.email}</div>
                      </td>
                      <td>{loja.subscription.plan}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(loja.subscription.status)}`}>
                          {loja.subscription.status}
                        </span>
                      </td>
                      <td>
                        <button onClick={() => syncWithAsaas(loja._id)} className="action-btn sync">Sync</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="logs-tab">
          <PremiumCard title="Logs de Transações">
            <div className="table-responsive">
              <table className="table table-vcenter table-nowrap">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Evento</th>
                    <th>Status</th>
                    <th>Valor</th>
                    <th>Data</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentLogs.map(log => (
                    <tr key={log._id}>
                      <td><code>{log.paymentId}</code></td>
                      <td>{log.evento}</td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(log.status)}`}>
                          {log.status}
                        </span>
                      </td>
                      <td>{formatCurrency(log.value)}</td>
                      <td>{formatDate(log.createdAt)}</td>
                    </tr>
                  ))}
                  {paymentLogs.length === 0 && <tr><td colSpan="5" className="text-center p-3">Nenhum log encontrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </PremiumCard>
        </div>
      )}
    </div>
  );
};

export default AsaasDashboard;