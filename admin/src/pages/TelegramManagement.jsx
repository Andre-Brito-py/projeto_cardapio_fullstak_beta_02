import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import './TelegramManagement.css';

const TelegramManagement = ({ url, token }) => {
    const [config, setConfig] = useState({
        phoneNumber: '',
        isActive: false,
        adminChatId: '',
        welcomeMessage: 'Olá! Bem-vindo à nossa loja. Como posso ajudá-lo?',
        autoReply: {
            enabled: false,
            message: 'Obrigado pela sua mensagem! Responderemos em breve.'
        },
        businessHours: {
            enabled: false,
            monday: { open: '08:00', close: '18:00', closed: false },
            tuesday: { open: '08:00', close: '18:00', closed: false },
            wednesday: { open: '08:00', close: '18:00', closed: false },
            thursday: { open: '08:00', close: '18:00', closed: false },
            friday: { open: '08:00', close: '18:00', closed: false },
            saturday: { open: '08:00', close: '18:00', closed: false },
            sunday: { open: '08:00', close: '18:00', closed: true }
        }
    });
    
    const [status, setStatus] = useState({
        configured: false,
        active: false,
        adminChatConfigured: false,
        serviceInitialized: false
    });
    
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);

    useEffect(() => {
        fetchConfig();
        fetchStatus();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await axios.get(`${url}/api/store/telegram/config`, {
                headers: { token }
            });
            
            if (response.data.success) {
                setConfig(response.data.config);
            }
        } catch (error) {
            console.error('Erro ao buscar configuração:', error);
            toast.error('Erro ao carregar configurações do Telegram');
        }
    };

    const fetchStatus = async () => {
        try {
            const response = await axios.get(`${url}/api/store/telegram/status`, {
                headers: { token }
            });
            
            if (response.data.success) {
                setStatus(response.data.status);
            }
        } catch (error) {
            console.error('Erro ao buscar status:', error);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const response = await axios.put(`${url}/api/store/telegram/config`, config, {
                headers: { token }
            });
            
            if (response.data.success) {
                toast.success('Configurações salvas com sucesso!');
                fetchStatus(); // Atualizar status após salvar
            }
        } catch (error) {
            console.error('Erro ao salvar configuração:', error);
            toast.error('Erro ao salvar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        try {
            const response = await axios.post(`${url}/api/store/telegram/test`, {}, {
                headers: { token }
            });
            
            if (response.data.success) {
                toast.success('Mensagem de teste enviada com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao testar:', error);
            toast.error(error.response?.data?.message || 'Erro ao enviar mensagem de teste');
        } finally {
            setTesting(false);
        }
    };

    const handleBusinessHourChange = (day, field, value) => {
        setConfig(prev => ({
            ...prev,
            businessHours: {
                ...prev.businessHours,
                [day]: {
                    ...prev.businessHours[day],
                    [field]: value
                }
            }
        }));
    };

    const formatPhoneNumber = (value) => {
        // Remove tudo que não é número
        const numbers = value.replace(/\D/g, '');
        
        // Aplica máscara brasileira
        if (numbers.length <= 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        }
        return numbers.slice(0, 11).replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    };

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
        <div className="telegram-management">
            <div className="telegram-header">
                <h2>Configurações do Telegram</h2>
                <div className="status-indicators">
                    <div className={`status-item ${status.configured ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        Configurado
                    </div>
                    <div className={`status-item ${status.active ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        Ativo
                    </div>
                    <div className={`status-item ${status.serviceInitialized ? 'active' : 'inactive'}`}>
                        <span className="status-dot"></span>
                        Serviço Online
                    </div>
                </div>
            </div>

            <div className="telegram-content">
                <div className="config-section">
                    <h3>Configurações Básicas</h3>
                    
                    <div className="form-group">
                        <label>Número do Telegram da Loja</label>
                        <input
                            type="text"
                            value={config.phoneNumber}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                phoneNumber: formatPhoneNumber(e.target.value)
                            }))}
                            placeholder="(11) 99999-9999"
                            maxLength={15}
                        />
                        <small>Número de telefone associado ao Telegram da loja</small>
                    </div>

                    <div className="form-group">
                        <label>Chat ID do Administrador</label>
                        <input
                            type="text"
                            value={config.adminChatId}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                adminChatId: e.target.value
                            }))}
                            placeholder="123456789"
                        />
                        <small>ID do chat do administrador para receber notificações</small>
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.isActive}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    isActive: e.target.checked
                                }))}
                            />
                            Ativar Telegram para esta loja
                        </label>
                    </div>
                </div>

                <div className="config-section">
                    <h3>Mensagens Automáticas</h3>
                    
                    <div className="form-group">
                        <label>Mensagem de Boas-vindas</label>
                        <textarea
                            value={config.welcomeMessage}
                            onChange={(e) => setConfig(prev => ({
                                ...prev,
                                welcomeMessage: e.target.value
                            }))}
                            rows={3}
                            placeholder="Mensagem enviada quando um cliente inicia conversa"
                        />
                    </div>

                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.autoReply.enabled}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    autoReply: {
                                        ...prev.autoReply,
                                        enabled: e.target.checked
                                    }
                                }))}
                            />
                            Ativar resposta automática
                        </label>
                    </div>

                    {config.autoReply.enabled && (
                        <div className="form-group">
                            <label>Mensagem de Resposta Automática</label>
                            <textarea
                                value={config.autoReply.message}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    autoReply: {
                                        ...prev.autoReply,
                                        message: e.target.value
                                    }
                                }))}
                                rows={2}
                                placeholder="Mensagem enviada automaticamente"
                            />
                        </div>
                    )}
                </div>

                <div className="config-section">
                    <h3>Horário de Funcionamento</h3>
                    
                    <div className="form-group">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={config.businessHours.enabled}
                                onChange={(e) => setConfig(prev => ({
                                    ...prev,
                                    businessHours: {
                                        ...prev.businessHours,
                                        enabled: e.target.checked
                                    }
                                }))}
                            />
                            Ativar controle de horário de funcionamento
                        </label>
                    </div>

                    {config.businessHours.enabled && (
                        <div className="business-hours">
                            {days.map(day => (
                                <div key={day.key} className="day-config">
                                    <div className="day-header">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={!config.businessHours[day.key].closed}
                                                onChange={(e) => handleBusinessHourChange(day.key, 'closed', !e.target.checked)}
                                            />
                                            {day.label}
                                        </label>
                                    </div>
                                    
                                    {!config.businessHours[day.key].closed && (
                                        <div className="time-inputs">
                                            <input
                                                type="time"
                                                value={config.businessHours[day.key].open}
                                                onChange={(e) => handleBusinessHourChange(day.key, 'open', e.target.value)}
                                            />
                                            <span>às</span>
                                            <input
                                                type="time"
                                                value={config.businessHours[day.key].close}
                                                onChange={(e) => handleBusinessHourChange(day.key, 'close', e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="action-buttons">
                    <button 
                        className="btn-save"
                        onClick={handleSave}
                        disabled={loading}
                    >
                        {loading ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                    
                    <button 
                        className="btn-test"
                        onClick={handleTest}
                        disabled={testing || !config.isActive || !config.adminChatId}
                    >
                        {testing ? 'Testando...' : 'Testar Configuração'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TelegramManagement;