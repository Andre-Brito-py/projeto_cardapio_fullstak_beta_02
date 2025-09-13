import React, { useState, useEffect } from 'react';
import './TelegramMessages.css';

const TelegramMessages = () => {
  const [messages, setMessages] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [messageForm, setMessageForm] = useState({
    type: 'text', // text, menu, promotional
    title: '',
    content: '',
    menuId: '',
    scheduledFor: '',
    tags: [],
    includeMenu: false
  });
  const [availableTags, setAvailableTags] = useState([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [messagesRes, contactsRes, menusRes, tagsRes] = await Promise.all([
        fetch('/api/telegram/messages', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/telegram/contacts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/menus', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/telegram/tags', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (messagesRes.ok) {
        const messagesData = await messagesRes.json();
        setMessages(messagesData.messages || []);
      }

      if (contactsRes.ok) {
        const contactsData = await contactsRes.json();
        setContacts(contactsData.contacts || []);
      }

      if (menusRes.ok) {
        const menusData = await menusRes.json();
        setMenus(menusData.menus || []);
      }

      if (tagsRes.ok) {
        const tagsData = await tagsRes.json();
        setAvailableTags(tagsData.tags || []);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!messageForm.content.trim() || selectedContacts.length === 0) {
      alert('Preencha a mensagem e selecione pelo menos um contato');
      return;
    }

    try {
      setSending(true);
      const token = localStorage.getItem('token');
      
      const messageData = {
        ...messageForm,
        contacts: selectedContacts,
        scheduledFor: messageForm.scheduledFor || null
      };

      const response = await fetch('/api/telegram/send-message', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(messageData)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Mensagem ${messageForm.scheduledFor ? 'agendada' : 'enviada'} com sucesso!`);
        setShowModal(false);
        resetForm();
        loadData();
      } else {
        const error = await response.json();
        alert(`Erro ao enviar mensagem: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const resetForm = () => {
    setMessageForm({
      type: 'text',
      title: '',
      content: '',
      menuId: '',
      scheduledFor: '',
      tags: [],
      includeMenu: false
    });
    setSelectedContacts([]);
  };

  const handleContactSelection = (contactId) => {
    setSelectedContacts(prev => 
      prev.includes(contactId)
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  const selectContactsByTag = (tag) => {
    const contactsWithTag = contacts.filter(contact => 
      contact.tags && contact.tags.includes(tag)
    );
    const contactIds = contactsWithTag.map(contact => contact._id);
    setSelectedContacts(prev => {
      const newSelection = [...new Set([...prev, ...contactIds])];
      return newSelection;
    });
  };

  const getMessageTypeIcon = (type) => {
    switch (type) {
      case 'menu': return '🍽️';
      case 'promotional': return '🎉';
      default: return '💬';
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'sent': { label: 'Enviada', class: 'sent' },
      'scheduled': { label: 'Agendada', class: 'scheduled' },
      'sending': { label: 'Enviando', class: 'sending' },
      'failed': { label: 'Falhou', class: 'failed' },
      'draft': { label: 'Rascunho', class: 'draft' }
    };
    
    const badge = badges[status] || { label: status, class: 'draft' };
    return <span className={`status-badge ${badge.class}`}>{badge.label}</span>;
  };

  const generateMenuMessage = (menu) => {
    if (!menu) return '';
    
    let message = `🍽️ *${menu.name}*\n\n`;
    
    if (menu.description) {
      message += `${menu.description}\n\n`;
    }
    
    if (menu.categories && menu.categories.length > 0) {
      menu.categories.forEach(category => {
        message += `📂 *${category.name}*\n`;
        if (category.items && category.items.length > 0) {
          category.items.forEach(item => {
            message += `• ${item.name}`;
            if (item.price) {
              message += ` - R$ ${item.price.toFixed(2)}`;
            }
            message += '\n';
          });
        }
        message += '\n';
      });
    }
    
    message += '📞 Faça seu pedido agora!';
    return message;
  };

  if (loading) {
    return (
      <div className="telegram-messages">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando mensagens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="telegram-messages">
      {/* Header */}
      <div className="page-header">
        <h1>💬 Mensagens do Telegram</h1>
        <p>Envie mensagens promocionais e cardápios para seus contatos</p>
      </div>

      {/* Toolbar */}
      <div className="messages-toolbar">
        <div className="toolbar-info">
          <span className="message-count">
            {messages.length} mensagem{messages.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button 
          className="new-message-btn"
          onClick={() => setShowModal(true)}
        >
          ✉️ Nova Mensagem
        </button>
      </div>

      {/* Lista de Mensagens */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <p>📭 Nenhuma mensagem enviada ainda</p>
            <small>Clique em "Nova Mensagem" para começar</small>
          </div>
        ) : (
          <div className="messages-list">
            {messages.map((message) => (
              <div key={message._id} className="message-card">
                <div className="message-header">
                  <div className="message-type">
                    <span className="type-icon">{getMessageTypeIcon(message.type)}</span>
                    <span className="type-label">{message.type}</span>
                  </div>
                  <div className="message-status">
                    {getStatusBadge(message.status)}
                  </div>
                </div>
                
                <div className="message-content">
                  {message.title && (
                    <h3 className="message-title">{message.title}</h3>
                  )}
                  <p className="message-text">{message.content}</p>
                  
                  {message.menuId && (
                    <div className="menu-attachment">
                      <span className="menu-icon">🍽️</span>
                      <span>Cardápio anexado</span>
                    </div>
                  )}
                </div>
                
                <div className="message-meta">
                  <div className="message-stats">
                    <div className="stat-item">
                      <span className="stat-number">{message.recipientCount || 0}</span>
                      <span className="stat-label">Destinatários</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{message.deliveredCount || 0}</span>
                      <span className="stat-label">Entregues</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-number">{message.readCount || 0}</span>
                      <span className="stat-label">Lidas</span>
                    </div>
                  </div>
                  
                  <div className="message-date">
                    {message.scheduledFor ? (
                      <span>📅 Agendada para: {new Date(message.scheduledFor).toLocaleString()}</span>
                    ) : (
                      <span>📤 Enviada em: {new Date(message.createdAt).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Nova Mensagem */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h3>✉️ Nova Mensagem</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              {/* Tipo de Mensagem */}
              <div className="form-section">
                <h4>📝 Tipo de Mensagem</h4>
                <div className="message-types">
                  <label className={`type-option ${messageForm.type === 'text' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="messageType" 
                      value="text"
                      checked={messageForm.type === 'text'}
                      onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                    />
                    <span className="type-icon">💬</span>
                    <span className="type-name">Texto Simples</span>
                  </label>
                  
                  <label className={`type-option ${messageForm.type === 'promotional' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="messageType" 
                      value="promotional"
                      checked={messageForm.type === 'promotional'}
                      onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                    />
                    <span className="type-icon">🎉</span>
                    <span className="type-name">Promocional</span>
                  </label>
                  
                  <label className={`type-option ${messageForm.type === 'menu' ? 'active' : ''}`}>
                    <input 
                      type="radio" 
                      name="messageType" 
                      value="menu"
                      checked={messageForm.type === 'menu'}
                      onChange={(e) => setMessageForm({...messageForm, type: e.target.value})}
                    />
                    <span className="type-icon">🍽️</span>
                    <span className="type-name">Cardápio</span>
                  </label>
                </div>
              </div>

              {/* Conteúdo da Mensagem */}
              <div className="form-section">
                <h4>✏️ Conteúdo</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Título (opcional)</label>
                    <input 
                      type="text"
                      value={messageForm.title}
                      onChange={(e) => setMessageForm({...messageForm, title: e.target.value})}
                      placeholder="Título da mensagem"
                    />
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Mensagem *</label>
                  <textarea 
                    value={messageForm.content}
                    onChange={(e) => setMessageForm({...messageForm, content: e.target.value})}
                    placeholder="Digite sua mensagem aqui..."
                    rows={6}
                  />
                </div>
                
                {messageForm.type === 'menu' && (
                  <div className="form-group">
                    <label>Cardápio</label>
                    <select 
                      value={messageForm.menuId}
                      onChange={(e) => {
                        const selectedMenu = menus.find(m => m._id === e.target.value);
                        setMessageForm({
                          ...messageForm, 
                          menuId: e.target.value,
                          content: selectedMenu ? generateMenuMessage(selectedMenu) : messageForm.content
                        });
                      }}
                    >
                      <option value="">Selecione um cardápio</option>
                      {menus.map(menu => (
                        <option key={menu._id} value={menu._id}>{menu.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Seleção de Destinatários */}
              <div className="form-section">
                <h4>👥 Destinatários ({selectedContacts.length} selecionados)</h4>
                
                {/* Seleção por Tags */}
                <div className="tags-selection">
                  <label>Selecionar por tags:</label>
                  <div className="tags-grid">
                    {availableTags.map(tag => (
                      <button 
                        key={tag}
                        type="button"
                        className="tag-select-btn"
                        onClick={() => selectContactsByTag(tag)}
                      >
                        🏷️ {tag}
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Lista de Contatos */}
                <div className="contacts-selection">
                  <div className="contacts-header">
                    <label>
                      <input 
                        type="checkbox"
                        checked={selectedContacts.length === contacts.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedContacts(contacts.map(c => c._id));
                          } else {
                            setSelectedContacts([]);
                          }
                        }}
                      />
                      Selecionar todos ({contacts.length})
                    </label>
                  </div>
                  
                  <div className="contacts-list">
                    {contacts.map(contact => (
                      <label key={contact._id} className="contact-checkbox">
                        <input 
                          type="checkbox"
                          checked={selectedContacts.includes(contact._id)}
                          onChange={() => handleContactSelection(contact._id)}
                        />
                        <div className="contact-info">
                          <div className="contact-name">
                            {contact.firstName} {contact.lastName}
                            {contact.username && (
                              <span className="contact-username">@{contact.username}</span>
                            )}
                          </div>
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
              </div>

              {/* Agendamento */}
              <div className="form-section">
                <h4>⏰ Agendamento (opcional)</h4>
                <div className="form-group">
                  <label>Data e hora para envio</label>
                  <input 
                    type="datetime-local"
                    value={messageForm.scheduledFor}
                    onChange={(e) => setMessageForm({...messageForm, scheduledFor: e.target.value})}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="cancel-btn"
                onClick={() => setShowModal(false)}
                disabled={sending}
              >
                Cancelar
              </button>
              <button 
                className="send-btn"
                onClick={handleSendMessage}
                disabled={sending || !messageForm.content.trim() || selectedContacts.length === 0}
              >
                {sending ? (
                  <>⏳ Enviando...</>
                ) : messageForm.scheduledFor ? (
                  <>📅 Agendar Mensagem</>
                ) : (
                  <>📤 Enviar Agora</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TelegramMessages;