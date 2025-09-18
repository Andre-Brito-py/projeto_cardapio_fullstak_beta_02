import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import './TelegramManagement.css';

const TelegramManagement = () => {
  const [contacts, setContacts] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sendingMenu, setSendingMenu] = useState(false);
  const [sendingPromo, setSendingPromo] = useState(false);
  const [menuPreview, setMenuPreview] = useState('');
  const [promoMessage, setPromoMessage] = useState('');
  const [selectedContacts, setSelectedContacts] = useState([]);
  const [testMessage, setTestMessage] = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
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
  const [botConfig, setBotConfig] = useState({
    token: '',
    webhookUrl: '',
    adminChatId: '',
    isActive: false
  });
  const [savingConfig, setSavingConfig] = useState(false);
  const [testingBot, setTestingBot] = useState(false);
  const [showBotConfig, setShowBotConfig] = useState(false);

  const token = localStorage.getItem('token');
  const url = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4001';

  useEffect(() => {
    loadContacts();
    loadStats();
    loadMenuPreview();
    loadBotConfig();
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

  const loadStats = async () => {
    try {
      const response = await axios.get(`${url}/api/telegram/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const loadMenuPreview = async () => {
    try {
      const response = await axios.get(`${url}/api/telegram/menu-preview`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMenuPreview(response.data.preview);
    } catch (error) {
      console.error('Erro ao carregar preview do cardápio:', error);
    }
  };

  const loadBotConfig = async () => {
    try {
      const response = await axios.get(`${url}/api/telegram/bot-config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.config) {
        setBotConfig(response.data.config);
      }
    } catch (error) {
      console.error('Erro ao carregar configuração do bot:', error);
    }
  };

  const saveBotConfig = async () => {
    if (!botConfig.token.trim()) {
      toast.error('Token do bot é obrigatório');
      return;
    }

    try {
      setSavingConfig(true);
      const response = await axios.post(`${url}/api/telegram/bot-config`, botConfig, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Configuração salva com sucesso!');
        setShowBotConfig(false);
      } else {
        toast.error('Erro ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configuração do bot');
    } finally {
      setSavingConfig(false);
    }
  };

  const testBotConnection = async () => {
    if (!botConfig.token.trim()) {
      toast.error('Configure o token do bot primeiro');
      return;
    }

    try {
      setTestingBot(true);
      const response = await axios.post(`${url}/api/telegram/test-bot`, {
        token: botConfig.token
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`Bot conectado! Nome: ${response.data.botInfo.first_name}`);
      } else {
        toast.error('Erro ao conectar com o bot');
      }
    } catch (error) {
      console.error('Erro ao testar bot:', error);
      toast.error('Erro ao testar conexão do bot');
    } finally {
      setTestingBot(false);
    }
  };

  const sendMenuToContacts = async () => {
    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    try {
      setSendingMenu(true);
      const response = await axios.post(`${url}/api/telegram/send-menu`, {
        contacts: selectedContacts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`Cardápio enviado para ${response.data.sent} contatos`);
        setSelectedContacts([]);
        loadStats();
      } else {
        toast.error('Erro ao enviar cardápio');
      }
    } catch (error) {
      console.error('Erro ao enviar cardápio:', error);
      toast.error('Erro ao enviar cardápio');
    } finally {
      setSendingMenu(false);
    }
  };

  const sendPromoMessage = async () => {
    if (!promoMessage.trim()) {
      toast.error('Digite uma mensagem promocional');
      return;
    }

    if (selectedContacts.length === 0) {
      toast.error('Selecione pelo menos um contato');
      return;
    }

    try {
      setSendingPromo(true);
      const response = await axios.post(`${url}/api/telegram/send-promotional`, {
        message: promoMessage,
        contacts: selectedContacts
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success(`Mensagem enviada para ${response.data.sent} contatos`);
        setPromoMessage('');
        setSelectedContacts([]);
        loadStats();
      } else {
        toast.error('Erro ao enviar mensagem promocional');
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem promocional');
    } finally {
      setSendingPromo(false);
    }
  };

  const sendTestMessage = async () => {
    if (!testMessage.trim()) {
      toast.error('Digite uma mensagem de teste');
      return;
    }

    try {
      setSendingTest(true);
      const response = await axios.post(`${url}/api/telegram/test-admin-message`, {
        message: testMessage
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Mensagem de teste enviada para o admin');
        setTestMessage('');
      } else {
        toast.error('Erro ao enviar mensagem de teste');
      }
    } catch (error) {
      console.error('Erro ao enviar teste:', error);
      toast.error('Erro ao enviar mensagem de teste');
    } finally {
      setSendingTest(false);
    }
  };

  const toggleContactSelection = (chatId) => {
    setSelectedContacts(prev => 
      prev.includes(chatId) 
        ? prev.filter(id => id !== chatId)
        : [...prev, chatId]
    );
  };

  const selectAllContacts = () => {
    if (selectedContacts.length === contacts.length) {
      setSelectedContacts([]);
    } else {
      setSelectedContacts(contacts.map(contact => contact.chatId));
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
        tags: newContact.tags ? newContact.tags.split(',').map(tag => tag.trim()) : []
      };

      const response = await axios.post(`${url}/api/telegram/clients`, contactData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Contato adicionado com sucesso!');
        setNewContact({
          firstName: '',
          lastName: '',
          phoneNumber: '',
          username: '',
          notes: '',
          tags: '',
          acceptsPromotions: true
        });
        setShowAddContact(false);
        loadContacts();
      } else {
        toast.error(response.data.message || 'Erro ao adicionar contato');
      }
    } catch (error) {
      console.error('Erro ao adicionar contato:', error);
      toast.error('Erro ao adicionar contato');
    } finally {
      setAddingContact(false);
    }
  };

  const handleContactInputChange = (field, value) => {
    setNewContact(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="telegram-management">
      <div className="page-header">
        <h1>🤖 Gerenciamento do Telegram Bot</h1>
        <p>Gerencie contatos, envie cardápios e mensagens promocionais via Telegram</p>
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <h3>{stats.totalContacts}</h3>
                <p>Total de Contatos</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💬</div>
              <div className="stat-info">
                <h3>{stats.totalMessages}</h3>
                <p>Mensagens Enviadas</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-info">
                <h3>{stats.activeToday}</h3>
                <p>Ativos Hoje</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔄</div>
              <div className="stat-info">
                <h3>{stats.botStatus}</h3>
                <p>Status do Bot</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configuração do Bot */}
      <div className="config-section">
        <div className="section-header">
          <h2>⚙️ Configuração do Bot</h2>
          <button 
            className="config-btn"
            onClick={() => setShowBotConfig(!showBotConfig)}
          >
            {showBotConfig ? '🔼 Ocultar' : '🔽 Configurar Bot'}
          </button>
        </div>
        
        {showBotConfig && (
          <div className="config-content">
            <div className="config-grid">
              <div className="config-item">
                <label>🔑 Token do Bot *</label>
                <input
                  type="password"
                  value={botConfig.token}
                  onChange={(e) => setBotConfig({...botConfig, token: e.target.value})}
                  placeholder="Digite o token do bot do Telegram"
                  className="config-input"
                />
                <small>Obtenha o token conversando com @BotFather no Telegram</small>
              </div>
              
              <div className="config-item">
                <label>🌐 URL do Webhook</label>
                <input
                  type="url"
                  value={botConfig.webhookUrl}
                  onChange={(e) => setBotConfig({...botConfig, webhookUrl: e.target.value})}
                  placeholder="https://seudominio.com/api/telegram/webhook"
                  className="config-input"
                />
                <small>URL onde o Telegram enviará as mensagens</small>
              </div>
              
              <div className="config-item">
                <label>👤 Chat ID do Admin</label>
                <input
                  type="text"
                  value={botConfig.adminChatId}
                  onChange={(e) => setBotConfig({...botConfig, adminChatId: e.target.value})}
                  placeholder="123456789"
                  className="config-input"
                />
                <small>ID do chat do administrador para notificações</small>
              </div>
              
              <div className="config-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={botConfig.isActive}
                    onChange={(e) => setBotConfig({...botConfig, isActive: e.target.checked})}
                  />
                  <span>🟢 Bot Ativo</span>
                </label>
                <small>Ativar/desativar o bot do Telegram</small>
              </div>
            </div>
            
            <div className="config-actions">
              <button 
                className="test-btn"
                onClick={testBotConnection}
                disabled={testingBot || !botConfig.token.trim()}
              >
                {testingBot ? '🔄 Testando...' : '🧪 Testar Conexão'}
              </button>
              <button 
                className="save-btn"
                onClick={saveBotConfig}
                disabled={savingConfig || !botConfig.token.trim()}
              >
                {savingConfig ? '💾 Salvando...' : '💾 Salvar Configuração'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="management-grid">
        {/* Lista de Contatos */}
        <div className="contacts-section">
          <div className="section-header">
            <h2>📱 Contatos do Telegram</h2>
            <div className="contact-actions">
              <button 
                onClick={() => setShowAddContact(true)}
                className="add-contact-btn"
              >
                ➕ Adicionar Contato
              </button>
              <button 
                onClick={selectAllContacts}
                className="select-all-btn"
              >
                {selectedContacts.length === contacts.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
              </button>
              <button onClick={loadContacts} disabled={loading}>
                {loading ? '🔄' : '🔄'} Atualizar
              </button>
            </div>
          </div>

          <div className="contacts-list">
            {contacts.length === 0 ? (
              <div className="empty-state">
                <p>Nenhum contato encontrado</p>
                <small>Os contatos aparecerão aqui quando os usuários interagirem com o bot</small>
              </div>
            ) : (
              contacts.map(contact => (
                <div 
                  key={contact.chatId} 
                  className={`contact-item ${selectedContacts.includes(contact.chatId) ? 'selected' : ''}`}
                  onClick={() => toggleContactSelection(contact.chatId)}
                >
                  <div className="contact-info">
                    <div className="contact-name">
                      {contact.firstName} {contact.lastName}
                      {contact.username && <span className="username">@{contact.username}</span>}
                    </div>
                    <div className="contact-details">
                      <span className="chat-id">ID: {contact.chatId}</span>
                      <span className="last-seen">Último contato: {new Date(contact.lastInteraction).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="contact-status">
                    <span className={`status-badge ${contact.isActive ? 'active' : 'inactive'}`}>
                      {contact.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ações de Envio */}
        <div className="actions-section">
          {/* Teste de Mensagem */}
          <div className="action-card">
            <h3>🧪 Teste de Mensagem</h3>
            <p>Envie uma mensagem de teste para o chat do administrador</p>
            <div className="test-form">
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Digite sua mensagem de teste..."
                rows={3}
              />
              <button 
                onClick={sendTestMessage}
                disabled={sendingTest || !testMessage.trim()}
                className="test-btn"
              >
                {sendingTest ? 'Enviando...' : '📤 Enviar Teste'}
              </button>
            </div>
          </div>

          {/* Envio de Cardápio */}
          <div className="action-card">
            <h3>🍽️ Enviar Cardápio</h3>
            <p>Envie o cardápio atual para os contatos selecionados</p>
            
            <div className="menu-preview">
              <h4>Preview do Cardápio:</h4>
              <div className="preview-content">
                {menuPreview ? (
                  <pre>{menuPreview}</pre>
                ) : (
                  <p>Carregando preview...</p>
                )}
              </div>
            </div>

            <div className="send-actions">
              <p className="selected-count">
                {selectedContacts.length} contato(s) selecionado(s)
              </p>
              <button 
                onClick={sendMenuToContacts}
                disabled={sendingMenu || selectedContacts.length === 0}
                className="send-menu-btn"
              >
                {sendingMenu ? 'Enviando...' : '📤 Enviar Cardápio'}
              </button>
            </div>
          </div>

          {/* Mensagem Promocional */}
          <div className="action-card">
            <h3>📢 Mensagem Promocional</h3>
            <p>Envie uma mensagem promocional personalizada</p>
            
            <div className="promo-form">
              <textarea
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                placeholder="Digite sua mensagem promocional...\n\nExemplo:\n🎉 Promoção Especial!\n\n🍕 Pizza Grande por apenas R$ 25,00\n🚚 Entrega grátis para pedidos acima de R$ 30\n\n⏰ Válido até domingo!\n\n📱 Faça seu pedido: [link do seu site]"
                rows={6}
              />
              
              <div className="send-actions">
                <p className="selected-count">
                  {selectedContacts.length} contato(s) selecionado(s)
                </p>
                <button 
                  onClick={sendPromoMessage}
                  disabled={sendingPromo || selectedContacts.length === 0 || !promoMessage.trim()}
                  className="send-promo-btn"
                >
                  {sendingPromo ? 'Enviando...' : '📤 Enviar Promoção'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Informações e Dicas */}
      <div className="info-section">
        <h3>💡 Dicas de Uso</h3>
        <div className="tips-grid">
          <div className="tip-card">
            <h4>🤖 Bot Commands</h4>
            <ul>
              <li><code>/start</code> - Iniciar conversa</li>
              <li><code>/menu</code> - Ver cardápio</li>
              <li><code>/help</code> - Ajuda</li>
              <li><code>/pedido</code> - Fazer pedido</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>📱 Configuração</h4>
            <ul>
              <li>Configure o webhook nas APIs</li>
              <li>Defina usuários permitidos</li>
              <li>Configure o chat ID do admin</li>
              <li>Teste a conexão regularmente</li>
            </ul>
          </div>
          <div className="tip-card">
            <h4>📊 Melhores Práticas</h4>
            <ul>
              <li>Envie promoções em horários estratégicos</li>
              <li>Personalize mensagens por segmento</li>
              <li>Monitore as estatísticas regularmente</li>
              <li>Mantenha o cardápio sempre atualizado</li>
            </ul>
          </div>
        </div>
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
                  placeholder="Sobrenome do contato"
                />
              </div>
              
              <div className="form-group">
                <label>Telefone *</label>
                <input
                  type="tel"
                  value={newContact.phoneNumber}
                  onChange={(e) => handleContactInputChange('phoneNumber', e.target.value)}
                  placeholder="Ex: +5511999999999 ou 11999999999"
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Username do Telegram</label>
                <input
                  type="text"
                  value={newContact.username}
                  onChange={(e) => handleContactInputChange('username', e.target.value)}
                  placeholder="@username (sem o @)"
                />
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

export default TelegramManagement;