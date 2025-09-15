import React, { useState, useEffect } from 'react';
import './Settings.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Settings = ({ url }) => {
  const [pixKey, setPixKey] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [autoAcceptOrders, setAutoAcceptOrders] = useState(false);

  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Banner states
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [currentBannerImage, setCurrentBannerImage] = useState('');



  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await axios.get(`${url}/api/settings`);
      if (response.data.success) {
        setPixKey(response.data.data.pixKey || '');
        setIsOpen(response.data.data.isOpen !== undefined ? response.data.data.isOpen : true);
        setAutoAcceptOrders(response.data.data.autoAcceptOrders !== undefined ? response.data.data.autoAcceptOrders : false);
        
        // Set banner data if exists
        if (response.data.data.banner) {
          setBannerTitle(response.data.data.banner.title || '');
          setBannerDescription(response.data.data.banner.description || '');
          setCurrentBannerImage(response.data.data.banner.image || '');
        }


      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoadingSettings(false);
    }
  };

  // Update PIX key
  const updatePixKey = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      
      const response = await axios.post(
        `${url}/api/settings/pix-key`,
        { pixKey },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      
      
      if (response.data.success) {
        toast.success('Chave PIX atualizada com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao atualizar chave PIX');
      }
    } catch (error) {
      console.error('Erro ao atualizar chave PIX:', error);
      if (error.response) {
        console.error('Detalhes do erro:', error.response.data);
        toast.error(error.response.data.message || 'Erro ao atualizar chave PIX');
      } else {
        toast.error('Erro ao conectar com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };



  // Update banner
  const updateBanner = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('title', bannerTitle);
      formData.append('description', bannerDescription);
      
      if (bannerImage) {
        formData.append('image', bannerImage);
      }
      
      const response = await axios.post(
        `${url}/api/settings/banner`,
        {
          title: bannerTitle,
          description: bannerDescription,
          image: currentBannerImage // Mantém a imagem atual se não houver nova
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Banner atualizado com sucesso!');
        fetchSettings(); // Recarrega as configurações
      } else {
        toast.error(response.data.message || 'Erro ao atualizar banner');
      }
    } catch (error) {
      console.error('Erro ao atualizar banner:', error);
      toast.error('Erro ao atualizar banner');
    } finally {
      setLoading(false);
    }
  };

  // Handle banner image change
  const handleBannerImageChange = (e) => {
    setBannerImage(e.target.files[0]);
  };

  // Atualizar status da loja (aberta/fechada)
  const handleStoreStatusChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${url}/api/store/status`, 
        { isOpen: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setIsOpen(newStatus);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || 'Erro ao atualizar status da loja');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da loja:', error);
      toast.error('Erro ao atualizar status da loja');
    }
  };



  // Atualizar configuração de aceitar pedidos automaticamente
  const handleAutoAcceptOrdersChange = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await axios.put(`${url}/api/store/auto-accept`, 
        { autoAcceptOrders: newStatus },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setAutoAcceptOrders(newStatus);
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message || 'Erro ao atualizar configuração de aceitar pedidos automaticamente');
      }
    } catch (error) {
      console.error('Erro ao atualizar configuração de aceitar pedidos automaticamente:', error);
      toast.error('Erro ao atualizar configuração de aceitar pedidos automaticamente');
    }
  };





  useEffect(() => {
    fetchSettings();

  }, []);

  if (loadingSettings) {
    return (
      <div className="settings">
        <div className="loading">Carregando configurações...</div>
      </div>
    );
  }

  return (
    <div className="settings">
      <h2>Configurações do Sistema</h2>
      
      {/* PIX Key Section */}
      <div className="settings-section">
        <h3>Chave PIX</h3>
        <p className="section-description">
          Configure a chave PIX que será exibida para os clientes durante o pagamento.
        </p>
        
        <form onSubmit={updatePixKey} className="settings-form">
          <div className="form-group">
            <label htmlFor="pixKey">Chave PIX:</label>
            <input
              type="text"
              id="pixKey"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              placeholder="Digite sua chave PIX (CPF, CNPJ, email, telefone ou chave aleatória)"
              className="settings-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="settings-btn"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Chave PIX'}
          </button>
        </form>
        
        {pixKey && (
          <div className="current-setting">
            <strong>Chave PIX atual:</strong> {pixKey}
          </div>
        )}
      </div>

      {/* Store Status Section */}
      <div className="settings-section">
        <h3>Status da Loja</h3>
        <p className="section-description">
          Controle se a loja está aberta ou fechada para receber pedidos.
        </p>
        
        <div className="store-status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isOpen}
              onChange={(e) => handleStoreStatusChange(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span className={`status-text ${isOpen ? 'open' : 'closed'}`}>
            {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
          </span>
        </div>
        
        <div className="current-setting">
          <strong>Status atual:</strong> {isOpen ? 'Aberta para pedidos' : 'Fechada para pedidos'}
        </div>
      </div>

      {/* Auto Accept Orders Section */}
      <div className="settings-section">
        <h3>Aceitar Pedidos Automaticamente</h3>
        <p className="section-description">
          Quando ativado, todos os novos pedidos serão aceitos automaticamente sem necessidade de confirmação manual.
        </p>
        
        <div className="store-status-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={autoAcceptOrders}
              onChange={(e) => handleAutoAcceptOrdersChange(e.target.checked)}
            />
            <span className="slider"></span>
          </label>
          <span className={`status-text ${autoAcceptOrders ? 'open' : 'closed'}`}>
            {autoAcceptOrders ? 'Aceitação Automática Ativada' : 'Aceitação Automática Desativada'}
          </span>
        </div>
        
        <div className="current-setting">
          <strong>Status atual:</strong> {autoAcceptOrders ? 'Pedidos são aceitos automaticamente' : 'Pedidos precisam ser aceitos manualmente'}
        </div>
      </div>

      {/* Banner Section */}
      <div className="settings-section">
        <h3>Banner Principal</h3>
        <p className="section-description">
          Configure o banner que aparece na página inicial do site.
        </p>
        
        <form onSubmit={updateBanner} className="settings-form">
          <div className="form-group">
            <label htmlFor="bannerTitle">Título do Banner:</label>
            <input
              type="text"
              id="bannerTitle"
              value={bannerTitle}
              onChange={(e) => setBannerTitle(e.target.value)}
              placeholder="Digite o título do banner"
              className="settings-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bannerDescription">Descrição do Banner:</label>
            <textarea
              id="bannerDescription"
              value={bannerDescription}
              onChange={(e) => setBannerDescription(e.target.value)}
              placeholder="Digite a descrição do banner"
              className="settings-textarea"
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bannerImage">Imagem do Banner:</label>
            <input
              type="file"
              id="bannerImage"
              onChange={handleBannerImageChange}
              accept="image/*"
              className="settings-input"
            />
            {currentBannerImage && (
              <div className="current-image">
                <p>Imagem atual:</p>
                <img 
                  src={`${url}/images${currentBannerImage}`} 
                  alt="Banner atual" 
                  style={{ maxWidth: '200px', maxHeight: '100px', objectFit: 'cover' }}
                />
              </div>
            )}
          </div>
          
          <button 
            type="submit" 
            className="settings-btn"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Banner'}
          </button>
        </form>
        
        {bannerTitle && (
          <div className="current-setting">
            <strong>Título atual:</strong> {bannerTitle}
          </div>
        )}
      </div>


    </div>
  );
};

export default Settings;