import React, { useState, useEffect } from 'react';
import './FinancialManagement.css';

const FinancialManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Estados para dados financeiros
  const [financialOverview, setFinancialOverview] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    monthlyGrowth: 0,
    yearlyGrowth: 0
  });

  const [revenueData, setRevenueData] = useState({
    monthly: [],
    daily: [],
    byStore: [],
    byCategory: []
  });

  const [expenseData, setExpenseData] = useState({
    categories: [],
    monthly: [],
    byStore: []
  });

  const [transactionData, setTransactionData] = useState({
    recent: [],
    pending: [],
    failed: []
  });

  const [payoutData, setPayoutData] = useState({
    pending: [],
    completed: [],
    totalPending: 0,
    totalCompleted: 0
  });

  const [taxData, setTaxData] = useState({
    currentPeriod: {
      totalTax: 0,
      taxableIncome: 0,
      taxRate: 0
    },
    quarterly: [],
    yearly: []
  });

  const [reportFilters, setReportFilters] = useState({
    reportType: 'revenue',
    period: 'monthly',
    storeId: 'all',
    category: 'all'
  });

  // Funções para buscar dados
  const fetchFinancialOverview = async () => {
    try {
      const response = await fetch('/api/admin/financial/overview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      const data = await response.json();
      if (data.success) {
        setFinancialOverview(data.overview);
      }
    } catch (error) {
      console.error('Erro ao buscar visão geral financeira:', error);
    }
  };

  const fetchRevenueData = async () => {
    try {
      const response = await fetch('/api/admin/financial/revenue', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      const data = await response.json();
      if (data.success) {
        setRevenueData(data.revenue);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de receita:', error);
    }
  };

  const fetchExpenseData = async () => {
    try {
      const response = await fetch('/api/admin/financial/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      const data = await response.json();
      if (data.success) {
        setExpenseData(data.expenses);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de despesas:', error);
    }
  };

  const fetchTransactionData = async () => {
    try {
      const response = await fetch('/api/admin/financial/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      const data = await response.json();
      if (data.success) {
        setTransactionData(data.transactions);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de transações:', error);
    }
  };

  const fetchPayoutData = async () => {
    try {
      const response = await fetch('/api/admin/financial/payouts', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setPayoutData(data.payouts);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de pagamentos:', error);
    }
  };

  const fetchTaxData = async () => {
    try {
      const response = await fetch('/api/admin/financial/taxes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dateRange)
      });
      const data = await response.json();
      if (data.success) {
        setTaxData(data.taxes);
      }
    } catch (error) {
      console.error('Erro ao buscar dados de impostos:', error);
    }
  };

  // Funções de ação
  const processPayouts = async () => {
    try {
      const response = await fetch('/api/admin/financial/process-payouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        alert('Pagamentos processados com sucesso!');
        fetchPayoutData();
      } else {
        alert('Erro ao processar pagamentos: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao processar pagamentos:', error);
      alert('Erro ao processar pagamentos');
    }
  };

  const generateReport = async () => {
    try {
      const response = await fetch('/api/admin/financial/generate-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ ...reportFilters, ...dateRange })
      });
      const data = await response.json();
      if (data.success) {
        // Criar link para download do relatório
        const link = document.createElement('a');
        link.href = data.reportUrl;
        link.download = `relatorio-${reportFilters.reportType}-${Date.now()}.pdf`;
        link.click();
      } else {
        alert('Erro ao gerar relatório: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      alert('Erro ao gerar relatório');
    }
  };

  const exportData = async (format) => {
    try {
      const response = await fetch('/api/admin/financial/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
        },
        body: JSON.stringify({ format, ...dateRange, tab: activeTab })
      });
      const data = await response.json();
      if (data.success) {
        const link = document.createElement('a');
        link.href = data.exportUrl;
        link.download = `dados-financeiros-${activeTab}-${Date.now()}.${format}`;
        link.click();
      } else {
        alert('Erro ao exportar dados: ' + data.message);
      }
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Erro ao exportar dados');
    }
  };

  // Funções utilitárias
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const handleDateRangeChange = (field, value) => {
    setDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleReportFilterChange = (field, value) => {
    setReportFilters(prev => ({ ...prev, [field]: value }));
  };

  // useEffect para carregar dados
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchFinancialOverview(),
        fetchRevenueData(),
        fetchExpenseData(),
        fetchTransactionData(),
        fetchPayoutData(),
        fetchTaxData()
      ]);
      setLoading(false);
    };

    loadData();
  }, [dateRange]);

  if (loading) {
    return (
      <div className="financial-management">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando dados financeiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-management">
      {/* Cabeçalho */}
      <div className="financial-header">
        <div className="header-content">
          <div className="header-info">
            <h1>💰 Gestão Financeira</h1>
            <p>Controle completo das finanças da plataforma</p>
          </div>
          <div className="header-actions">
            <div className="date-range">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
              />
              <span>até</span>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
              />
            </div>
            <div className="export-actions">
              <button onClick={() => exportData('csv')} className="export-btn">
                📊 CSV
              </button>
              <button onClick={() => exportData('xlsx')} className="export-btn">
                📈 Excel
              </button>
              <button onClick={() => exportData('pdf')} className="export-btn">
                📄 PDF
              </button>
            </div>
          </div>
        </div>

        {/* Visão Geral Financeira */}
        <div className="financial-overview">
          <div className="overview-card revenue">
            <div className="card-icon">💵</div>
            <div className="card-content">
              <h3>{formatCurrency(financialOverview.totalRevenue)}</h3>
              <p>Receita Total</p>
              <span className={`growth ${financialOverview.monthlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(financialOverview.monthlyGrowth)} este mês
              </span>
            </div>
          </div>

          <div className="overview-card expenses">
            <div className="card-icon">💸</div>
            <div className="card-content">
              <h3>{formatCurrency(financialOverview.totalExpenses)}</h3>
              <p>Despesas Totais</p>
              <span className="info">{transactionData.recent.length} transações</span>
            </div>
          </div>

          <div className="overview-card profit">
            <div className="card-icon">📈</div>
            <div className="card-content">
              <h3>{formatCurrency(financialOverview.netProfit)}</h3>
              <p>Lucro Líquido</p>
              <span className={`growth ${financialOverview.profitMargin >= 0 ? 'positive' : 'negative'}`}>
                {formatPercentage(financialOverview.profitMargin)} margem
              </span>
            </div>
          </div>

          <div className="overview-card transactions">
            <div className="card-icon">🔄</div>
            <div className="card-content">
              <h3>{financialOverview.totalTransactions}</h3>
              <p>Transações</p>
              <span className="info">{formatCurrency(financialOverview.averageOrderValue)} ticket médio</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sistema de Abas */}
      <div className="financial-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Visão Geral
        </button>
        <button
          className={`tab-button ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          💰 Receitas
        </button>
        <button
          className={`tab-button ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          💸 Despesas
        </button>
        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          🔄 Transações
        </button>
        <button
          className={`tab-button ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          💳 Pagamentos
        </button>
        <button
          className={`tab-button ${activeTab === 'taxes' ? 'active' : ''}`}
          onClick={() => setActiveTab('taxes')}
        >
          📋 Impostos
        </button>
        <button
          className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => setActiveTab('reports')}
        >
          📈 Relatórios
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="financial-content">
        {/* Aba Visão Geral */}
        {activeTab === 'overview' && (
          <div className="tab-content active">
            <div className="overview-charts">
              <div className="chart-container">
                <h3>📈 Receita vs Despesas (Últimos 12 Meses)</h3>
                <div className="chart-placeholder">
                  <p>Gráfico de linha mostrando receita e despesas mensais</p>
                </div>
              </div>
              <div className="chart-container">
                <h3>🥧 Receita por Categoria</h3>
                <div className="chart-placeholder">
                  <p>Gráfico de pizza mostrando distribuição de receita</p>
                </div>
              </div>
            </div>
            <div className="overview-metrics">
              <div className="metric-card">
                <h4>📊 Crescimento Anual</h4>
                <p className={`metric-value ${financialOverview.yearlyGrowth >= 0 ? 'positive' : 'negative'}`}>
                  {formatPercentage(financialOverview.yearlyGrowth)}
                </p>
              </div>
              <div className="metric-card">
                <h4>💳 Taxa de Conversão</h4>
                <p className="metric-value">85.2%</p>
              </div>
              <div className="metric-card">
                <h4>⏱️ Tempo Médio de Pagamento</h4>
                <p className="metric-value">2.3 dias</p>
              </div>
            </div>
          </div>
        )}

        {/* Aba Receitas */}
        {activeTab === 'revenue' && (
          <div className="tab-content active">
            <div className="revenue-section">
              <div className="section-header">
                <h3>💰 Análise de Receitas</h3>
              </div>
              <div className="revenue-charts">
                <div className="chart-container">
                  <h4>📈 Receita Diária</h4>
                  <div className="chart-placeholder">
                    <p>Gráfico de barras mostrando receita diária</p>
                  </div>
                </div>
                <div className="chart-container">
                  <h4>🏪 Receita por Loja</h4>
                  <div className="chart-placeholder">
                    <p>Ranking das lojas por receita</p>
                  </div>
                </div>
              </div>
              <div className="revenue-table">
                <h4>📋 Detalhamento por Categoria</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Receita</th>
                      <th>% do Total</th>
                      <th>Crescimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueData.byCategory.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{formatCurrency(category.revenue)}</td>
                        <td>{category.percentage}%</td>
                        <td className={category.growth >= 0 ? 'positive' : 'negative'}>
                          {formatPercentage(category.growth)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aba Despesas */}
        {activeTab === 'expenses' && (
          <div className="tab-content active">
            <div className="expenses-section">
              <div className="section-header">
                <h3>💸 Controle de Despesas</h3>
              </div>
              <div className="expenses-charts">
                <div className="chart-container">
                  <h4>📊 Despesas por Categoria</h4>
                  <div className="chart-placeholder">
                    <p>Gráfico de rosca mostrando distribuição de despesas</p>
                  </div>
                </div>
                <div className="chart-container">
                  <h4>📈 Evolução Mensal</h4>
                  <div className="chart-placeholder">
                    <p>Gráfico de linha mostrando evolução das despesas</p>
                  </div>
                </div>
              </div>
              <div className="expenses-table">
                <h4>📋 Despesas por Categoria</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Categoria</th>
                      <th>Valor</th>
                      <th>% do Total</th>
                      <th>Variação</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenseData.categories.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{formatCurrency(category.amount)}</td>
                        <td>{category.percentage}%</td>
                        <td className={category.variation >= 0 ? 'negative' : 'positive'}>
                          {formatPercentage(category.variation)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aba Transações */}
        {activeTab === 'transactions' && (
          <div className="tab-content active">
            <div className="transactions-section">
              <div className="section-header">
                <h3>🔄 Gestão de Transações</h3>
                <div className="transaction-stats">
                  <span className="stat pending">⏳ {transactionData.pending.length} Pendentes</span>
                  <span className="stat failed">❌ {transactionData.failed.length} Falharam</span>
                </div>
              </div>
              <div className="transactions-table">
                <h4>📋 Transações Recentes</h4>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Data</th>
                      <th>Loja</th>
                      <th>Valor</th>
                      <th>Método</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactionData.recent.map((transaction, index) => (
                      <tr key={index}>
                        <td>#{transaction.id}</td>
                        <td>{new Date(transaction.date).toLocaleDateString('pt-BR')}</td>
                        <td>{transaction.storeName}</td>
                        <td>{formatCurrency(transaction.amount)}</td>
                        <td>{transaction.paymentMethod}</td>
                        <td>
                          <span className={`status ${transaction.status.toLowerCase()}`}>
                            {transaction.status}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn view">👁️</button>
                          <button className="action-btn refund">↩️</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aba Pagamentos */}
        {activeTab === 'payouts' && (
          <div className="tab-content active">
            <div className="payouts-section">
              <div className="section-header">
                <h3>💳 Gestão de Pagamentos</h3>
                <div className="payout-summary">
                  <div className="summary-card">
                    <h4>⏳ Pendentes</h4>
                    <p>{formatCurrency(payoutData.totalPending)}</p>
                  </div>
                  <div className="summary-card">
                    <h4>✅ Processados</h4>
                    <p>{formatCurrency(payoutData.totalCompleted)}</p>
                  </div>
                </div>
                <button onClick={processPayouts} className="process-btn">
                  🚀 Processar Pagamentos Pendentes
                </button>
              </div>
              <div className="payouts-table">
                <h4>📋 Pagamentos Pendentes</h4>
                <table>
                  <thead>
                    <tr>
                      <th>Loja</th>
                      <th>Valor</th>
                      <th>Data Solicitação</th>
                      <th>Método</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payoutData.pending.map((payout, index) => (
                      <tr key={index}>
                        <td>{payout.storeName}</td>
                        <td>{formatCurrency(payout.amount)}</td>
                        <td>{new Date(payout.requestDate).toLocaleDateString('pt-BR')}</td>
                        <td>{payout.method}</td>
                        <td>
                          <span className={`status ${payout.status.toLowerCase()}`}>
                            {payout.status}
                          </span>
                        </td>
                        <td>
                          <button className="action-btn approve">✅</button>
                          <button className="action-btn reject">❌</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Aba Impostos */}
        {activeTab === 'taxes' && (
          <div className="tab-content active">
            <div className="taxes-section">
              <div className="section-header">
                <h3>📋 Gestão de Impostos</h3>
                <div className="tax-summary">
                  <div className="summary-card">
                    <h4>💰 Receita Tributável</h4>
                    <p>{formatCurrency(taxData.currentPeriod.taxableIncome)}</p>
                  </div>
                  <div className="summary-card">
                    <h4>📊 Taxa de Imposto</h4>
                    <p>{taxData.currentPeriod.taxRate}%</p>
                  </div>
                  <div className="summary-card">
                    <h4>💸 Total de Impostos</h4>
                    <p>{formatCurrency(taxData.currentPeriod.totalTax)}</p>
                  </div>
                </div>
              </div>
              <div className="tax-charts">
                <div className="chart-container">
                  <h4>📈 Impostos Trimestrais</h4>
                  <div className="chart-placeholder">
                    <p>Gráfico de barras mostrando impostos por trimestre</p>
                  </div>
                </div>
                <div className="chart-container">
                  <h4>📊 Distribuição de Impostos</h4>
                  <div className="chart-placeholder">
                    <p>Gráfico de pizza mostrando tipos de impostos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aba Relatórios */}
        {activeTab === 'reports' && (
          <div className="tab-content active">
            <div className="reports-section">
              <div className="section-header">
                <h3>📈 Gerador de Relatórios</h3>
              </div>
              <div className="report-generator">
                <div className="report-filters">
                  <div className="filter-group">
                    <label>Tipo de Relatório</label>
                    <select
                      value={reportFilters.reportType}
                      onChange={(e) => handleReportFilterChange('reportType', e.target.value)}
                    >
                      <option value="revenue">Receitas</option>
                      <option value="expenses">Despesas</option>
                      <option value="profit">Lucro & Perda</option>
                      <option value="transactions">Transações</option>
                      <option value="taxes">Impostos</option>
                      <option value="complete">Relatório Completo</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Período</label>
                    <select
                      value={reportFilters.period}
                      onChange={(e) => handleReportFilterChange('period', e.target.value)}
                    >
                      <option value="daily">Diário</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="yearly">Anual</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Loja</label>
                    <select
                      value={reportFilters.storeId}
                      onChange={(e) => handleReportFilterChange('storeId', e.target.value)}
                    >
                      <option value="all">Todas as Lojas</option>
                      <option value="1">Loja A</option>
                      <option value="2">Loja B</option>
                      <option value="3">Loja C</option>
                    </select>
                  </div>
                  <div className="filter-group">
                    <label>Categoria</label>
                    <select
                      value={reportFilters.category}
                      onChange={(e) => handleReportFilterChange('category', e.target.value)}
                    >
                      <option value="all">Todas as Categorias</option>
                      <option value="food">Comida</option>
                      <option value="drinks">Bebidas</option>
                      <option value="delivery">Entrega</option>
                    </select>
                  </div>
                </div>
                <div className="report-actions">
                  <button onClick={generateReport} className="generate-btn">
                    📊 Gerar Relatório
                  </button>
                </div>
              </div>
              <div className="recent-reports">
                <h4>📋 Relatórios Recentes</h4>
                <div className="reports-list">
                  <div className="report-item">
                    <div className="report-info">
                      <h5>Relatório de Receitas - Janeiro 2024</h5>
                      <p>Gerado em 01/02/2024 às 14:30</p>
                    </div>
                    <button className="download-btn">⬇️ Download</button>
                  </div>
                  <div className="report-item">
                    <div className="report-info">
                      <h5>Relatório Completo - Q4 2023</h5>
                      <p>Gerado em 15/01/2024 às 09:15</p>
                    </div>
                    <button className="download-btn">⬇️ Download</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FinancialManagement;