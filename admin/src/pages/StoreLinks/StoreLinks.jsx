import React, { useState, useEffect } from 'react';
import './StoreLinks.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FRONTEND_URL, BACKEND_URL } from '../../config/urls';

const StoreLinks = () => {
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
      const userRole = localStorage.getItem('userRole');
      
      // Se for super admin, não tentar buscar dados da loja
      if (userRole === 'super_admin') {
        toast.info('Super Admin não possui loja associada. Funcionalidade de links não disponível.');
        setStoreData(null);
        setGeneratedLink('');
        setQrCodeUrl('');
        return;
      }
      
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      
      // Adicionar X-Store-ID se disponível
      if (storeId) {
        headers['X-Store-ID'] = storeId;
      }
      
      const response = await fetch(`${BACKEND_URL}/api/store/current`, {
        headers: headers
      });
      const data = await response.json();
      
      if (data.success) {
        setStoreData(data.store);
        // Gerar o link automaticamente quando os dados da loja são carregados
        generateStoreLink(data.store);
      } else {
        // Verificar se é resposta específica de super admin
        if (data.userRole === 'super_admin') {
          toast.info('Super Admin não possui loja associada. Funcionalidade de links não disponível.');
          setStoreData(null);
          setGeneratedLink('');
          setQrCodeUrl('');
          return;
        }
        
        console.error('Erro ao buscar dados da loja:', data.message);
        toast.error(data.message || 'Erro ao carregar dados da loja');
        // Limpar dados em caso de erro
        setStoreData(null);
        setGeneratedLink('');
        setQrCodeUrl('');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
      // Limpar dados em caso de erro
      setStoreData(null);
      setGeneratedLink('');
      setQrCodeUrl('');
    } finally {
      setLoading(false);
    }
  };

  const generateStoreLink = (store) => {
    if (store && store.slug) {
      // Usar a URL correta do frontend (cliente) - porta 5173
      const link = `${FRONTEND_URL}/loja/${store.slug}`;
      setGeneratedLink(link);
      
      // Gerar QR Code usando uma API gratuita
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(link)}`;
      setQrCodeUrl(qrUrl);
    } else {
      // Caso o slug não esteja disponível, mostrar mensagem de erro
      console.error('Erro: Slug da loja não encontrado', store);
      toast.error('Não foi possível gerar o link da loja. Slug não encontrado.');
      setGeneratedLink('');
      setQrCodeUrl('');
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

  if (!storeData || !generatedLink) {
    return (
      <div className="store-links-error">
        <p>Erro ao carregar dados da loja ou gerar link</p>
        <button onClick={fetchStoreData} className="retry-btn">
          Tentar novamente
        </button>
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