import React, { useState, useEffect, useRef } from 'react';
import './LizaChat.css';
import lizaService from '../../services/lizaService.js';
import { toast } from 'react-toastify';

const LizaChat = ({ url, token }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Olá! Eu sou a Liza, sua assistente virtual. Como posso ajudar você hoje?",
      sender: 'liza',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [dailyReport, setDailyReport] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ 
        behavior: "smooth",
        block: "end",
        inline: "nearest"
      });
    }
  };

  useEffect(() => {
    // Adicionar um pequeno delay para garantir que o DOM foi atualizado
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [messages]);

  // Função para buscar relatório diário
  const fetchDailyReport = async () => {
    try {
      const response = await fetch(`${url}/api/reports/daily`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDailyReport(data);
        return data;
      }
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
    }
    return null;
  };

  // Processar comandos especiais (mantido para compatibilidade)
  const processSpecialCommands = async (message) => {
    // Comandos especiais agora são tratados pelo lizaService
    // Esta função é mantida apenas para compatibilidade
    return null;
  };

  // Função para enviar mensagem para a Liza (OpenRouter)
  const sendMessageToAI = async (messageText) => {
    try {
      const result = await lizaService.processMessage(messageText);
      
      return {
        text: result.response,
        sender: 'liza',
        timestamp: new Date(),
        type: result.success ? 'text' : 'error',
        data: result.data || null
      };
    } catch (error) {
      console.error('Erro ao enviar mensagem para Liza:', error);
      return {
        text: 'Desculpe, estou com dificuldades técnicas no momento. Verifique a conexão com o OpenRouter.',
        sender: 'liza',
        timestamp: new Date(),
        type: 'error'
      };
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    const messageText = inputMessage;
    setInputMessage('');
    setIsLoading(true);
    
    try {
      // Verificar comandos especiais primeiro
      let response = await processSpecialCommands(messageText);
      
      // Se não for comando especial, enviar para IA
      if (!response) {
        const aiResponse = await sendMessageToAI(messageText);
        response = aiResponse.text;
        
        // Mostrar toast para ações bem-sucedidas
        if (aiResponse.type === 'text' && aiResponse.text.includes('✅')) {
          toast.success('Ação realizada com sucesso!');
        } else if (aiResponse.type === 'error') {
          toast.error('Erro ao processar comando');
        }
      }
      
      const lizaMessage = {
        id: Date.now() + 1,
        text: response,
        sender: 'liza',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, lizaMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorResponse = {
        id: Date.now() + 1,
        text: 'Desculpe, ocorreu um erro. Tente novamente.',
        sender: 'liza',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
      toast.error('Erro de comunicação');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (text) => {
    // Verificar se text é null ou undefined
    if (!text) {
      return '';
    }
    // Converter markdown básico para HTML
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const requestDailyReport = async () => {
    const reportMessage = {
      id: Date.now(),
      text: "Liza, resumo de hoje",
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, reportMessage]);
    setIsLoading(true);
    
    const response = await processSpecialCommands("resumo de hoje");
    
    const lizaMessage = {
      id: Date.now() + 1,
      text: response,
      sender: 'liza',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, lizaMessage]);
    setIsLoading(false);
  };

  return (
    <div className="liza-chat-container">
      <div className="liza-chat-header">
        <div className="liza-avatar">
          <span>🤖</span>
        </div>
        <div className="liza-info">
          <h3>Liza - Assistente Virtual</h3>
          <p>Sua assistente para relatórios e análises</p>
        </div>
        <button 
          className="daily-report-btn"
          onClick={requestDailyReport}
          title="Solicitar Resumo Diário"
        >
          📊 Resumo
        </button>
      </div>
      
      <div className="liza-chat-messages">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`message ${message.sender === 'user' ? 'user-message' : 'liza-message'}`}
          >
            <div className="message-content">
              <div 
                className="message-text"
                dangerouslySetInnerHTML={{ __html: formatMessage(message.text) }}
              />
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="message liza-message">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="liza-chat-input">
        <div className="quick-actions">
          <button onClick={() => setInputMessage("relatório do dia")} className="quick-btn">
            📊 Relatório do Dia
          </button>
          <button onClick={() => setInputMessage("pedidos em andamento")} className="quick-btn">
            📦 Pedidos Ativos
          </button>
          <button onClick={() => setInputMessage("consultar cardápio")} className="quick-btn">
            📋 Cardápio
          </button>
          <button onClick={() => setInputMessage("Ajuda")} className="quick-btn">
            ❓ Ajuda
          </button>
        </div>
        
        <div className="input-area">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Digite sua mensagem para a Liza..."
            rows="2"
            disabled={isLoading}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="send-btn"
          >
            📤
          </button>
        </div>
      </div>
    </div>
  );
};

export default LizaChat;