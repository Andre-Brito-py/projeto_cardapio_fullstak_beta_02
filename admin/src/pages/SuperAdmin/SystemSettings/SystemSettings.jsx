import React, { useState, useEffect } from 'react';
import './SystemSettings.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const SystemSettings = ({ url, token }) => {
  const [settings, setSettings] = useState({
    googleMapsApiKey: '',
    systemName: '',
    systemEmail: '',
    systemPhone: '',
    maintenanceMode: 'false',
    allowUserRegistration: 'true',
    maxStoresPerUser: 5,
    defaultCurrency: 'BRL',
    systemTimezone: 'America/Sao_Paulo',
    emailNotifications: true,
    smsNotifications: false,
    backupFrequency: 'daily',
    logLevel: 'info',
    // Payment Settings
    stripePublicKey: '',
    stripeSecretKey: '',
    paypalClientId: '',
    paypalClientSecret: '',
    mercadoPagoAccessToken: '',
    mercadoPagoPublicKey: '',
    pixKey: '',
    pixBeneficiaryName: '',
    enableStripe: true,
    enablePaypal: false,
    enableMercadoPago: true,
    enablePix: true,
    // Subscription Plans
    basicPlanPrice: 29.90,
    premiumPlanPrice: 59.90,
    enterprisePlanPrice: 149.90,
    trialPeriodDays: 14,
    annualDiscount: 0,
    // System Limits
    maxProductsBasic: 100,
    maxProductsPremium: 500,
    maxProductsEnterprise: -1, // unlimited
    maxOrdersBasic: 1000,
    maxOrdersPremium: 5000,
    maxOrdersEnterprise: -1, // unlimited
    // Security Settings
    sessionTimeout: 24, // hours
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    minPasswordLength: 8,
    requireUppercase: false,
    requireNumbers: false,
    requireSpecialChars: false,
    twoFactorAuth: 'disabled',
    // Performance Settings
    cacheEnabled: 'enabled',
    cacheTimeout: 60,
    imageCompression: 'medium',
    compressionQuality: 80,
    // Analytics
    googleAnalyticsId: '',
    enableAnalytics: true
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [testingConnection, setTestingConnection] = useState(false);
  const [systemStats, setSystemStats] = useState({
    totalStores: 0,
    activeStores: 0,
    totalUsers: 0,
    totalRevenue: 0,
    systemUptime: '',
    lastBackup: null,
    storageUsed: 0,
    storageLimit: 100 // GB
  });

  useEffect(() => {
    fetchSettings();
    fetchSystemStats();
  }, []);

  const fetchSystemStats = async () => {
    try {
      const response = await axios.get(`${url}/api/system/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const stats = response.data.stats || {};
        setSystemStats(prev => ({
          ...prev,
          totalStores: Number.isFinite(stats.totalStores) ? stats.totalStores : prev.totalStores,
          activeStores: Number.isFinite(stats.activeStores) ? stats.activeStores : prev.activeStores,
          totalUsers: Number.isFinite(stats.totalUsers) ? stats.totalUsers : prev.totalUsers,
          totalRevenue: Number.isFinite(stats.totalRevenue) ? stats.totalRevenue : prev.totalRevenue,
          systemUptime: stats.systemUptime ?? prev.systemUptime,
          lastBackup: stats.lastBackup ?? prev.lastBackup,
          storageUsed: Number.isFinite(stats.storageUsed) ? stats.storageUsed : prev.storageUsed,
          storageLimit: Number.isFinite(stats.storageLimit) ? stats.storageLimit : prev.storageLimit
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/system/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        const incoming = response.data.settings || {};
        const toBoolString = (v, fallback) => {
          if (v === true) return 'true';
          if (v === false) return 'false';
          return typeof v === 'string' ? (v === 'true' || v === 'false' ? v : fallback) : fallback;
        };
        const normalizeNumber = (v, fallback) => {
          const n = typeof v === 'string' ? parseFloat(v) : v;
          return Number.isFinite(n) ? n : fallback;
        };
        const normalizeSelect = (v, allowed, fallback) => {
          return allowed.includes(v) ? v : fallback;
        };
        setSettings(prev => ({
          ...prev,
          ...incoming,
          maintenanceMode: toBoolString(incoming.maintenanceMode, prev.maintenanceMode),
          allowUserRegistration: toBoolString(incoming.allowUserRegistration, prev.allowUserRegistration),
          twoFactorAuth: normalizeSelect(incoming.twoFactorAuth, ['disabled','optional','required'], prev.twoFactorAuth),
          cacheEnabled: normalizeSelect(incoming.cacheEnabled, ['enabled','disabled'], prev.cacheEnabled),
          imageCompression: normalizeSelect(incoming.imageCompression, ['high','medium','low','disabled'], prev.imageCompression),
          basicPlanPrice: normalizeNumber(incoming.basicPlanPrice, prev.basicPlanPrice),
          premiumPlanPrice: normalizeNumber(incoming.premiumPlanPrice, prev.premiumPlanPrice),
          enterprisePlanPrice: normalizeNumber(incoming.enterprisePlanPrice, prev.enterprisePlanPrice),
          trialPeriodDays: normalizeNumber(incoming.trialPeriodDays, prev.trialPeriodDays),
          annualDiscount: normalizeNumber(incoming.annualDiscount, prev.annualDiscount),
          sessionTimeout: normalizeNumber(incoming.sessionTimeout, prev.sessionTimeout),
          maxLoginAttempts: normalizeNumber(incoming.maxLoginAttempts, prev.maxLoginAttempts),
          minPasswordLength: normalizeNumber(incoming.minPasswordLength, prev.minPasswordLength),
          cacheTimeout: normalizeNumber(incoming.cacheTimeout, prev.cacheTimeout),
          compressionQuality: normalizeNumber(incoming.compressionQuality, prev.compressionQuality),
          pixKey: incoming.pixKey ?? prev.pixKey,
          pixBeneficiaryName: incoming.pixBeneficiaryName ?? prev.pixBeneficiaryName
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações do sistema');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await axios.put(`${url}/api/system/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Configurações atualizadas com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações do sistema');
    } finally {
      setSaving(false);
    }
  };

  const handleBackup = async () => {
    setSaving(true);
    try {
      const response = await axios.post(`${url}/api/system/backup`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Backup criado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao criar backup');
      }
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup do sistema');
    } finally {
      setSaving(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Tem certeza que deseja limpar todos os logs do sistema?')) return;
    
    setSaving(true);
    try {
      const response = await axios.delete(`${url}/api/system/logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Logs limpos com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao limpar logs');
      }
    } catch (error) {
      console.error('Erro ao limpar logs:', error);
      toast.error('Erro ao limpar logs do sistema');
    } finally {
      setSaving(false);
    }
  };

  const testPaymentConnection = async (provider) => {
    setTestingConnection(true);
    try {
      const response = await axios.post(`${url}/api/system/test-payment`, {
        provider,
        settings
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Conexão com ${provider} testada com sucesso!`);
      } else {
        toast.error(response.data.message || `Erro ao testar ${provider}`);
      }
    } catch (error) {
      console.error(`Erro ao testar ${provider}:`, error);
      toast.error(`Erro ao testar conexão com ${provider}`);
    } finally {
      setTestingConnection(false);
    }
  };

  const updatePlanPrices = async () => {
    setSaving(true);
    try {
      const response = await axios.put(`${url}/api/system/plans`, {
        basicPrice: settings.basicPlanPrice,
        premiumPrice: settings.premiumPlanPrice,
        enterprisePrice: settings.enterprisePlanPrice,
        trialDays: settings.trialPeriodDays
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Preços dos planos atualizados com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao atualizar preços');
      }
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      toast.error('Erro ao atualizar preços dos planos');
    } finally {
      setSaving(false);
    }
  };

  const clearCache = async () => {
    setSaving(true);
    try {
      const response = await axios.post(`${url}/api/system/clear-cache`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Cache limpo com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao limpar cache');
      }
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache do sistema');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className='loading'>Carregando configurações...</div>;
  }

  return (
    <div className='system-settings'>
      <div className='system-settings-header'>
        <div className='header-content'>
          <h2>Configurações do Sistema</h2>
          <p>Gerencie as configurações globais do sistema multi-tenant</p>
        </div>
        <div className='header-stats'>
          <div className='stat-card'>
            <div className='stat-icon'><i className='ti ti-building-store'></i></div>
            <div className='stat-info'>
              <h3>{systemStats.totalStores}</h3>
              <p>Total de Lojas</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'><i className='ti ti-users'></i></div>
            <div className='stat-info'>
              <h3>{systemStats.totalUsers}</h3>
              <p>Usuários Ativos</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'><i className='ti ti-currency-real'></i></div>
            <div className='stat-info'>
              <h3>R$ {systemStats.totalRevenue?.toLocaleString('pt-BR')}</h3>
              <p>Receita Total</p>
            </div>
          </div>
          <div className='stat-card'>
            <div className='stat-icon'><i className='ti ti-database'></i></div>
            <div className='stat-info'>
              <h3>{systemStats.storageUsed}GB</h3>
              <p>Armazenamento</p>
            </div>
          </div>
        </div>
      </div>

      <div className='settings-tabs'>
        <button 
          className={`tab-button ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          Geral
        </button>
        <button 
          className={`tab-button ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          Pagamentos
        </button>
        <button 
          className={`tab-button ${activeTab === 'plans' ? 'active' : ''}`}
          onClick={() => setActiveTab('plans')}
        >
          Planos
        </button>
        <button 
          className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          Segurança
        </button>
        <button 
          className={`tab-button ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button 
          className={`tab-button ${activeTab === 'system' ? 'active' : ''}`}
          onClick={() => setActiveTab('system')}
        >
          Sistema
        </button>
      </div>

      <div className='tab-content'>
        <>
          {activeTab === 'general' && (
          <form onSubmit={handleSubmit} className='settings-form'>
            <div className='settings-section'>
              <h3>Configurações de API</h3>
              <div className='form-group'>
                <label>Chave da API do Google Maps</label>
                <input
                  type='text'
                  name='googleMapsApiKey'
                  value={settings.googleMapsApiKey}
                  onChange={handleInputChange}
                  placeholder='Insira sua chave da API do Google Maps'
                />
                <small className='form-help'>Esta chave é usada para calcular distâncias de entrega e exibir mapas no sistema.</small>
              </div>
              
              <div className='form-group'>
                <label>Google Analytics ID</label>
                <input
                  type='text'
                  name='googleAnalyticsId'
                  value={settings.googleAnalyticsId}
                  onChange={handleInputChange}
                  placeholder='G-XXXXXXXXXX'
                />
                <small className='form-help'>ID do Google Analytics para rastreamento de dados.</small>
              </div>
            </div>

            <div className='settings-section'>
              <h3>Informações Gerais</h3>
              <div className='form-row'>
                <div className='form-group'>
                  <label>Nome do Sistema</label>
                  <input
                    type='text'
                    name='systemName'
                    value={settings.systemName}
                    onChange={handleInputChange}
                    placeholder='Nome do seu sistema'
                  />
                </div>
                <div className='form-group'>
                  <label>Email do Sistema</label>
                  <input
                    type='email'
                    name='systemEmail'
                    value={settings.systemEmail}
                    onChange={handleInputChange}
                    placeholder='admin@sistema.com'
                  />
                </div>
              </div>
              
              <div className='form-row'>
                <div className='form-group'>
                  <label>Telefone do Sistema</label>
                  <input
                    type='tel'
                    name='systemPhone'
                    value={settings.systemPhone}
                    onChange={handleInputChange}
                    placeholder='(11) 99999-9999'
                  />
                </div>
                <div className='form-group'>
                  <label>Moeda Padrão</label>
                  <select
                    name='defaultCurrency'
                    value={settings.defaultCurrency}
                    onChange={handleInputChange}
                  >
                    <option value='BRL'>Real Brasileiro (BRL)</option>
                    <option value='USD'>Dólar Americano (USD)</option>
                    <option value='EUR'>Euro (EUR)</option>
                  </select>
                </div>
              </div>
              
              <div className='form-group'>
                <label>Fuso Horário</label>
                <select
                  name='systemTimezone'
                  value={settings.systemTimezone}
                  onChange={handleInputChange}
                >
                  <option value='America/Sao_Paulo'>América/São Paulo</option>
                  <option value='America/New_York'>América/Nova York</option>
                  <option value='Europe/London'>Europa/Londres</option>
                  <option value='Asia/Tokyo'>Ásia/Tóquio</option>
                </select>
              </div>
            </div>
          </form>
        )}

        {activeTab === 'payments' && (
          <div className='settings-section'>
            <h3>Configurações de Pagamento</h3>
            
            <div className='payment-providers'>
                <div className='provider-card'>
                  <h4>Stripe</h4>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label>Chave Pública</label>
                      <input
                        type='text'
                        name='stripePublicKey'
                        value={settings.stripePublicKey}
                        onChange={handleInputChange}
                        placeholder='pk_test_...'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Chave Secreta</label>
                      <input
                        type='password'
                        name='stripeSecretKey'
                        value={settings.stripeSecretKey}
                        onChange={handleInputChange}
                        placeholder='sk_test_...'
                      />
                    </div>
                  </div>
                  <button 
                    className='test-connection-btn'
                    onClick={() => testPaymentConnection('stripe')}
                    disabled={testingConnection}
                  >
                    {testingConnection ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                <div className='provider-card'>
                  <h4>PayPal</h4>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label>Client ID</label>
                      <input
                        type='text'
                        name='paypalClientId'
                        value={settings.paypalClientId}
                        onChange={handleInputChange}
                        placeholder='Client ID do PayPal'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Client Secret</label>
                      <input
                        type='password'
                        name='paypalClientSecret'
                        value={settings.paypalClientSecret}
                        onChange={handleInputChange}
                        placeholder='Client Secret do PayPal'
                      />
                    </div>
                  </div>
                  <button 
                    className='test-connection-btn'
                    onClick={() => testPaymentConnection('paypal')}
                    disabled={testingConnection}
                  >
                    {testingConnection ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                <div className='provider-card'>
                  <h4>Mercado Pago</h4>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label>Access Token</label>
                      <input
                        type='password'
                        name='mercadoPagoAccessToken'
                        value={settings.mercadoPagoAccessToken}
                        onChange={handleInputChange}
                        placeholder='Access Token do Mercado Pago'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Public Key</label>
                      <input
                        type='text'
                        name='mercadoPagoPublicKey'
                        value={settings.mercadoPagoPublicKey}
                        onChange={handleInputChange}
                        placeholder='Public Key do Mercado Pago'
                      />
                    </div>
                  </div>
                  <button 
                    className='test-connection-btn'
                    onClick={() => testPaymentConnection('mercadopago')}
                    disabled={testingConnection}
                  >
                    {testingConnection ? 'Testando...' : 'Testar Conexão'}
                  </button>
                </div>

                <div className='provider-card'>
                  <h4>PIX</h4>
                  <div className='form-row'>
                    <div className='form-group'>
                      <label>Chave PIX</label>
                      <input
                        type='text'
                        name='pixKey'
                        value={settings.pixKey}
                        onChange={handleInputChange}
                        placeholder='Sua chave PIX'
                      />
                    </div>
                    <div className='form-group'>
                      <label>Nome do Beneficiário</label>
                      <input
                        type='text'
                        name='pixBeneficiaryName'
                        value={settings.pixBeneficiaryName}
                        onChange={handleInputChange}
                        placeholder='Nome para recebimento PIX'
                      />
                    </div>
                  </div>
                </div>
            </div>
          </div>
        )}
        {activeTab === 'plans' && (
          <div className='settings-section'>
            <h3>Planos de Assinatura</h3>
            
            <div className='plans-grid'>
              <div className='plan-card'>
                <h4>Plano Básico</h4>
                <div className='form-group'>
                  <label>Preço Mensal (R$)</label>
                  <input
                    type='number'
                    name='basicPlanPrice'
                    value={settings.basicPlanPrice}
                    onChange={handleInputChange}
                    placeholder='29.90'
                  />
                </div>
                <div className='plan-features'>
                  <p>✓ Até 100 produtos</p>
                  <p>✓ 1 loja</p>
                  <p>✓ Suporte básico</p>
                </div>
              </div>

              <div className='plan-card'>
                <h4>Plano Profissional</h4>
                <div className='form-group'>
                  <label>Preço Mensal (R$)</label>
                  <input
                    type='number'
                    name='premiumPlanPrice'
                    value={settings.premiumPlanPrice}
                    onChange={handleInputChange}
                    placeholder='59.90'
                  />
                </div>
                <div className='plan-features'>
                  <p>✓ Até 1000 produtos</p>
                  <p>✓ 3 lojas</p>
                  <p>✓ Suporte prioritário</p>
                  <p>✓ Relatórios avançados</p>
                </div>
              </div>

              <div className='plan-card'>
                <h4>Plano Enterprise</h4>
                <div className='form-group'>
                  <label>Preço Mensal (R$)</label>
                  <input
                    type='number'
                    name='enterprisePlanPrice'
                    value={settings.enterprisePlanPrice}
                    onChange={handleInputChange}
                    placeholder='199.90'
                  />
                </div>
                <div className='plan-features'>
                  <p>✓ Produtos ilimitados</p>
                  <p>✓ Lojas ilimitadas</p>
                  <p>✓ Suporte 24/7</p>
                  <p>✓ API personalizada</p>
                </div>
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label>Período de Teste Gratuito (dias)</label>
                <input
                  type='number'
                  name='trialPeriodDays'
                  value={settings.trialPeriodDays}
                  onChange={handleInputChange}
                  placeholder='14'
                />
              </div>
              <div className='form-group'>
                <label>Desconto Anual (%)</label>
                <input
                  type='number'
                  name='annualDiscount'
                  value={settings.annualDiscount}
                  onChange={handleInputChange}
                  placeholder='20'
                />
              </div>
            </div>

            <button className='update-prices-btn' onClick={updatePlanPrices}>
              Atualizar Preços dos Planos
            </button>
          </div>
        )}

        {activeTab === 'security' && (
          <div className='settings-section'>
            <h3>Configurações de Segurança</h3>
            
            <div className='form-row'>
              <div className='form-group'>
                <label>Tempo Limite de Sessão (minutos)</label>
                <input
                  type='number'
                  name='sessionTimeout'
                  value={settings.sessionTimeout}
                  onChange={handleInputChange}
                  placeholder='30'
                />
              </div>
              <div className='form-group'>
                <label>Máximo de Tentativas de Login</label>
                <input
                  type='number'
                  name='maxLoginAttempts'
                  value={settings.maxLoginAttempts}
                  onChange={handleInputChange}
                  placeholder='5'
                />
              </div>
            </div>

            <div className='form-group'>
              <label>Requisitos de Senha</label>
              <div className='checkbox-group'>
                <label className='checkbox-label'>
                  <input
                    type='checkbox'
                    name='requireUppercase'
                    checked={settings.requireUppercase}
                    onChange={handleInputChange}
                  />
                  Exigir letras maiúsculas
                </label>
                <label className='checkbox-label'>
                  <input
                    type='checkbox'
                    name='requireNumbers'
                    checked={settings.requireNumbers}
                    onChange={handleInputChange}
                  />
                  Exigir números
                </label>
                <label className='checkbox-label'>
                  <input
                    type='checkbox'
                    name='requireSpecialChars'
                    checked={settings.requireSpecialChars}
                    onChange={handleInputChange}
                  />
                  Exigir caracteres especiais
                </label>
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label>Comprimento Mínimo da Senha</label>
                <input
                  type='number'
                  name='minPasswordLength'
                  value={settings.minPasswordLength}
                  onChange={handleInputChange}
                  placeholder='8'
                />
              </div>
              <div className='form-group'>
                  <label>Autenticação de Dois Fatores</label>
                  <select
                  name='twoFactorAuth'
                  value={settings.twoFactorAuth}
                  onChange={handleInputChange}
                >
                  <option value='disabled'>Desabilitado</option>
                  <option value='optional'>Opcional</option>
                  <option value='required'>Obrigatório</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div className='settings-section'>
            <h3>Configurações de Performance</h3>
            
            <div className='form-row'>
              <div className='form-group'>
                <label>Cache do Sistema</label>
                <select
                  name='cacheEnabled'
                  value={settings.cacheEnabled}
                  onChange={handleInputChange}
                >
                  <option value='enabled'>Habilitado</option>
                  <option value='disabled'>Desabilitado</option>
                </select>
              </div>
              <div className='form-group'>
                <label>Tempo de Cache (minutos)</label>
                <input
                  type='number'
                  name='cacheTimeout'
                  value={settings.cacheTimeout}
                  onChange={handleInputChange}
                  placeholder='60'
                />
              </div>
            </div>

            <div className='form-row'>
              <div className='form-group'>
                <label>Compressão de Imagens</label>
                <select
                  name='imageCompression'
                  value={settings.imageCompression}
                  onChange={handleInputChange}
                >
                  <option value='high'>Alta</option>
                  <option value='medium'>Média</option>
                  <option value='low'>Baixa</option>
                  <option value='disabled'>Desabilitada</option>
                </select>
              </div>
              <div className='form-group'>
                <label>Qualidade de Compressão (%)</label>
                <input
                  type='number'
                  name='compressionQuality'
                  value={settings.compressionQuality}
                  onChange={handleInputChange}
                  placeholder='80'
                  min='10'
                  max='100'
                />
              </div>
            </div>

            <button className='clear-cache-btn' onClick={clearCache}>
              Limpar Cache do Sistema
            </button>
          </div>
        )}

        {activeTab === 'system' && (
          <div className='settings-section'>
            <h3>Configurações de Acesso</h3>
            
            <div className='form-row'>
              <div className='form-group'>
                <label>Máximo de Lojas por Usuário</label>
                <input
                  type='number'
                  name='maxStoresPerUser'
                  value={settings.maxStoresPerUser}
                  onChange={handleInputChange}
                  placeholder='5'
                />
              </div>
              <div className='form-group'>
                <label>Permitir Registro de Novos Usuários</label>
                <select
                  name='allowUserRegistration'
                  value={settings.allowUserRegistration}
                  onChange={handleInputChange}
                >
                  <option value='true'>Sim</option>
                  <option value='false'>Não</option>
                </select>
              </div>
            </div>
            
            <div className='form-group'>
              <label>Modo de Manutenção</label>
              <select
                name='maintenanceMode'
                value={settings.maintenanceMode}
                onChange={handleInputChange}
              >
                <option value='false'>Desabilitado</option>
                <option value='true'>Habilitado</option>
              </select>
            </div>

            <div className='settings-section'>
              <h3>Sistema e Logs</h3>
              
              <div className='form-row'>
                <div className='form-group'>
                  <label>Frequência de Backup</label>
                  <select
                    name='backupFrequency'
                    value={settings.backupFrequency}
                    onChange={handleInputChange}
                  >
                    <option value='daily'>Diário</option>
                    <option value='weekly'>Semanal</option>
                    <option value='monthly'>Mensal</option>
                  </select>
                </div>
                <div className='form-group'>
                  <label>Nível de Log</label>
                  <select
                    name='logLevel'
                    value={settings.logLevel}
                    onChange={handleInputChange}
                  >
                    <option value='error'>Apenas Erros</option>
                    <option value='warning'>Avisos e Erros</option>
                    <option value='info'>Informações</option>
                    <option value='debug'>Debug (Completo)</option>
                  </select>
                </div>
              </div>

              <div className='system-actions'>
                <button className='backup-btn' onClick={handleBackup}>
                  Criar Backup Manual
                </button>
                <button className='clear-logs-btn' onClick={handleClearLogs}>
                  Limpar Logs do Sistema
                </button>
              </div>
            </div>
          </div>
        )}
        </>
      </div>

      <div className='settings-actions'>
        <button className='save-btn' onClick={handleSubmit}>
          Salvar Configurações
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
