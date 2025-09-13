import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './TelegramCampaigns.css';

const TelegramCampaigns = ({ url, token }) => {
  const [campaigns, setCampaigns] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [filterTag, setFilterTag] = useState('');
  const [newCampaign, setNewCampaign] = useState({
    title: '',
    message: '',
    targetTags: [],
    scheduledFor: '',
    includeMenu: false
  });
  const [creatingCampaign, setCreatingCampaign] = useState(false);
  const [sendingCampaign, setSendingCampaign] = useState(null);

  useEffect(() => {
    loadCampaigns();
    loadContacts();
  }, []);

  const loadCampaigns = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/telegram/campaigns`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCampaigns(response.data.campaigns || []);
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const loadContacts = async () => {
    try {
      const response = await axios.get(`${url}/api/telegram/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
    }
  };

  const createCampaign = async () => {
    if (!newCampaign.title.trim() || !newCampaign.message.trim()) {
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    if (selectedContacts.length === 0 && newCampaign.targetTags.length === 0) {
      toast.error('Selecione contatos ou tags para a campanha');
      return;
    }

    try {
      setCreatingCampaign(true);
      const campaignData = {
        ...newCampaign,
        targetContacts: selectedContacts,
        scheduledFor: newCampaign.scheduledFor || null
      };

      await axios.post(`${url}/api/telegram/campaigns`, campaignData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Campanha criada com sucesso!');
      setShowCreateCampaign(false);
      resetCampaignForm();
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao criar campanha:', error);
      toast.error('Erro ao criar campanha');
    } finally {
      setCreatingCampaign(false);
    }
  };

  const sendCampaign = async (campaignId) => {
    if (!window.confirm('Tem certeza que deseja enviar esta campanha?')) {
      return;
    }

    try {
      setSendingCampaign(campaignId);
      await axios.post(`${url}/api/telegram/campaigns/${campaignId}/send`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campanha enviada com sucesso!');
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao enviar campanha:', error);
      toast.error('Erro ao enviar campanha');
    } finally {
      setSendingCampaign(null);
    }
  };

  const deleteCampaign = async (campaignId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta campanha?')) {
      return;
    }

    try {
      await axios.delete(`${url}/api/telegram/campaigns/${campaignId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Campanha excluída com sucesso!');
      loadCampaigns();
    } catch (error) {
      console.error('Erro ao excluir campanha:', error);
      toast.error('Erro ao excluir campanha');
    }
  };

  const resetCampaignForm = () => {
    setNewCampaign({
      title: '',
      message: '',
      targetTags: [],
      scheduledFor: '',
      includeMenu: false
    });
    setSelectedContacts([]);
  };

  const handleCampaignInputChange = (field, value) => {
    setNewCampaign(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const toggleTagSelection = (tag) => {
    setNewCampaign(prev => ({
      ...prev,
      targetTags: prev.targetTags.includes(tag)
        ? prev.targetTags.filter(t => t !== tag)
        : [...prev.targetTags, tag]
    }));
  };

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    if (!filterTag) return true;
    return contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase()));
  });

  // Obter todas as tags únicas
  const allTags = [...new Set(contacts.flatMap(contact => contact.tags || []))];

  const getStatusBadge = (status) => {
    const statusMap = {
      'draft': { label: 'Rascunho', class: 'draft' },
      'scheduled': { label: 'Agendada', class: 'scheduled' },
      'sending': { label: 'Enviando', class: 'sending' },
      'sent': { label: 'Enviada', class: 'sent' },
      'failed': { label: 'Falhou', class: 'failed' }
    };
    return statusMap[status] || { label: status, class: 'unknown' };
  };

  return (
    <div className="telegram-campaigns">
      <div className="page-header">
        <h1>📢 Campanhas do Telegram</h1>
        <p>Crie e gerencie campanhas de mensagens para seus contatos</p>
      </div>

      {/* Toolbar */}
      <div className="campaigns-toolbar">
        <div className="toolbar-info">
          <span className="campaign-count">{campaigns.length} campanhas</span>
        </div>
        <button
          onClick={() => setShowCreateCampaign(true)}
          className="create-campaign-btn"
        >
          ➕ Nova Campanha
        </button>
      </div>

      {/* Lista de Campanhas */}
      <div className="campaigns-container">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Carregando campanhas...</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="empty-state">
            <p>📢 Nenhuma campanha encontrada</p>
            <small>Crie sua primeira campanha para começar</small>
          </div>
        ) : (
          <div className="campaigns-grid">
            {campaigns.map(campaign => {
              const statusInfo = getStatusBadge(campaign.status);
              return (
                <div key={campaign._id} className="campaign-card">
                  <div className="campaign-header">
                    <h3 className="campaign-title">{campaign.title}</h3>
                    <div className="campaign-actions">
                      {campaign.status === 'draft' && (
                        <button
                          onClick={() => sendCampaign(campaign._id)}
                          className="send-btn"
                          disabled={sendingCampaign === campaign._id}
                        >
                          {sendingCampaign === campaign._id ? '📤 Enviando...' : '📤 Enviar'}
                        </button>
                      )}
                      <button
                        onClick={() => deleteCampaign(campaign._id)}
                        className="delete-btn"
                        title="Excluir campanha"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                  
                  <div className="campaign-content">
                    <p className="campaign-message">{campaign.message}</p>
                    
                    {campaign.includeMenu && (
                      <div className="menu-indicator">
                        🍽️ Inclui cardápio
                      </div>
                    )}
                  </div>
                  
                  <div className="campaign-meta">
                    <div className="campaign-targets">
                      <span className="target-count">
                        🎯 {campaign.stats?.totalTargeted || 0} destinatários
                      </span>
                      {campaign.targetTags && campaign.targetTags.length > 0 && (
                        <div className="target-tags">
                          {campaign.targetTags.map(tag => (
                            <span key={tag} className="tag">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="campaign-status">
                      <span className={`status-badge ${statusInfo.class}`}>
                        {statusInfo.label}
                      </span>
                      {campaign.scheduledFor && (
                        <span className="scheduled-time">
                          📅 {new Date(campaign.scheduledFor).toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {campaign.stats && campaign.status === 'sent' && (
                    <div className="campaign-stats">
                      <div className="stat-item">
                        <span className="stat-number">{campaign.stats.totalSent}</span>
                        <span className="stat-label">Enviadas</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">{campaign.stats.totalFailed}</span>
                        <span className="stat-label">Falharam</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-number">
                          {Math.round((campaign.stats.totalSent / campaign.stats.totalTargeted) * 100)}%
                        </span>
                        <span className="stat-label">Taxa de Sucesso</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="campaign-footer">
                    <span className="creation-date">
                      Criada em {new Date(campaign.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para Criar Campanha */}
      {showCreateCampaign && (
        <div className="modal-overlay" onClick={() => setShowCreateCampaign(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📢 Nova Campanha</h3>
              <button 
                className="close-btn"
                onClick={() => setShowCreateCampaign(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-section">
                <h4>Informações da Campanha</h4>
                
                <div className="form-group">
                  <label>Título da Campanha *</label>
                  <input
                    type="text"
                    value={newCampaign.title}
                    onChange={(e) => handleCampaignInputChange('title', e.target.value)}
                    placeholder="Ex: Promoção de Fim de Semana"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>Mensagem *</label>
                  <textarea
                    value={newCampaign.message}
                    onChange={(e) => handleCampaignInputChange('message', e.target.value)}
                    placeholder="Digite a mensagem da campanha..."
                    rows={4}
                    required
                  />
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Agendar para (opcional)</label>
                    <input
                      type="datetime-local"
                      value={newCampaign.scheduledFor}
                      onChange={(e) => handleCampaignInputChange('scheduledFor', e.target.value)}
                    />
                  </div>
                  
                  <div className="form-group checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={newCampaign.includeMenu}
                        onChange={(e) => handleCampaignInputChange('includeMenu', e.target.checked)}
                      />
                      <span>🍽️ Incluir cardápio na mensagem</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="form-section">
                <h4>Segmentação por Tags</h4>
                <p className="section-description">Selecione as tags para segmentar sua campanha</p>
                
                <div className="tags-grid">
                  {allTags.map(tag => (
                    <label key={tag} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={newCampaign.targetTags.includes(tag)}
                        onChange={() => toggleTagSelection(tag)}
                      />
                      <span className="tag-label">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-section">
                <h4>Seleção Manual de Contatos</h4>
                <p className="section-description">Ou selecione contatos específicos</p>
                
                <div className="contacts-filter">
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="filter-select"
                  >
                    <option value="">Todos os contatos</option>
                    {allTags.map(tag => (
                      <option key={tag} value={tag}>{tag}</option>
                    ))}
                  </select>
                </div>
                
                <div className="contacts-selection">
                  {filteredContacts.map(contact => (
                    <label key={contact._id} className="contact-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact._id)}
                        onChange={() => toggleContactSelection(contact._id)}
                      />
                      <div className="contact-info">
                        <span className="contact-name">
                          {contact.firstName} {contact.lastName}
                        </span>
                        {contact.username && (
                          <span className="contact-username">@{contact.username}</span>
                        )}
                        {contact.tags && contact.tags.length > 0 && (
                          <div className="contact-tags">
                            {contact.tags.map(tag => (
                              <span key={tag} className="mini-tag">{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="campaign-summary">
                <h4>Resumo da Campanha</h4>
                <div className="summary-stats">
                  <div className="summary-item">
                    <span className="summary-number">
                      {newCampaign.targetTags.length > 0 
                        ? contacts.filter(c => c.tags && c.tags.some(tag => newCampaign.targetTags.includes(tag))).length
                        : selectedContacts.length
                      }
                    </span>
                    <span className="summary-label">Destinatários</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">{newCampaign.targetTags.length}</span>
                    <span className="summary-label">Tags Selecionadas</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-number">{selectedContacts.length}</span>
                    <span className="summary-label">Contatos Manuais</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowCreateCampaign(false)}
                disabled={creatingCampaign}
              >
                Cancelar
              </button>
              <button 
                className="save-btn"
                onClick={createCampaign}
                disabled={creatingCampaign || !newCampaign.title.trim() || !newCampaign.message.trim()}
              >
                {creatingCampaign ? 'Criando...' : 'Criar Campanha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramCampaigns;