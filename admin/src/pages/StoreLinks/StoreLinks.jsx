import React, { useState, useEffect } from 'react';
import './StoreLinks.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const StoreLinks = ({ url }) => {
  const [storeData, setStoreData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatedLink, setGeneratedLink] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  useEffect(() => {
    fetchStoreData();
  }, []);

  const fetchStoreData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Adicionar X-Store-ID se disponível
      if (storeId) {
        headers['X-Store-ID'] = storeId;
      }
      
      const response = await fetch(`${url}/api/store/current`, {
        headers: headers
      });
      const data = await response.json();
      
      if (data.success) {
        setStoreData(data.data);
        // Gerar o link automaticamente quando os dados da loja são carregados
        generateStoreLink(data.data);
      } else {
        console.error('Erro ao buscar dados da loja:', data.message);
        toast.error(data.message || 'Erro ao carregar dados da loja');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
    }
  };

  const generateStoreLink = (store) => {
    if (store && store.slug) {
      const link = `http://localhost:5173/loja/${store.slug}`;
      setGeneratedLink(link);
      
      // Gerar QR Code usando uma API gratuita
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
      setQrCodeUrl(qrUrl);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      setCopySuccess(true);
      toast.success('Link copiado para a área de transferência!');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const shareViaWhatsApp = () => {
    const message = `Confira nosso cardápio e faça seu pedido: ${generatedLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.href = qrCodeUrl;
    link.download = `qr-code-${storeData?.name || 'loja'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="store-links-loading">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!storeData) {
    return (
      <div className="store-links-error">
        <p>Erro ao carregar dados da loja</p>
      </div>
    );
  }

  return (
    <div className="store-links">
      <div className="store-links-header">
        <h2>Link da Loja</h2>
        <p>Compartilhe o link da sua loja com os clientes para que possam acessar seu cardápio e fazer pedidos</p>
      </div>

      <div className="store-info">
        <h3>{storeData.name}</h3>
        <p>{storeData.description}</p>
      </div>

      <div className="link-section">
        <h4>Link Direto da Loja</h4>
        <div className="link-container">
          <input 
            type="text" 
            value={generatedLink} 
            readOnly 
            className="link-input"
          />
          <button 
            onClick={copyToClipboard}
            className={`copy-btn ${copySuccess ? 'success' : ''}`}
          >
            {copySuccess ? '✓ Copiado!' : 'Copiar'}
          </button>
        </div>
      </div>

      <div className="share-section">
        <h4>Compartilhar</h4>
        <div className="share-buttons">
          <button onClick={shareViaWhatsApp} className="whatsapp-btn">
            <span>📱</span>
            Compartilhar no WhatsApp
          </button>
        </div>
      </div>

      <div className="qr-section">
        <h4>QR Code</h4>
        <p>Seus clientes podem escanear este QR Code para acessar sua loja</p>
        <div className="qr-container">
          {qrCodeUrl && (
            <>
              <img src={qrCodeUrl} alt="QR Code da Loja" className="qr-code" />
              <button onClick={downloadQRCode} className="download-qr-btn">
                Baixar QR Code
              </button>
            </>
          )}
        </div>
      </div>

      <div className="instructions">
        <h4>Como usar:</h4>
        <ul>
          <li>Copie o link e envie para seus clientes via WhatsApp, SMS ou redes sociais</li>
          <li>Use o botão "Compartilhar no WhatsApp" para enviar rapidamente</li>
          <li>Imprima o QR Code e cole em seu estabelecimento</li>
          <li>Clientes podem escanear o QR Code com a câmera do celular</li>
        </ul>
      </div>
    </div>
  );
};

export default StoreLinks;