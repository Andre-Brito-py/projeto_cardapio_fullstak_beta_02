import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './ApiManagement.css';

const ApiManagement = ({ url, token }) => {
  const [settings, setSettings] = useState({
    // Google Maps API
    googleMapsApiKey: '',
    googleMapsEnabled: false,
    
    // Asaas API
    asaasApiKey: '',
    asaasEnvironment: 'sandbox', // sandbox ou production
    asaasEnabled: false,
    
    // Configurações de frete
    shippingEnabled: true,
    freeShippingMinValue: 50,
    baseShippingCost: 5,
    costPerKm: 2
  });
  
  const [loading, setLoading] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [googleMapsStatus, setGoogleMapsStatus] = useState(null);
  const [asaasStatus, setAsaasStatus] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/system/api/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSettings(response.data.settings);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações das APIs');
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

  const saveSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`${url}/api/system/api/settings`, settings, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Configurações salvas com sucesso!');
      } else {
        toast.error('Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testGoogleMapsApi = async () => {
    if (!settings.googleMapsApiKey) {
      toast.error('Insira a chave da API do Google Maps primeiro');
      return;
    }

    try {
      setTestingGoogleMaps(true);
      const response = await axios.post(`${url}/api/system/api/test-google-maps`, {
        apiKey: settings.googleMapsApiKey
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setGoogleMapsStatus({ success: true, message: response.data.message });
        toast.success('API do Google Maps funcionando corretamente!');
      } else {
        setGoogleMapsStatus({ success: false, message: response.data.message });
        toast.error('Erro na API do Google Maps: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao testar Google Maps:', error);
      setGoogleMapsStatus({ success: false, message: 'Erro ao conectar com a API' });
      toast.error('Erro ao testar API do Google Maps');
    } finally {
      setTestingGoogleMaps(false);
    }
  };

  const testAsaasApi = async () => {
    if (!settings.asaasApiKey) {
      toast.error('Insira a chave da API do Asaas primeiro');
      return;
    }

    try {
      setTestingAsaas(true);
      const response = await axios.post(`${url}/api/system/api/test-asaas`, {
        apiKey: settings.asaasApiKey,
        environment: settings.asaasEnvironment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAsaasStatus({ success: true, message: response.data.message });
        toast.success('API do Asaas funcionando corretamente!');
      } else {
        setAsaasStatus({ success: false, message: response.data.message });
        toast.error('Erro na API do Asaas: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao testar Asaas:', error);
      setAsaasStatus({ success: false, message: 'Erro ao conectar com a API' });
      toast.error('Erro ao testar API do Asaas');
    } finally {
      setTestingAsaas(false);
    }
  };

  if (loading) {
    return (
      <div className="api-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="api-management">
      <div className="page-header">
        <h1>🔧 Gerenciamento de APIs</h1>
        <p>Configure e gerencie as integrações com APIs externas</p>
      </div>

      <div className="api-sections">
        {/* Google Maps API */}
        <div className="api-section">
          <div className="section-header">
            <div className="section-title">
              <h2>🗺️ Google Maps API</h2>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="googleMapsEnabled"
                  name="googleMapsEnabled"
                  checked={settings.googleMapsEnabled}
                  onChange={handleInputChange}
                />
                <label htmlFor="googleMapsEnabled">Ativar</label>
              </div>
            </div>
            {googleMapsStatus && (
              <div className={`status-indicator ${googleMapsStatus.success ? 'success' : 'error'}`}>
                {googleMapsStatus.success ? '✅' : '❌'} {googleMapsStatus.message}
              </div>
            )}
          </div>

          <div className="section-content">
            <div className="form-group">
              <label>Chave da API</label>
              <div className="input-with-button">
                <input
                  type="password"
                  name="googleMapsApiKey"
                  value={settings.googleMapsApiKey}
                  onChange={handleInputChange}
                  placeholder="Insira sua chave da API do Google Maps"
                  disabled={!settings.googleMapsEnabled}
                />
                <button
                  type="button"
                  onClick={testGoogleMapsApi}
                  disabled={testingGoogleMaps || !settings.googleMapsEnabled}
                  className="test-button"
                >
                  {testingGoogleMaps ? 'Testando...' : 'Testar'}
                </button>
              </div>
              <small className="form-help">
                Esta chave é usada para calcular distâncias de entrega e exibir mapas.
                <a href="https://developers.google.com/maps/documentation/javascript/get-api-key" target="_blank" rel="noopener noreferrer">
                  Como obter uma chave da API
                </a>
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Frete Grátis Acima de (R$)</label>
                <input
                  type="number"
                  name="freeShippingMinValue"
                  value={settings.freeShippingMinValue}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={!settings.googleMapsEnabled}
                />
              </div>
              <div className="form-group">
                <label>Custo Base do Frete (R$)</label>
                <input
                  type="number"
                  name="baseShippingCost"
                  value={settings.baseShippingCost}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={!settings.googleMapsEnabled}
                />
              </div>
              <div className="form-group">
                <label>Custo por KM (R$)</label>
                <input
                  type="number"
                  name="costPerKm"
                  value={settings.costPerKm}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  disabled={!settings.googleMapsEnabled}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Asaas API */}
        <div className="api-section">
          <div className="section-header">
            <div className="section-title">
              <h2>💳 Asaas API</h2>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="asaasEnabled"
                  name="asaasEnabled"
                  checked={settings.asaasEnabled}
                  onChange={handleInputChange}
                />
                <label htmlFor="asaasEnabled">Ativar</label>
              </div>
            </div>
            {asaasStatus && (
              <div className={`status-indicator ${asaasStatus.success ? 'success' : 'error'}`}>
                {asaasStatus.success ? '✅' : '❌'} {asaasStatus.message}
              </div>
            )}
          </div>

          <div className="section-content">
            <div className="form-group">
              <label>Ambiente</label>
              <select
                name="asaasEnvironment"
                value={settings.asaasEnvironment}
                onChange={handleInputChange}
                disabled={!settings.asaasEnabled}
              >
                <option value="sandbox">Sandbox (Testes)</option>
                <option value="production">Produção</option>
              </select>
              <small className="form-help">
                Use "Sandbox" para testes e "Produção" quando o sistema estiver online.
              </small>
            </div>

            <div className="form-group">
              <label>Chave da API</label>
              <div className="input-with-button">
                <input
                  type="password"
                  name="asaasApiKey"
                  value={settings.asaasApiKey}
                  onChange={handleInputChange}
                  placeholder="Insira sua chave da API do Asaas"
                  disabled={!settings.asaasEnabled}
                />
                <button
                  type="button"
                  onClick={testAsaasApi}
                  disabled={testingAsaas || !settings.asaasEnabled}
                  className="test-button"
                >
                  {testingAsaas ? 'Testando...' : 'Testar'}
                </button>
              </div>
              <small className="form-help">
                Esta chave é usada para processar pagamentos e gerenciar assinaturas.
                <a href="https://docs.asaas.com/docs/como-obter-seu-api-key" target="_blank" rel="noopener noreferrer">
                  Como obter uma chave da API
                </a>
              </small>
            </div>

            <div className="environment-info">
              <div className={`env-badge ${settings.asaasEnvironment}`}>
                {settings.asaasEnvironment === 'sandbox' ? '🧪 Modo Teste' : '🚀 Modo Produção'}
              </div>
              <p>
                {settings.asaasEnvironment === 'sandbox' 
                  ? 'No modo teste, nenhuma cobrança real será feita. Use para testar a integração.'
                  : 'No modo produção, cobranças reais serão processadas. Certifique-se de que tudo está funcionando corretamente.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="actions">
        <button
          type="button"
          onClick={saveSettings}
          disabled={loading}
          className="save-button"
        >
          {loading ? 'Salvando...' : '💾 Salvar Configurações'}
        </button>
      </div>

      <div className="api-documentation">
        <h3>📚 Documentação</h3>
        <div className="doc-links">
          <a href="https://developers.google.com/maps/documentation" target="_blank" rel="noopener noreferrer">
            📖 Documentação Google Maps API
          </a>
          <a href="https://docs.asaas.com/" target="_blank" rel="noopener noreferrer">
            📖 Documentação Asaas API
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiManagement;