import React, { useState, useEffect } from 'react';
import './Settings.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = ({ url }) => {
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  
  // Banner states
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerDescription, setBannerDescription] = useState('');
  const [bannerImage, setBannerImage] = useState(null);
  const [currentBannerImage, setCurrentBannerImage] = useState('');

  // Google Maps states
  const [googleMapsApiKey, setGoogleMapsApiKey] = useState('');
  const [restaurantAddress, setRestaurantAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'Brasil'
  });
  const [maxDeliveryDistance, setMaxDeliveryDistance] = useState(10);
  const [deliveryZones, setDeliveryZones] = useState([
    { maxDistance: 5, fee: 2 },
    { maxDistance: 10, fee: 4 }
  ]);

  // Fetch current settings
  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const response = await axios.get(`${url}/api/settings`);
      if (response.data.success) {
        setPixKey(response.data.data.pixKey || '');
        
        // Set banner data if exists
        if (response.data.data.banner) {
          setBannerTitle(response.data.data.banner.title || '');
          setBannerDescription(response.data.data.banner.description || '');
          setCurrentBannerImage(response.data.data.banner.image || '');
        }

        // Set Google Maps data if exists
        setGoogleMapsApiKey(response.data.data.googleMapsApiKey || '');
        if (response.data.data.restaurantAddress) {
          setRestaurantAddress(response.data.data.restaurantAddress);
        }
        setMaxDeliveryDistance(response.data.data.maxDeliveryDistance || 10);
        if (response.data.data.deliveryZones && response.data.data.deliveryZones.length > 0) {
          setDeliveryZones(response.data.data.deliveryZones);
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

  // Update Google Maps settings
  const updateGoogleMapsSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${url}/api/settings/google-maps`,
        {
          googleMapsApiKey,
          restaurantAddress,
          maxDeliveryDistance: parseFloat(maxDeliveryDistance),
          deliveryZones: deliveryZones.map(zone => ({
            maxDistance: parseFloat(zone.maxDistance),
            fee: parseFloat(zone.fee)
          }))
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        toast.success('Configurações do Google Maps atualizadas com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao atualizar configurações do Google Maps');
      }
    } catch (error) {
      console.error('Erro ao atualizar configurações do Google Maps:', error);
      toast.error('Erro ao atualizar configurações do Google Maps');
    } finally {
      setLoading(false);
    }
  };

  // Handle restaurant address change
  const handleRestaurantAddressChange = (field, value) => {
    setRestaurantAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle delivery zone change
  const handleDeliveryZoneChange = (index, field, value) => {
    const updatedZones = [...deliveryZones];
    updatedZones[index][field] = value;
    setDeliveryZones(updatedZones);
  };

  // Add new delivery zone
  const addDeliveryZone = () => {
    setDeliveryZones([...deliveryZones, { maxDistance: 0, fee: 0 }]);
  };

  // Remove delivery zone
  const removeDeliveryZone = (index) => {
    if (deliveryZones.length > 1) {
      const updatedZones = deliveryZones.filter((_, i) => i !== index);
      setDeliveryZones(updatedZones);
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

      {/* Google Maps Section */}
      <div className="settings-section">
        <h3>Configurações do Google Maps</h3>
        <p className="section-description">
          Configure a integração com o Google Maps para cálculo automático de taxa de entrega.
        </p>
        
        <form onSubmit={updateGoogleMapsSettings} className="settings-form">
          <div className="form-group">
            <label htmlFor="googleMapsApiKey">Chave da API do Google Maps:</label>
            <input
              type="text"
              id="googleMapsApiKey"
              value={googleMapsApiKey}
              onChange={(e) => setGoogleMapsApiKey(e.target.value)}
              placeholder="Digite sua chave da API do Google Maps"
              className="settings-input"
            />
          </div>

          <h4>Endereço do Restaurante</h4>
          <div className="form-group">
            <label htmlFor="restaurantStreet">Rua:</label>
            <input
              type="text"
              id="restaurantStreet"
              value={restaurantAddress.street}
              onChange={(e) => handleRestaurantAddressChange('street', e.target.value)}
              placeholder="Digite o endereço da rua"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="restaurantCity">Cidade:</label>
            <input
              type="text"
              id="restaurantCity"
              value={restaurantAddress.city}
              onChange={(e) => handleRestaurantAddressChange('city', e.target.value)}
              placeholder="Digite a cidade"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="restaurantState">Estado:</label>
            <input
              type="text"
              id="restaurantState"
              value={restaurantAddress.state}
              onChange={(e) => handleRestaurantAddressChange('state', e.target.value)}
              placeholder="Digite o estado"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="restaurantZipCode">CEP:</label>
            <input
              type="text"
              id="restaurantZipCode"
              value={restaurantAddress.zipCode}
              onChange={(e) => handleRestaurantAddressChange('zipCode', e.target.value)}
              placeholder="Digite o CEP"
              className="settings-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="maxDeliveryDistance">Distância Máxima de Entrega (km):</label>
            <input
              type="number"
              id="maxDeliveryDistance"
              value={maxDeliveryDistance}
              onChange={(e) => setMaxDeliveryDistance(e.target.value)}
              min="1"
              step="0.1"
              className="settings-input"
            />
          </div>

          <h4>Zonas de Entrega</h4>
          {deliveryZones.map((zone, index) => (
            <div key={index} className="delivery-zone">
              <div className="form-group">
                <label>Até {zone.maxDistance} km - Taxa: R$ {zone.fee}</label>
                <div className="zone-inputs">
                  <input
                    type="number"
                    value={zone.maxDistance}
                    onChange={(e) => handleDeliveryZoneChange(index, 'maxDistance', e.target.value)}
                    placeholder="Distância (km)"
                    min="0.1"
                    step="0.1"
                    className="settings-input zone-input"
                  />
                  <input
                    type="number"
                    value={zone.fee}
                    onChange={(e) => handleDeliveryZoneChange(index, 'fee', e.target.value)}
                    placeholder="Taxa (R$)"
                    min="0"
                    step="0.01"
                    className="settings-input zone-input"
                  />
                  {deliveryZones.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeDeliveryZone(index)}
                      className="remove-zone-btn"
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          <button
            type="button"
            onClick={addDeliveryZone}
            className="add-zone-btn"
          >
            Adicionar Zona de Entrega
          </button>
          
          <button 
            type="submit" 
            className="settings-btn"
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações do Google Maps'}
          </button>
        </form>
        
        {googleMapsApiKey && (
          <div className="current-setting">
            <strong>API Key configurada:</strong> {googleMapsApiKey.substring(0, 10)}...
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;