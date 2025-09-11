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

  const token = localStorage.getItem('token');
  const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    loadContacts();
    loadStats();
    loadMenuPreview();
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

      <div className="management-grid">
        {/* Lista de Contatos */}
        <div className="contacts-section">
          <div className="section-header">
            <h2>📱 Contatos do Telegram</h2>
            <div className="contact-actions">
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
    </div>
  );
};

export default TelegramManagement;