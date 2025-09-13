import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './TelegramContacts.css';

const TelegramContacts = ({ url, token }) => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [newContact, setNewContact] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    username: '',
    notes: '',
    tags: '',
    acceptsPromotions: true
  });
  const [addingContact, setAddingContact] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/telegram/contacts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContacts(response.data.contacts || []);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      toast.error('Erro ao carregar contatos do Telegram');
    } finally {
      setLoading(false);
    }
  };

  const addContact = async () => {
    if (!newContact.firstName.trim() || !newContact.phoneNumber.trim()) {
      toast.error('Nome e telefone são obrigatórios');
      return;
    }

    try {
      setAddingContact(true);
      const contactData = {
        ...newContact,
        tags: newContact.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      await axios.post(`${url}/api/telegram/contacts`, contactData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Contato adicionado com sucesso!');
      setShowAddContact(false);
      setNewContact({
        firstName: '',
        lastName: '',
        phoneNumber: '',
        username: '',
        notes: '',
        tags: '',
        acceptsPromotions: true
      });
      loadContacts();
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      toast.error('Erro ao adicionar contato');
    } finally {
      setAddingContact(false);
    }
  };

  const deleteContact = async (contactId) => {
    if (!window.confirm('Tem certeza que deseja excluir este contato?')) {
      return;
    }

    try {
      await axios.delete(`${url}/api/telegram/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Contato excluído com sucesso!');
      loadContacts();
    } catch (error) {
      console.error('Erro ao excluir contato:', error);
      toast.error('Erro ao excluir contato');
    }
  };

  const toggleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === filteredContacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(filteredContacts.map(contact => contact._id));
    }
  };

  const handleContactInputChange = (field, value) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = !searchTerm || 
      contact.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.username?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTag = !filterTag || 
      (contact.tags && contact.tags.some(tag => tag.toLowerCase().includes(filterTag.toLowerCase())));
    
    return matchesSearch && matchesTag;
  });

  // Obter todas as tags únicas
  const allTags = [...new Set(contacts.flatMap(contact => contact.tags || []))];

  return (
    <div className="telegram-contacts">
      <div className="page-header">
        <h1>📱 Contatos do Telegram</h1>
        <p>Gerencie seus contatos do Telegram para campanhas e mensagens</p>
      </div>

      {/* Filtros e Ações */}
      <div className="contacts-toolbar">
        <div className="search-filters">
          <input
            type="text"
            placeholder="Buscar contatos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="filter-select"
          >
            <option value="">Todas as tags</option>
            {allTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>
        <div className="toolbar-actions">
          <button
            onClick={selectAllContacts}
            className="select-all-btn"
          >
            {selectedContacts.length === filteredContacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </button>
          <button
            onClick={() => setShowAddContact(true)}
            className="add-contact-btn"
          >
            ➕ Adicionar Contato
          </button>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="contacts-stats">
        <div className="stat-item">
          <span className="stat-number">{contacts.length}</span>
          <span className="stat-label">Total de Contatos</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{selectedContacts.length}</span>
          <span className="stat-label">Selecionados</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{contacts.filter(c => c.isActive).length}</span>
          <span className="stat-label">Ativos</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{contacts.filter(c => c.acceptsPromotions).length}</span>
          <span className="stat-label">Aceitam Promoções</span>
        </div>
      </div>

      {/* Lista de Contatos */}
      <div className="contacts-container">
        {loading ? (
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Carregando contatos...</p>
          </div>
        ) : filteredContacts.length === 0 ? (
          <div className="empty-state">
            <p>📱 Nenhum contato encontrado</p>
            <small>Adicione contatos para começar a enviar mensagens</small>
          </div>
        ) : (
          <div className="contacts-grid">
            {filteredContacts.map(contact => (
              <div 
                key={contact._id} 
                className={`contact-card ${selectedContacts.includes(contact._id) ? 'selected' : ''}`}
                onClick={() => toggleContactSelection(contact._id)}
              >
                <div className="contact-header">
                  <div className="contact-avatar">
                    {contact.firstName.charAt(0).toUpperCase()}
                  </div>
                  <div className="contact-info">
                    <h3 className="contact-name">
                      {contact.firstName} {contact.lastName}
                      {contact.username && <span className="username">@{contact.username}</span>}
                    </h3>
                    <p className="contact-phone">{contact.phoneNumber}</p>
                  </div>
                  <div className="contact-actions">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteContact(contact._id);
                      }}
                      className="delete-btn"
                      title="Excluir contato"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
                
                <div className="contact-details">
                  {contact.tags && contact.tags.length > 0 && (
                    <div className="contact-tags">
                      {contact.tags.map(tag => (
                        <span key={tag} className="tag">{tag}</span>
                      ))}
                    </div>
                  )}
                  
                  {contact.notes && (
                    <p className="contact-notes">{contact.notes}</p>
                  )}
                  
                  <div className="contact-meta">
                    <span className={`status-badge ${contact.isActive ? 'active' : 'inactive'}`}>
                      {contact.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                    {contact.acceptsPromotions && (
                      <span className="promo-badge">📢 Aceita Promoções</span>
                    )}
                    <span className="last-interaction">
                      Último contato: {new Date(contact.lastInteraction || contact.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para Adicionar Contato */}
      {showAddContact && (
        <div className="modal-overlay" onClick={() => setShowAddContact(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>➕ Adicionar Novo Contato</h3>
              <button 
                className="close-btn"
                onClick={() => setShowAddContact(false)}
              >
                ✕
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={newContact.firstName}
                    onChange={(e) => handleContactInputChange('firstName', e.target.value)}
                    placeholder="Nome do contato"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sobrenome</label>
                  <input
                    type="text"
                    value={newContact.lastName}
                    onChange={(e) => handleContactInputChange('lastName', e.target.value)}
                    placeholder="Sobrenome"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Telefone *</label>
                  <input
                    type="tel"
                    value={newContact.phoneNumber}
                    onChange={(e) => handleContactInputChange('phoneNumber', e.target.value)}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Username do Telegram</label>
                  <input
                    type="text"
                    value={newContact.username}
                    onChange={(e) => handleContactInputChange('username', e.target.value)}
                    placeholder="username (sem @)"
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label>Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={newContact.tags}
                  onChange={(e) => handleContactInputChange('tags', e.target.value)}
                  placeholder="Ex: vip, cliente-frequente, promocoes"
                />
              </div>
              
              <div className="form-group">
                <label>Observações</label>
                <textarea
                  value={newContact.notes}
                  onChange={(e) => handleContactInputChange('notes', e.target.value)}
                  placeholder="Observações sobre o contato..."
                  rows={3}
                />
              </div>
              
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newContact.acceptsPromotions}
                    onChange={(e) => handleContactInputChange('acceptsPromotions', e.target.checked)}
                  />
                  <span>Aceita receber mensagens promocionais</span>
                </label>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowAddContact(false)}
                disabled={addingContact}
              >
                Cancelar
              </button>
              <button 
                className="save-btn"
                onClick={addContact}
                disabled={addingContact || !newContact.firstName.trim() || !newContact.phoneNumber.trim()}
              >
                {addingContact ? 'Salvando...' : 'Salvar Contato'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramContacts;