import React, { useState, useEffect } from 'react';
import './Settings.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = ({ url }) => {
  const [pixKey, setPixKey] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(2);
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
        setDeliveryFee(response.data.data.deliveryFee || 2);
        
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
      console.log('Token usado:', token); // Log para debug
      
      const response = await axios.post(
        `${url}/api/settings/pix-key`,
        { pixKey },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Resposta da API:', response.data); // Log para debug
      
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

  // Update delivery fee
  const updateDeliveryFee = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      console.log('Token usado (taxa):', token); // Log para debug
      
      const response = await axios.post(
        `${url}/api/settings/delivery-fee`,
        { deliveryFee: parseFloat(deliveryFee) },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      console.log('Resposta da API (taxa):', response.data); // Log para debug
      
      if (response.data.success) {
        toast.success('Taxa de entrega atualizada com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao atualizar taxa de entrega');
      }
    } catch (error) {
      console.error('Erro ao atualizar taxa de entrega:', error);
      if (error.response) {
        console.error('Detalhes do erro (taxa):', error.response.data);
        toast.error(error.response.data.message || 'Erro ao atualizar taxa de entrega');
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

      {/* Delivery Fee Section */}
      <div className="settings-section">
        <h3>Taxa de Entrega</h3>
        <p className="section-description">
          Configure a taxa de entrega padrão para os pedidos.
        </p>
        
        <form onSubmit={updateDeliveryFee} className="settings-form">
          <div className="form-group">
            <label htmlFor="deliveryFee">Taxa de Entrega (R$):</label>
            <input
              type="number"
              id="deliveryFee"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              min="0"
              step="0.01"
              className="settings-input"
            />
          </div>
          
          <button 
            type="submit" 
            className="settings-btn"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Taxa de Entrega'}
          </button>
        </form>
        
        <div className="current-setting">
          <strong>Taxa atual:</strong> R$ {parseFloat(deliveryFee).toFixed(2)}
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