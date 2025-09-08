import React, { useState, useEffect } from 'react';
import './WhatsAppMessages.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const WhatsAppMessages = ({ url }) => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalConversations: 0,
    messagesProcessedByLisa: 0,
    averageResponseTime: 0
  });
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');

  // Buscar conversas ativas
  const fetchConversations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${url}/api/whatsapp/conversations`, {
        params: {
          search: searchTerm,
          date: dateFilter
        }
      });
      if (response.data.success) {
        setConversations(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar conversas:', error);
      toast.error('Erro ao carregar conversas');
    } finally {
      setLoading(false);
    }
  };

  // Buscar mensagens de uma conversa
  const fetchMessages = async (customerPhone) => {
    try {
      setLoadingMessages(true);
      const response = await axios.get(`${url}/api/whatsapp/messages/${customerPhone}`);
      if (response.data.success) {
        setMessages(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
      toast.error('Erro ao carregar mensagens');
    } finally {
      setLoadingMessages(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const response = await axios.get(`${url}/api/whatsapp/stats`);
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Enviar mensagem
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSendingMessage(true);
      const response = await axios.post(`${url}/api/whatsapp/send`, {
        to: selectedConversation.customerPhone,
        message: newMessage
      });
      
      if (response.data.success) {
        setNewMessage('');
        toast.success('Mensagem enviada com sucesso!');
        // Recarregar mensagens
        await fetchMessages(selectedConversation.customerPhone);
      }
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSendingMessage(false);
    }
  };

  // Selecionar conversa
  const selectConversation = (conversation) => {
    setSelectedConversation(conversation);
    fetchMessages(conversation.customerPhone);
  };

  // Formatar data
  const formatDate = (date) => {
    return new Date(date).toLocaleString('pt-BR');
  };

  // Formatar telefone
  const formatPhone = (phone) => {
    return phone.replace(/^55/, '+55 ');
  };

  useEffect(() => {
    fetchConversations();
    fetchStats();
  }, [searchTerm, dateFilter]);

  return (
    <div className="whatsapp-messages">
      <div className="messages-header">
        <h2>Conversas do WhatsApp</h2>
        <p>Gerencie e acompanhe as conversas do WhatsApp Business</p>
      </div>

      {/* Estatísticas */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">💬</div>
          <div className="stat-info">
            <h3>{stats.totalMessages}</h3>
            <p>Total de Mensagens</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <h3>{stats.totalConversations}</h3>
            <p>Conversas Ativas</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🤖</div>
          <div className="stat-info">
            <h3>{stats.messagesProcessedByLisa}</h3>
            <p>Processadas pela Lisa</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱️</div>
          <div className="stat-info">
            <h3>{stats.averageResponseTime}s</h3>
            <p>Tempo Médio de Resposta</p>
          </div>
        </div>
      </div>

      <div className="messages-container">
        {/* Lista de Conversas */}
        <div className="conversations-panel">
          <div className="panel-header">
            <h3>Conversas</h3>
            <div className="filters">
              <input
                type="text"
                placeholder="Buscar por telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="date-filter"
              >
                <option value="today">Hoje</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mês</option>
                <option value="all">Todas</option>
              </select>
            </div>
          </div>

          <div className="conversations-list">
            {loading ? (
              <div className="loading">Carregando conversas...</div>
            ) : conversations.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma conversa encontrada</p>
              </div>
            ) : (
              conversations.map((conversation) => (
                <div
                  key={conversation._id}
                  className={`conversation-item ${
                    selectedConversation?._id === conversation._id ? 'active' : ''
                  }`}
                  onClick={() => selectConversation(conversation.lastMessage)}
                >
                  <div className="conversation-avatar">
                    <span>{conversation.lastMessage.customerName?.[0] || '👤'}</span>
                  </div>
                  <div className="conversation-info">
                    <div className="conversation-header">
                      <h4>{conversation.lastMessage.customerName || 'Cliente'}</h4>
                      <span className="conversation-time">
                        {formatDate(conversation.lastMessage.timestamp)}
                      </span>
                    </div>
                    <p className="conversation-phone">
                      {formatPhone(conversation.lastMessage.customerPhone)}
                    </p>
                    <p className="conversation-preview">
                      {conversation.lastMessage.content.text || '[Mídia]'}
                    </p>
                    <div className="conversation-meta">
                      <span className="message-count">{conversation.messageCount} mensagens</span>
                      {conversation.lastMessage.processedByLisa && (
                        <span className="lisa-badge">Lisa</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel de Mensagens */}
        <div className="messages-panel">
          {selectedConversation ? (
            <>
              <div className="panel-header">
                <div className="conversation-details">
                  <h3>{selectedConversation.customerName || 'Cliente'}</h3>
                  <p>{formatPhone(selectedConversation.customerPhone)}</p>
                </div>
              </div>

              <div className="messages-list">
                {loadingMessages ? (
                  <div className="loading">Carregando mensagens...</div>
                ) : messages.length === 0 ? (
                  <div className="empty-state">
                    <p>Nenhuma mensagem encontrada</p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message._id}
                      className={`message-item ${message.direction}`}
                    >
                      <div className="message-content">
                        <p>{message.content.text || '[Mídia não suportada]'}</p>
                        <div className="message-meta">
                          <span className="message-time">
                            {formatDate(message.timestamp)}
                          </span>
                          {message.processedByLisa && (
                            <span className="lisa-indicator">🤖</span>
                          )}
                          {message.direction === 'outbound' && (
                            <span className="message-status">✓</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Formulário de Envio */}
              <form onSubmit={sendMessage} className="message-form">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="message-input"
                  disabled={sendingMessage}
                />
                <button
                  type="submit"
                  className="send-button"
                  disabled={sendingMessage || !newMessage.trim()}
                >
                  {sendingMessage ? '📤' : '➤'}
                </button>
              </form>
            </>
          ) : (
            <div className="no-conversation">
              <div className="no-conversation-content">
                <h3>Selecione uma conversa</h3>
                <p>Escolha uma conversa da lista para ver as mensagens</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WhatsAppMessages;