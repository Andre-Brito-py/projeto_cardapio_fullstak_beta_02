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
    
    // Lisa AI Assistant API
    lisaEnabled: false,
    lisaOpenAiApiKey: '',
    lisaGroqApiKey: '',
    lisaChainlitSecret: '',
    lisaLiteralApiKey: '',
    lisaOllamaUrl: 'http://localhost:11434',
    lisaOllamaModel: 'llama2',
    lisaPort: '8000',
    lisaMaxFileSize: 10,
    
    // Configurações de frete
    shippingEnabled: true,
    freeShippingMinValue: 50,
    baseShippingCost: 5,
    costPerKm: 2,
    
    // WhatsApp Business API
    whatsappEnabled: false,
    whatsappAccessToken: '',
    whatsappPhoneNumberId: '',
    whatsappWebhookVerifyToken: '',
    whatsappBusinessAccountId: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [testingGoogleMaps, setTestingGoogleMaps] = useState(false);
  const [testingAsaas, setTestingAsaas] = useState(false);
  const [testingLisa, setTestingLisa] = useState(false);
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);
  const [googleMapsStatus, setGoogleMapsStatus] = useState(null);
  const [asaasStatus, setAsaasStatus] = useState(null);
  const [lisaStatus, setLisaStatus] = useState(null);
  const [whatsappStatus, setWhatsappStatus] = useState(null);
  const [lisaServiceStatus, setLisaServiceStatus] = useState(null);
  const [controllingLisa, setControllingLisa] = useState(false);

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

  const testWhatsAppApi = async () => {
    if (!settings.whatsappAccessToken || !settings.whatsappPhoneNumberId) {
      toast.error('Insira o Access Token e Phone Number ID primeiro');
      return;
    }

    try {
      setTestingWhatsApp(true);
      const response = await axios.post(`${url}/api/system/api/test-whatsapp`, {
        accessToken: settings.whatsappAccessToken,
        phoneNumberId: settings.whatsappPhoneNumberId,
        businessAccountId: settings.whatsappBusinessAccountId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setWhatsappStatus({ success: true, message: response.data.message });
        toast.success('API do WhatsApp Business funcionando corretamente!');
      } else {
        setWhatsappStatus({ success: false, message: response.data.message });
        toast.error('Erro na API do WhatsApp: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao testar WhatsApp:', error);
      setWhatsappStatus({ success: false, message: 'Erro ao conectar com a API' });
      toast.error('Erro ao testar API do WhatsApp Business');
    } finally {
      setTestingWhatsApp(false);
    }
  };

  const testLisaApi = async () => {
    if (!settings.lisaOpenAiApiKey && !settings.lisaGroqApiKey) {
      toast.error('Insira pelo menos uma chave de API (OpenAI ou Groq) para testar a Lisa');
      return;
    }

    try {
      setTestingLisa(true);
      const response = await axios.post(`${url}/api/system/api/test-lisa`, {
        openAiApiKey: settings.lisaOpenAiApiKey,
        groqApiKey: settings.lisaGroqApiKey,
        chainlitSecret: settings.lisaChainlitSecret,
        literalApiKey: settings.lisaLiteralApiKey,
        ollamaUrl: settings.lisaOllamaUrl,
        ollamaModel: settings.lisaOllamaModel,
        port: settings.lisaPort
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLisaStatus({ success: true, message: response.data.message });
        toast.success('Lisa AI Assistant configurada corretamente!');
      } else {
        setLisaStatus({ success: false, message: response.data.message });
        toast.error('Erro na configuração da Lisa: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao testar Lisa:', error);
      setLisaStatus({ success: false, message: 'Erro ao conectar com a Lisa AI' });
      toast.error('Erro ao testar Lisa AI Assistant');
    } finally {
      setTestingLisa(false);
    }
  };

  const getLisaServiceStatus = async () => {
    try {
      const response = await axios.get(`${url}/api/system/lisa/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setLisaServiceStatus(response.data.status);
      }
    } catch (error) {
      console.error('Erro ao obter status da Lisa:', error);
    }
  };

  const startLisa = async () => {
    try {
      setControllingLisa(true);
      const response = await axios.post(`${url}/api/system/lisa/start`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Lisa AI Assistant iniciada com sucesso!');
        getLisaServiceStatus();
      } else {
        toast.error('Erro ao iniciar Lisa: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao iniciar Lisa:', error);
      toast.error('Erro ao iniciar Lisa AI Assistant');
    } finally {
      setControllingLisa(false);
    }
  };

  const stopLisa = async () => {
    try {
      setControllingLisa(true);
      const response = await axios.post(`${url}/api/system/lisa/stop`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Lisa AI Assistant parada com sucesso!');
        getLisaServiceStatus();
      } else {
        toast.error('Erro ao parar Lisa: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao parar Lisa:', error);
      toast.error('Erro ao parar Lisa AI Assistant');
    } finally {
      setControllingLisa(false);
    }
  };

  const restartLisa = async () => {
    try {
      setControllingLisa(true);
      const response = await axios.post(`${url}/api/system/lisa/restart`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Lisa AI Assistant reiniciada com sucesso!');
        getLisaServiceStatus();
      } else {
        toast.error('Erro ao reiniciar Lisa: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao reiniciar Lisa:', error);
      toast.error('Erro ao reiniciar Lisa AI Assistant');
    } finally {
      setControllingLisa(false);
    }
  };

  useEffect(() => {
    if (settings.lisaEnabled) {
      getLisaServiceStatus();
      const interval = setInterval(getLisaServiceStatus, 30000); // Atualiza a cada 30 segundos
      return () => clearInterval(interval);
    }
  }, [settings.lisaEnabled]);

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

        {/* WhatsApp Business API */}
        <div className="api-section">
          <div className="section-header">
            <div className="section-title">
              <h2>💬 WhatsApp Business API</h2>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="whatsappEnabled"
                  name="whatsappEnabled"
                  checked={settings.whatsappEnabled}
                  onChange={handleInputChange}
                />
                <label htmlFor="whatsappEnabled">Ativar</label>
              </div>
            </div>
            {whatsappStatus && (
              <div className={`status-indicator ${whatsappStatus.success ? 'success' : 'error'}`}>
                {whatsappStatus.success ? '✅' : '❌'} {whatsappStatus.message}
              </div>
            )}
          </div>

          <div className="section-content">
            <div className="form-group">
              <label>Access Token</label>
              <div className="input-with-button">
                <input
                  type="password"
                  name="whatsappAccessToken"
                  value={settings.whatsappAccessToken}
                  onChange={handleInputChange}
                  placeholder="Insira seu Access Token do WhatsApp Business"
                  disabled={!settings.whatsappEnabled}
                />
                <button
                  type="button"
                  onClick={testWhatsAppApi}
                  disabled={testingWhatsApp || !settings.whatsappEnabled}
                  className="test-button"
                >
                  {testingWhatsApp ? 'Testando...' : 'Testar'}
                </button>
              </div>
              <small className="form-help">
                Token de acesso permanente para a API do WhatsApp Business.
                <a href="https://developers.facebook.com/docs/whatsapp/business-management-api/get-started" target="_blank" rel="noopener noreferrer">
                  Como obter o Access Token
                </a>
              </small>
            </div>

            <div className="form-group">
              <label>Phone Number ID</label>
              <input
                type="text"
                name="whatsappPhoneNumberId"
                value={settings.whatsappPhoneNumberId}
                onChange={handleInputChange}
                placeholder="ID do número de telefone"
                disabled={!settings.whatsappEnabled}
              />
              <small className="form-help">
                ID do número de telefone registrado no WhatsApp Business.
              </small>
            </div>

            <div className="form-group">
              <label>Business Account ID</label>
              <input
                type="text"
                name="whatsappBusinessAccountId"
                value={settings.whatsappBusinessAccountId}
                onChange={handleInputChange}
                placeholder="ID da conta comercial"
                disabled={!settings.whatsappEnabled}
              />
              <small className="form-help">
                ID da conta comercial do WhatsApp Business (opcional).
              </small>
            </div>

            <div className="form-group">
              <label>Webhook Verify Token</label>
              <input
                type="password"
                name="whatsappWebhookVerifyToken"
                value={settings.whatsappWebhookVerifyToken}
                onChange={handleInputChange}
                placeholder="Token de verificação do webhook"
                disabled={!settings.whatsappEnabled}
              />
              <small className="form-help">
                Token usado para verificar a autenticidade dos webhooks do WhatsApp.
              </small>
            </div>

            <div className="api-info">
              <h4>ℹ️ Informações Importantes</h4>
              <ul>
                <li>Configure o webhook URL: <code>{url}/api/whatsapp/webhook</code></li>
                <li>Certifique-se de que o número está verificado no WhatsApp Business</li>
                <li>A integração permite receber e enviar mensagens automaticamente</li>
                <li>As mensagens são processadas pela Lisa AI quando ativada</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Lisa AI Assistant */}
        <div className="api-section">
          <div className="section-header">
            <div className="section-title">
              <h2>🤖 Lisa AI Assistant</h2>
              <div className="toggle-switch">
                <input
                  type="checkbox"
                  id="lisaEnabled"
                  name="lisaEnabled"
                  checked={settings.lisaEnabled}
                  onChange={handleInputChange}
                />
                <label htmlFor="lisaEnabled">Ativar</label>
              </div>
            </div>
            {lisaStatus && (
              <div className={`status-indicator ${lisaStatus.success ? 'success' : 'error'}`}>
                {lisaStatus.success ? '✅' : '❌'} {lisaStatus.message}
              </div>
            )}
          </div>

          <div className="section-content">
            <div className="form-group">
              <label>OpenAI API Key</label>
              <div className="input-with-button">
                <input
                  type="password"
                  name="lisaOpenAiApiKey"
                  value={settings.lisaOpenAiApiKey}
                  onChange={handleInputChange}
                  placeholder="sk-..."
                  disabled={!settings.lisaEnabled}
                />
              </div>
              <small className="form-help">
                Chave da API do OpenAI para modelos GPT.
                <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer">
                  Obter chave da API
                </a>
              </small>
            </div>

            <div className="form-group">
              <label>Groq API Key</label>
              <input
                type="password"
                name="lisaGroqApiKey"
                value={settings.lisaGroqApiKey}
                onChange={handleInputChange}
                placeholder="gsk_..."
                disabled={!settings.lisaEnabled}
              />
              <small className="form-help">
                Chave da API do Groq para modelos rápidos.
                <a href="https://console.groq.com/keys" target="_blank" rel="noopener noreferrer">
                  Obter chave da API
                </a>
              </small>
            </div>

            <div className="form-group">
              <label>Chainlit Secret</label>
              <input
                type="password"
                name="lisaChainlitSecret"
                value={settings.lisaChainlitSecret}
                onChange={handleInputChange}
                placeholder="Segredo para autenticação do Chainlit"
                disabled={!settings.lisaEnabled}
              />
              <small className="form-help">
                Chave secreta para autenticação do Chainlit.
              </small>
            </div>

            <div className="form-group">
              <label>Literal AI API Key</label>
              <input
                type="password"
                name="lisaLiteralApiKey"
                value={settings.lisaLiteralApiKey}
                onChange={handleInputChange}
                placeholder="lsk_..."
                disabled={!settings.lisaEnabled}
              />
              <small className="form-help">
                Chave da API do Literal AI para observabilidade.
                <a href="https://cloud.getliteral.ai/" target="_blank" rel="noopener noreferrer">
                  Obter chave da API
                </a>
              </small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>URL do Ollama</label>
                <input
                  type="text"
                  name="lisaOllamaUrl"
                  value={settings.lisaOllamaUrl}
                  onChange={handleInputChange}
                  placeholder="http://localhost:11434"
                  disabled={!settings.lisaEnabled}
                />
                <small className="form-help">
                  URL do servidor Ollama local.
                </small>
              </div>

              <div className="form-group">
                <label>Modelo Ollama</label>
                <input
                  type="text"
                  name="lisaOllamaModel"
                  value={settings.lisaOllamaModel}
                  onChange={handleInputChange}
                  placeholder="llama2"
                  disabled={!settings.lisaEnabled}
                />
                <small className="form-help">
                  Nome do modelo Ollama a ser usado.
                </small>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Porta do Servidor</label>
                <input
                  type="number"
                  name="lisaPort"
                  value={settings.lisaPort}
                  onChange={handleInputChange}
                  placeholder="8000"
                  disabled={!settings.lisaEnabled}
                />
                <small className="form-help">
                  Porta onde o servidor da Lisa será executado.
                </small>
              </div>

              <div className="form-group">
                <label>Tamanho Máximo de Arquivo (MB)</label>
                <input
                  type="number"
                  name="lisaMaxFileSize"
                  value={settings.lisaMaxFileSize}
                  onChange={handleInputChange}
                  placeholder="10"
                  disabled={!settings.lisaEnabled}
                />
                <small className="form-help">
                  Tamanho máximo para upload de arquivos.
                </small>
              </div>
            </div>

            <div className="test-section">
              <button
                type="button"
                onClick={testLisaApi}
                disabled={testingLisa || !settings.lisaEnabled}
                className="test-button"
              >
                {testingLisa ? 'Testando...' : '🧪 Testar Configuração'}
              </button>
              
              {settings.lisaEnabled && (
                <div className="lisa-controls">
                  <div className="service-status">
                    <span className="status-label">Status do Serviço:</span>
                    <span className={`status-badge ${lisaServiceStatus?.running ? 'running' : 'stopped'}`}>
                      {lisaServiceStatus?.running ? '🟢 Executando' : '🔴 Parado'}
                    </span>
                    {lisaServiceStatus?.port && (
                      <span className="port-info">Porta: {lisaServiceStatus.port}</span>
                    )}
                  </div>
                  
                  <div className="control-buttons">
                    <button
                      type="button"
                      onClick={startLisa}
                      disabled={controllingLisa || lisaServiceStatus?.running}
                      className="control-button start"
                    >
                      {controllingLisa ? '⏳' : '▶️'} Iniciar
                    </button>
                    
                    <button
                      type="button"
                      onClick={stopLisa}
                      disabled={controllingLisa || !lisaServiceStatus?.running}
                      className="control-button stop"
                    >
                      {controllingLisa ? '⏳' : '⏹️'} Parar
                    </button>
                    
                    <button
                      type="button"
                      onClick={restartLisa}
                      disabled={controllingLisa}
                      className="control-button restart"
                    >
                      {controllingLisa ? '⏳' : '🔄'} Reiniciar
                    </button>
                  </div>
                  
                  {lisaServiceStatus?.url && (
                    <div className="service-url">
                      <span>Acesse a Lisa em: </span>
                      <a href={lisaServiceStatus.url} target="_blank" rel="noopener noreferrer">
                        {lisaServiceStatus.url}
                      </a>
                    </div>
                  )}
                </div>
              )}
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
          <a href="https://platform.openai.com/docs" target="_blank" rel="noopener noreferrer">
            📖 Documentação OpenAI API
          </a>
          <a href="https://console.groq.com/docs" target="_blank" rel="noopener noreferrer">
            📖 Documentação Groq API
          </a>
          <a href="https://docs.chainlit.io/" target="_blank" rel="noopener noreferrer">
            📖 Documentação Chainlit
          </a>
          <a href="https://developers.facebook.com/docs/whatsapp/business-management-api" target="_blank" rel="noopener noreferrer">
            📖 Documentação WhatsApp Business API
          </a>
        </div>
      </div>
    </div>
  );
};

export default ApiManagement;