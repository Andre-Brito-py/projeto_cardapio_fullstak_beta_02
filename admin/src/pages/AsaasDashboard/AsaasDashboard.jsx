import React, { useState, useEffect } from 'react';
import './AsaasDashboard.css';
import { toast } from 'react-toastify';
import axios from 'axios';

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

  // Buscar logs de pagamentos
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
      console.error('Erro ao buscar logs de pagamentos:', error);
      toast.error('Erro ao carregar logs de pagamentos');
    }
  };

  // Reprocessar pagamento
  const reprocessPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${url}/api/asaas/admin/payments/${paymentId}/reprocess`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Pagamento reprocessado com sucesso');
        fetchPaymentLogs();
      }
    } catch (error) {
      console.error('Erro ao reprocessar pagamento:', error);
      toast.error('Erro ao reprocessar pagamento');
    }
  };

  // Sincronizar dados com Asaas
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
    if (activeTab === 'logs') {
      fetchPaymentLogs();
    }
    setLoading(false);
  }, [filters, logFilters, activeTab]);

  // Formatar data
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Formatar valor monetário
  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Obter cor do status
  const getStatusColor = (status) => {
    const colors = {
      active: '#28a745',
      expired: '#dc3545',
      cancelled: '#6c757d',
      trial: '#ffc107',
      RECEIVED: '#28a745',
      CONFIRMED: '#28a745',
      PENDING: '#ffc107',
      OVERDUE: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="asaas-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Asaas</h1>
        <p>Monitoramento de assinaturas e pagamentos</p>
      </div>

      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button 
          className={activeTab === 'stores' ? 'active' : ''}
          onClick={() => setActiveTab('stores')}
        >
          Lojas
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs de Pagamentos
        </button>
      </div>

      {activeTab === 'overview' && dashboardData && (
        <div className="overview-tab">
          <div className="stats-grid">
            <div className="stat-card">
              <h3>Total de Lojas</h3>
              <div className="stat-value">{dashboardData.estatisticas.totalLojas}</div>
            </div>
            <div className="stat-card active">
              <h3>Lojas Ativas</h3>
              <div className="stat-value">{dashboardData.estatisticas.lojasAtivas}</div>
            </div>
            <div className="stat-card expired">
              <h3>Lojas Expiradas</h3>
              <div className="stat-value">{dashboardData.estatisticas.lojasExpiradas}</div>
            </div>
            <div className="stat-card cancelled">
              <h3>Lojas Canceladas</h3>
              <div className="stat-value">{dashboardData.estatisticas.lojasCanceladas}</div>
            </div>
          </div>

          <div className="upcoming-renewals">
            <h2>Próximos Vencimentos (7 dias)</h2>
            <div className="renewals-list">
              {dashboardData.proximosVencimentos.map((loja) => (
                <div key={loja._id} className="renewal-item">
                  <div className="renewal-info">
                    <h4>{loja.name}</h4>
                    <p>Plano: {loja.subscription.plan} ({loja.subscription.ciclo})</p>
                    <p>Vence em: {formatDate(loja.subscription.validadePlano)}</p>
                  </div>
                  <div className="renewal-actions">
                    <button 
                      onClick={() => syncWithAsaas(loja._id)}
                      className="sync-btn"
                    >
                      Sincronizar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'stores' && dashboardData && (
        <div className="stores-tab">
          <div className="filters">
            <select 
              value={filters.status} 
              onChange={(e) => setFilters({...filters, status: e.target.value, page: 1})}
            >
              <option value="">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="expired">Expirado</option>
              <option value="cancelled">Cancelado</option>
              <option value="trial">Trial</option>
            </select>
            <select 
              value={filters.plano} 
              onChange={(e) => setFilters({...filters, plano: e.target.value, page: 1})}
            >
              <option value="">Todos os Planos</option>
              <option value="Básico">Básico</option>
              <option value="Premium">Premium</option>
              <option value="Enterprise">Enterprise</option>
            </select>
          </div>

          <div className="stores-table">
            <table>
              <thead>
                <tr>
                  <th>Loja</th>
                  <th>Owner</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Validade</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {dashboardData.lojas.map((loja) => (
                  <tr key={loja._id}>
                    <td>
                      <div className="store-info">
                        <strong>{loja.name}</strong>
                        <small>{loja.slug}</small>
                      </div>
                    </td>
                    <td>
                      <div className="owner-info">
                        <strong>{loja.owner.name}</strong>
                        <small>{loja.owner.email}</small>
                      </div>
                    </td>
                    <td>
                      <span className="plan-badge">
                        {loja.subscription.plan} ({loja.subscription.ciclo})
                      </span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(loja.subscription.status) }}
                      >
                        {loja.subscription.status}
                      </span>
                    </td>
                    <td>{formatDate(loja.subscription.validadePlano)}</td>
                    <td>
                      <button 
                        onClick={() => syncWithAsaas(loja._id)}
                        className="action-btn sync"
                      >
                        Sync
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="logs-tab">
          <div className="filters">
            <select 
              value={logFilters.status} 
              onChange={(e) => setLogFilters({...logFilters, status: e.target.value, page: 1})}
            >
              <option value="">Todos os Status</option>
              <option value="RECEIVED">Recebido</option>
              <option value="CONFIRMED">Confirmado</option>
              <option value="PENDING">Pendente</option>
              <option value="OVERDUE">Vencido</option>
            </select>
            <select 
              value={logFilters.evento} 
              onChange={(e) => setLogFilters({...logFilters, evento: e.target.value, page: 1})}
            >
              <option value="">Todos os Eventos</option>
              <option value="PAYMENT_RECEIVED">Pagamento Recebido</option>
              <option value="PAYMENT_CONFIRMED">Pagamento Confirmado</option>
              <option value="PAYMENT_OVERDUE">Pagamento Vencido</option>
            </select>
          </div>

          <div className="logs-table">
            <table>
              <thead>
                <tr>
                  <th>Payment ID</th>
                  <th>Loja</th>
                  <th>Evento</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Processado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {paymentLogs.map((log) => (
                  <tr key={log._id}>
                    <td>
                      <code>{log.paymentId}</code>
                    </td>
                    <td>
                      {log.lojaId ? log.lojaId.name : 'N/A'}
                    </td>
                    <td>
                      <span className="event-badge">{log.evento}</span>
                    </td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(log.status) }}
                      >
                        {log.status}
                      </span>
                    </td>
                    <td>{formatCurrency(log.value)}</td>
                    <td>{formatDate(log.createdAt)}</td>
                    <td>
                      <span className={`processed-badge ${log.processado ? 'yes' : 'no'}`}>
                        {log.processado ? 'Sim' : 'Não'}
                      </span>
                    </td>
                    <td>
                      {!log.processado && (
                        <button 
                          onClick={() => reprocessPayment(log.paymentId)}
                          className="action-btn reprocess"
                        >
                          Reprocessar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsaasDashboard;