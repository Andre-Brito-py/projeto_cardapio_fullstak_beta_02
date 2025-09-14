import React, { useState, useEffect } from 'react';
import './Cashback.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Cashback = ({ url, token }) => {
  const [config, setConfig] = useState({
    isActive: false,
    globalPercentage: 0,
    rules: {
      minPurchaseAmount: 0,
      validityDays: 30,
      maxUsagePerOrder: 0
    },
    categoryRules: [],
    productRules: []
  });
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [reports, setReports] = useState(null);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('30');

  // Fetch current cashback configuration
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await axios.get(`${url}/api/cashback/config`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });
      if (response.data.success) {
        setConfig(response.data.config);
      }
    } catch (error) {
      console.error('Erro ao buscar configuração de cashback:', error);
      toast.error('Erro ao carregar configurações de cashback');
    } finally {
      setLoadingConfig(false);
    }
  };

  // Update cashback configuration
  const updateConfig = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.put(`${url}/api/cashback/config`, config, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });
      if (response.data.success) {
        toast.success('Configurações de cashback atualizadas com sucesso!');
        setConfig(response.data.config);
      } else {
        toast.error(response.data.message || 'Erro ao atualizar configurações');
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      toast.error('Erro ao atualizar configurações de cashback');
    } finally {
      setLoading(false);
    }
  };

  // Fetch cashback reports
  const fetchReports = async () => {
    try {
      setLoadingReports(true);
      const response = await axios.get(`${url}/api/cashback/reports?period=${reportPeriod}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });
      if (response.data.success) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Erro ao buscar relatórios:', error);
      toast.error('Erro ao carregar relatórios de cashback');
    } finally {
      setLoadingReports(false);
    }
  };

  // Expire old cashback
  const expireOldCashback = async () => {
    try {
      const response = await axios.post(`${url}/api/cashback/expire`, {}, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'store-slug': 'loja-de-teste-gar-om'
        }
      });
      if (response.data.success) {
        toast.success(response.data.message);
        fetchReports(); // Refresh reports
      }
    } catch (error) {
      console.error('Erro ao expirar cashback:', error);
      toast.error('Erro ao expirar cashback antigo');
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  useEffect(() => {
    if (!loadingConfig) {
      fetchReports();
    }
  }, [reportPeriod, loadingConfig]);

  const handleConfigChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  if (loadingConfig) {
    return (
      <div className="cashback">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cashback">
      <h2>Sistema de Cashback</h2>

      {/* Configurações Gerais */}
      <div className="cashback-section">
        <h3>Configurações Gerais</h3>
        <p className="section-description">
          Configure o sistema de cashback da sua loja. Defina percentuais, regras e limites.
        </p>

        <form onSubmit={updateConfig} className="cashback-form">
          <div className="form-group">
            <label className="switch-container">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => handleConfigChange('isActive', e.target.checked)}
              />
              <span className="switch-slider"></span>
              <span className="switch-label">Sistema de Cashback Ativo</span>
            </label>
          </div>

          <div className="form-group">
            <label>Percentual Global de Cashback (%):</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={config.globalPercentage}
              onChange={(e) => handleConfigChange('globalPercentage', parseFloat(e.target.value) || 0)}
              disabled={!config.isActive}
            />
            <small>Percentual padrão aplicado a todos os produtos</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Valor Mínimo de Compra (R$):</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={config.rules.minPurchaseAmount}
                onChange={(e) => handleConfigChange('rules.minPurchaseAmount', parseFloat(e.target.value) || 0)}
                disabled={!config.isActive}
              />
              <small>Valor mínimo para gerar cashback</small>
            </div>

            <div className="form-group">
              <label>Validade do Cashback (dias):</label>
              <input
                type="number"
                min="1"
                value={config.rules.validityDays}
                onChange={(e) => handleConfigChange('rules.validityDays', parseInt(e.target.value) || 30)}
                disabled={!config.isActive}
              />
              <small>Dias até o cashback expirar</small>
            </div>
          </div>

          <div className="form-group">
            <label>Limite Máximo de Uso por Pedido (R$):</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={config.rules.maxUsagePerOrder}
              onChange={(e) => handleConfigChange('rules.maxUsagePerOrder', parseFloat(e.target.value) || 0)}
              disabled={!config.isActive}
            />
            <small>Valor máximo de cashback que pode ser usado em um pedido (0 = sem limite)</small>
          </div>

          <button type="submit" className="save-btn" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </div>

      {/* Relatórios */}
      <div className="cashback-section">
        <h3>Relatórios de Cashback</h3>
        <p className="section-description">
          Acompanhe o desempenho do sistema de cashback da sua loja.
        </p>

        <div className="reports-controls">
          <div className="form-group">
            <label>Período:</label>
            <select
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value)}
            >
              <option value="7">Últimos 7 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="90">Últimos 90 dias</option>
            </select>
          </div>

          <button
            type="button"
            className="expire-btn"
            onClick={expireOldCashback}
            title="Expirar cashback vencido"
          >
            Expirar Cashback Antigo
          </button>
        </div>

        {loadingReports ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando relatórios...</p>
          </div>
        ) : reports ? (
          <div className="reports-grid">
            <div className="report-card">
              <h4>Cashback Concedido</h4>
              <div className="report-value">R$ {reports.stats.totalEarned?.toFixed(2) || '0.00'}</div>
              <small>{reports.stats.earnedTransactions || 0} transações</small>
            </div>

            <div className="report-card">
              <h4>Cashback Utilizado</h4>
              <div className="report-value">R$ {reports.stats.totalUsed?.toFixed(2) || '0.00'}</div>
              <small>{reports.stats.usedTransactions || 0} transações</small>
            </div>

            <div className="report-card">
              <h4>Saldo em Aberto</h4>
              <div className="report-value">R$ {((reports.stats.totalEarned || 0) - (reports.stats.totalUsed || 0)).toFixed(2)}</div>
              <small>Saldo total dos clientes</small>
            </div>

            <div className="report-card">
              <h4>Cashback Expirado</h4>
              <div className="report-value">R$ {reports.stats.totalExpired?.toFixed(2) || '0.00'}</div>
              <small>{reports.stats.expiredTransactions || 0} transações</small>
            </div>
          </div>
        ) : null}

        {/* Top Clientes */}
        {reports && reports.topCustomers && reports.topCustomers.length > 0 && (
          <div className="top-customers">
            <h4>Top Clientes por Cashback</h4>
            <div className="customers-table">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Cashback Ganho</th>
                    <th>Transações</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.topCustomers.map((customer, index) => (
                    <tr key={index}>
                      <td>{customer.customerName}</td>
                      <td>{customer.customerPhone}</td>
                      <td>R$ {customer.totalEarned.toFixed(2)}</td>
                      <td>{customer.transactionCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cashback;