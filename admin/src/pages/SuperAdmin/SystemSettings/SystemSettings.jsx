import React, { useState, useEffect } from 'react';
import './SystemSettings.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const SystemSettings = ({ url, token }) => {
  const [settings, setSettings] = useState({
    systemName: '',
    systemEmail: '',
    systemPhone: '',
    maintenanceMode: false,
    allowRegistration: true,
    maxStoresPerUser: 5,
    defaultCurrency: 'BRL',
    systemTimezone: 'America/Sao_Paulo',
    emailNotifications: true,
    smsNotifications: false,
    backupFrequency: 'daily',
    logLevel: 'info'
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/system/settings`, {
        headers: { token }
      });
      if (response.data.success) {
        setSettings({ ...settings, ...response.data.settings });
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
        headers: { token }
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
        headers: { token }
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
        headers: { token }
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

  if (loading) {
    return <div className='loading'>Carregando configurações...</div>;
  }

  return (
    <div className='system-settings'>
      <div className='system-settings-header'>
        <h2>Configurações do Sistema</h2>
        <p>Gerencie as configurações globais do sistema multi-tenant</p>
      </div>

      <form onSubmit={handleSubmit} className='settings-form'>
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
                min='1'
                max='50'
              />
            </div>
          </div>
          
          <div className='checkbox-group'>
            <label>
              <input
                type='checkbox'
                name='allowRegistration'
                checked={settings.allowRegistration}
                onChange={handleInputChange}
              />
              Permitir registro de novos usuários
            </label>
          </div>
          
          <div className='checkbox-group'>
            <label>
              <input
                type='checkbox'
                name='maintenanceMode'
                checked={settings.maintenanceMode}
                onChange={handleInputChange}
              />
              Modo de manutenção (bloqueia acesso às lojas)
            </label>
          </div>
        </div>

        <div className='settings-section'>
          <h3>Notificações</h3>
          <div className='checkbox-group'>
            <label>
              <input
                type='checkbox'
                name='emailNotifications'
                checked={settings.emailNotifications}
                onChange={handleInputChange}
              />
              Notificações por email
            </label>
          </div>
          
          <div className='checkbox-group'>
            <label>
              <input
                type='checkbox'
                name='smsNotifications'
                checked={settings.smsNotifications}
                onChange={handleInputChange}
              />
              Notificações por SMS
            </label>
          </div>
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
                <option value='hourly'>A cada hora</option>
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
                <option value='warn'>Avisos e Erros</option>
                <option value='info'>Informações</option>
                <option value='debug'>Debug (Detalhado)</option>
              </select>
            </div>
          </div>
        </div>

        <div className='form-actions'>
          <button type='submit' disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      <div className='system-actions'>
        <h3>Ações do Sistema</h3>
        <div className='action-buttons'>
          <button 
            className='backup-btn'
            onClick={handleBackup}
            disabled={saving}
          >
            {saving ? 'Processando...' : 'Criar Backup Manual'}
          </button>
          
          <button 
            className='clear-logs-btn'
            onClick={handleClearLogs}
            disabled={saving}
          >
            {saving ? 'Processando...' : 'Limpar Logs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;