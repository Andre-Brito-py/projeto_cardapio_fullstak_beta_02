import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../config/urls';
import './CustomerSegmentation.css';

const CustomerSegmentation = () => {
  const [segmentationRules, setSegmentationRules] = useState({
    newCustomer: {
      maxDays: 30,
      maxOrders: 3,
      enabled: true
    },
    loyalCustomer: {
      minOrders: 10,
      minDays: 90,
      enabled: true
    },
    inactiveCustomer: {
      minDaysSinceLastOrder: 60,
      enabled: true
    },
    vipCustomer: {
      minTotalSpent: 500,
      minOrders: 20,
      enabled: true
    }
  });
  
  const [segmentationStats, setSegmentationStats] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [autoSegmentEnabled, setAutoSegmentEnabled] = useState(true);

  const fetchSegmentationStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/analytics/segmentation-summary`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setSegmentationStats(response.data.stats);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const updateSegmentationRules = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/analytics/update-segmentation-rules`, {
        rules: segmentationRules,
        autoSegmentEnabled
      }, {
        headers: { token }
      });
      
      if (response.data.success) {
        toast.success('Regras de segmentação atualizadas!');
        fetchSegmentationStats();
      } else {
        toast.error('Erro ao atualizar regras');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao atualizar regras');
    } finally {
      setIsUpdating(false);
    }
  };

  const runSegmentation = async () => {
    setIsUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${BACKEND_URL}/api/analytics/run-segmentation`, {}, {
        headers: { token }
      });
      
      if (response.data.success) {
        toast.success(`Segmentação executada! ${response.data.updatedCount} clientes atualizados.`);
        fetchSegmentationStats();
      } else {
        toast.error('Erro ao executar segmentação');
      }
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao executar segmentação');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRuleChange = (segment, field, value) => {
    setSegmentationRules(prev => ({
      ...prev,
      [segment]: {
        ...prev[segment],
        [field]: value
      }
    }));
  };

  useEffect(() => {
    fetchSegmentationStats();
  }, []);

  const getSegmentColor = (segment) => {
    const colors = {
      'new': '#4CAF50',
      'loyal': '#2196F3', 
      'inactive': '#FF9800',
      'vip': '#9C27B0',
      'regular': '#757575'
    };
    return colors[segment] || '#757575';
  };

  const getSegmentIcon = (segment) => {
    const icons = {
      'new': '🆕',
      'loyal': '💎',
      'inactive': '😴',
      'vip': '👑',
      'regular': '👤'
    };
    return icons[segment] || '👤';
  };

  return (
    <div className="customer-segmentation">
      <div className="section-header">
        <h2>🎯 Sistema de Segmentação de Clientes</h2>
        <p>Configure regras automáticas para segmentar clientes e otimizar campanhas da Liza</p>
      </div>

      {/* Controles Principais */}
      <div className="main-controls">
        <div className="auto-segment-toggle">
          <label className="toggle-label">
            <input 
              type="checkbox" 
              checked={autoSegmentEnabled}
              onChange={(e) => setAutoSegmentEnabled(e.target.checked)}
            />
            <span className="toggle-slider"></span>
            Segmentação Automática
          </label>
          <p>Quando ativada, os clientes serão segmentados automaticamente a cada novo pedido</p>
        </div>

        <div className="action-buttons">
          <button 
            className="update-rules-btn"
            onClick={updateSegmentationRules}
            disabled={isUpdating}
          >
            {isUpdating ? '⏳ Salvando...' : '💾 Salvar Regras'}
          </button>
          
          <button 
            className="run-segmentation-btn"
            onClick={runSegmentation}
            disabled={isUpdating}
          >
            {isUpdating ? '⏳ Executando...' : '🚀 Executar Segmentação'}
          </button>
        </div>
      </div>

      {/* Estatísticas Atuais */}
      {segmentationStats && (
        <div className="segmentation-stats">
          <h3>📊 Estatísticas Atuais</h3>
          <div className="stats-grid">
            {Object.entries(segmentationStats).map(([segment, count]) => (
              <div key={segment} className="stat-card">
                <div className="stat-icon" style={{ color: getSegmentColor(segment) }}>
                  {getSegmentIcon(segment)}
                </div>
                <div className="stat-content">
                  <h4>{segment === 'new' ? 'Novos' : segment === 'loyal' ? 'Fiéis' : segment === 'inactive' ? 'Inativos' : segment === 'vip' ? 'VIP' : 'Regulares'}</h4>
                  <p className="stat-value">{count} clientes</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Configuração de Regras */}
      <div className="rules-configuration">
        <h3>⚙️ Configuração de Regras</h3>
        
        <div className="rules-grid">
          {/* Novos Clientes */}
          <div className="rule-card">
            <div className="rule-header">
              <span className="rule-icon">🆕</span>
              <h4>Novos Clientes</h4>
              <label className="rule-toggle">
                <input 
                  type="checkbox" 
                  checked={segmentationRules.newCustomer.enabled}
                  onChange={(e) => handleRuleChange('newCustomer', 'enabled', e.target.checked)}
                />
                <span className="toggle-slider small"></span>
              </label>
            </div>
            
            {segmentationRules.newCustomer.enabled && (
              <div className="rule-inputs">
                <div className="input-group">
                  <label>Máximo de dias desde cadastro:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.newCustomer.maxDays}
                    onChange={(e) => handleRuleChange('newCustomer', 'maxDays', parseInt(e.target.value))}
                    min="1"
                    max="365"
                  />
                </div>
                <div className="input-group">
                  <label>Máximo de pedidos:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.newCustomer.maxOrders}
                    onChange={(e) => handleRuleChange('newCustomer', 'maxOrders', parseInt(e.target.value))}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clientes Fiéis */}
          <div className="rule-card">
            <div className="rule-header">
              <span className="rule-icon">💎</span>
              <h4>Clientes Fiéis</h4>
              <label className="rule-toggle">
                <input 
                  type="checkbox" 
                  checked={segmentationRules.loyalCustomer.enabled}
                  onChange={(e) => handleRuleChange('loyalCustomer', 'enabled', e.target.checked)}
                />
                <span className="toggle-slider small"></span>
              </label>
            </div>
            
            {segmentationRules.loyalCustomer.enabled && (
              <div className="rule-inputs">
                <div className="input-group">
                  <label>Mínimo de pedidos:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.loyalCustomer.minOrders}
                    onChange={(e) => handleRuleChange('loyalCustomer', 'minOrders', parseInt(e.target.value))}
                    min="5"
                    max="100"
                  />
                </div>
                <div className="input-group">
                  <label>Mínimo de dias como cliente:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.loyalCustomer.minDays}
                    onChange={(e) => handleRuleChange('loyalCustomer', 'minDays', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clientes Inativos */}
          <div className="rule-card">
            <div className="rule-header">
              <span className="rule-icon">😴</span>
              <h4>Clientes Inativos</h4>
              <label className="rule-toggle">
                <input 
                  type="checkbox" 
                  checked={segmentationRules.inactiveCustomer.enabled}
                  onChange={(e) => handleRuleChange('inactiveCustomer', 'enabled', e.target.checked)}
                />
                <span className="toggle-slider small"></span>
              </label>
            </div>
            
            {segmentationRules.inactiveCustomer.enabled && (
              <div className="rule-inputs">
                <div className="input-group">
                  <label>Dias sem pedidos:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.inactiveCustomer.minDaysSinceLastOrder}
                    onChange={(e) => handleRuleChange('inactiveCustomer', 'minDaysSinceLastOrder', parseInt(e.target.value))}
                    min="30"
                    max="365"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Clientes VIP */}
          <div className="rule-card">
            <div className="rule-header">
              <span className="rule-icon">👑</span>
              <h4>Clientes VIP</h4>
              <label className="rule-toggle">
                <input 
                  type="checkbox" 
                  checked={segmentationRules.vipCustomer.enabled}
                  onChange={(e) => handleRuleChange('vipCustomer', 'enabled', e.target.checked)}
                />
                <span className="toggle-slider small"></span>
              </label>
            </div>
            
            {segmentationRules.vipCustomer.enabled && (
              <div className="rule-inputs">
                <div className="input-group">
                  <label>Valor mínimo gasto (R$):</label>
                  <input 
                    type="number" 
                    value={segmentationRules.vipCustomer.minTotalSpent}
                    onChange={(e) => handleRuleChange('vipCustomer', 'minTotalSpent', parseInt(e.target.value))}
                    min="100"
                    step="50"
                  />
                </div>
                <div className="input-group">
                  <label>Mínimo de pedidos:</label>
                  <input 
                    type="number" 
                    value={segmentationRules.vipCustomer.minOrders}
                    onChange={(e) => handleRuleChange('vipCustomer', 'minOrders', parseInt(e.target.value))}
                    min="10"
                    max="100"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dicas para Liza */}
      <div className="liza-tips">
        <h3>🤖 Dicas de Campanhas para Liza</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>🆕 Novos Clientes</h4>
            <p>Envie mensagens de boas-vindas, cupons de desconto para segunda compra e apresente os produtos mais populares.</p>
          </div>
          <div className="tip-card">
            <h4>💎 Clientes Fiéis</h4>
            <p>Ofereça benefícios exclusivos, programas de fidelidade, acesso antecipado a novos produtos e descontos especiais.</p>
          </div>
          <div className="tip-card">
            <h4>😴 Clientes Inativos</h4>
            <p>Campanhas de reativação com ofertas especiais, lembretes de produtos favoritos e pesquisas de satisfação.</p>
          </div>
          <div className="tip-card">
            <h4>👑 Clientes VIP</h4>
            <p>Atendimento personalizado, ofertas premium, convites para eventos exclusivos e produtos em pré-lançamento.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerSegmentation;