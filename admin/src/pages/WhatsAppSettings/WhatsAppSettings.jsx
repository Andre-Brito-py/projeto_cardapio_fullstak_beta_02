import React, { useState, useEffect } from 'react';
import './WhatsAppSettings.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const WhatsAppSettings = ({ url }) => {
  const [config, setConfig] = useState({
    accessToken: '',
    phoneNumberId: '',
    webhookVerifyToken: '',
    businessAccountId: '',
    enabled: false,
    welcomeMessage: 'Olá! Bem-vindo ao nosso atendimento via WhatsApp. Como posso ajudá-lo hoje?',
    lisaEnabled: true,
    businessHours: {
      enabled: false,
      outsideHoursMessage: 'Obrigado pelo contato! Nosso horário de atendimento é de segunda a sexta, das 8h às 18h. Retornaremos seu contato no próximo horário comercial.',
      schedule: {
        monday: { active: true, start: '08:00', end: '18:00' },
        tuesday: { active: true, start: '08:00', end: '18:00' },
        wednesday: { active: true, start: '08:00', end: '18:00' },
        thursday: { active: true, start: '08:00', end: '18:00' },
        friday: { active: true, start: '08:00', end: '18:00' },
        saturday: { active: false, start: '08:00', end: '18:00' },
        sunday: { active: false, start: '08:00', end: '18:00' }
      }
    }
  });
  const [loading, setLoading] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [testingConnection, setTestingConnection] = useState(false);

  // Buscar configuração atual
  const fetchConfig = async () => {
    try {
      setLoadingConfig(true);
      const response = await axios.get(`${url}/api/whatsapp/config`);
      if (response.data.success && response.data.data) {
        setConfig(prevConfig => ({
          ...prevConfig,
          ...response.data.data
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      if (error.response?.status !== 404) {
        toast.error('Erro ao carregar configuração do WhatsApp');
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  // Salvar configuração
  const saveConfig = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const response = await axios.post(`${url}/api/whatsapp/config`, config);
      if (response.data.success) {
        toast.success('Configuração salva com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setLoading(false);
    }
  };

  // Testar conexão
  const testConnection = async () => {
    try {
      setTestingConnection(true);
      const response = await axios.post(`${url}/api/whatsapp/test-connection`);
      if (response.data.success) {
        setConnectionStatus('success');
        toast.success('Conexão testada com sucesso!');
      } else {
        setConnectionStatus('error');
        toast.error('Falha na conexão: ' + response.data.message);
      }
    } catch (error) {
      console.error('Erro ao testar conexão:', error);
      setConnectionStatus('error');
      toast.error('Erro ao testar conexão');
    } finally {
      setTestingConnection(false);
    }
  };

  // Atualizar campo de configuração
  const updateConfig = (field, value) => {
    if (field.includes('.')) {
      const [parent, child, grandchild] = field.split('.');
      if (grandchild) {
        setConfig(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [grandchild]: value
            }
          }
        }));
      } else {
        setConfig(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: value
          }
        }));
      }
    } else {
      setConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  // Atualizar horário de funcionamento
  const updateSchedule = (day, field, value) => {
    setConfig(prev => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        schedule: {
          ...prev.businessHours.schedule,
          [day]: {
            ...prev.businessHours.schedule[day],
            [field]: value
          }
        }
      }
    }));
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  if (loadingConfig) {
    return <div className="loading">Carregando configurações...</div>;
  }

  const days = [
    { key: 'monday', label: 'Segunda-feira' },
    { key: 'tuesday', label: 'Terça-feira' },
    { key: 'wednesday', label: 'Quarta-feira' },
    { key: 'thursday', label: 'Quinta-feira' },
    { key: 'friday', label: 'Sexta-feira' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ];

  return (
    <div className="whatsapp-settings">
      <div className="settings-header">
        <h2>Configurações do WhatsApp Business</h2>
        <p>Configure a integração com o WhatsApp Business API e a Lisa AI</p>
      </div>

      <form onSubmit={saveConfig} className="whatsapp-form">
        {/* Configurações Básicas */}
        <div className="settings-section">
          <h3>Configurações da API</h3>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => updateConfig('enabled', e.target.checked)}
              />
              Habilitar WhatsApp Business
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="accessToken">Access Token:</label>
            <input
              type="password"
              id="accessToken"
              value={config.accessToken}
              onChange={(e) => updateConfig('accessToken', e.target.value)}
              placeholder="Seu token de acesso do WhatsApp Business"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phoneNumberId">Phone Number ID:</label>
            <input
              type="text"
              id="phoneNumberId"
              value={config.phoneNumberId}
              onChange={(e) => updateConfig('phoneNumberId', e.target.value)}
              placeholder="ID do número de telefone"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="businessAccountId">Business Account ID:</label>
            <input
              type="text"
              id="businessAccountId"
              value={config.businessAccountId}
              onChange={(e) => updateConfig('businessAccountId', e.target.value)}
              placeholder="ID da conta business"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="webhookVerifyToken">Webhook Verify Token:</label>
            <input
              type="text"
              id="webhookVerifyToken"
              value={config.webhookVerifyToken}
              onChange={(e) => updateConfig('webhookVerifyToken', e.target.value)}
              placeholder="Token para verificação do webhook"
              className="form-input"
            />
          </div>
        </div>

        {/* Configurações da Lisa AI */}
        <div className="settings-section">
          <h3>Configurações da Lisa AI</h3>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.lisaEnabled}
                onChange={(e) => updateConfig('lisaEnabled', e.target.checked)}
              />
              Habilitar Lisa AI para WhatsApp
            </label>
          </div>

          <div className="form-group">
            <label htmlFor="welcomeMessage">Mensagem de Boas-vindas:</label>
            <textarea
              id="welcomeMessage"
              value={config.welcomeMessage}
              onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
              placeholder="Mensagem enviada quando o cliente inicia uma conversa"
              className="form-textarea"
              rows="3"
            />
          </div>
        </div>

        {/* Horário de Funcionamento */}
        <div className="settings-section">
          <h3>Horário de Funcionamento</h3>
          
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={config.businessHours.enabled}
                onChange={(e) => updateConfig('businessHours.enabled', e.target.checked)}
              />
              Habilitar horário de funcionamento
            </label>
          </div>

          {config.businessHours.enabled && (
            <>
              <div className="form-group">
                <label htmlFor="outsideHoursMessage">Mensagem fora do horário:</label>
                <textarea
                  id="outsideHoursMessage"
                  value={config.businessHours.outsideHoursMessage}
                  onChange={(e) => updateConfig('businessHours.outsideHoursMessage', e.target.value)}
                  placeholder="Mensagem enviada fora do horário de funcionamento"
                  className="form-textarea"
                  rows="3"
                />
              </div>

              <div className="schedule-grid">
                {days.map(day => (
                  <div key={day.key} className="schedule-day">
                    <label className="day-label">
                      <input
                        type="checkbox"
                        checked={config.businessHours.schedule[day.key].active}
                        onChange={(e) => updateSchedule(day.key, 'active', e.target.checked)}
                      />
                      {day.label}
                    </label>
                    {config.businessHours.schedule[day.key].active && (
                      <div className="time-inputs">
                        <input
                          type="time"
                          value={config.businessHours.schedule[day.key].start}
                          onChange={(e) => updateSchedule(day.key, 'start', e.target.value)}
                          className="time-input"
                        />
                        <span>às</span>
                        <input
                          type="time"
                          value={config.businessHours.schedule[day.key].end}
                          onChange={(e) => updateSchedule(day.key, 'end', e.target.value)}
                          className="time-input"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Botões de Ação */}
        <div className="form-actions">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
          
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={testConnection}
            disabled={testingConnection || !config.accessToken || !config.phoneNumberId}
          >
            {testingConnection ? 'Testando...' : 'Testar Conexão'}
          </button>
        </div>

        {connectionStatus && (
          <div className={`connection-status ${connectionStatus}`}>
            {connectionStatus === 'success' ? '✅ Conexão OK' : '❌ Falha na conexão'}
          </div>
        )}
      </form>
    </div>
  );
};

export default WhatsAppSettings;