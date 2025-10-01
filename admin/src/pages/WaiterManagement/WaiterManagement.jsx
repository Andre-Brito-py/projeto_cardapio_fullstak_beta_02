import React, { useState, useEffect } from 'react';
import './WaiterManagement.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { assets } from '../../assets/assets';
import { FRONTEND_URL } from '../../config/urls';

const WaiterManagement = ({ url }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [storeData, setStoreData] = useState(null);
  const [waiterLink, setWaiterLink] = useState('');
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStoreData = async () => {
    try {
      const token = localStorage.getItem('token');
      const userRole = localStorage.getItem('userRole');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }
      
      // Se for super admin, não tentar buscar dados da loja
      if (userRole === 'super_admin') {
        toast.info('Super Admin não possui loja associada. Funcionalidade de garçom não disponível.');
        return;
      }
      
      const response = await axios.get(`${url}/api/store/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStoreData(response.data.store);
        await generateWaiterLink(response.data.store._id, response.data.store.slug);
      } else {
        // Verificar se é resposta específica de super admin
        if (response.data.userRole === 'super_admin') {
          toast.info('Super Admin não possui loja associada. Funcionalidade de garçom não disponível.');
          return;
        }
        throw new Error(response.data.message || 'Erro ao buscar dados da loja');
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      
      // Verificar se é erro específico de super admin
      if (error.response?.data?.userRole === 'super_admin') {
        toast.info('Super Admin não possui loja associada. Funcionalidade de garçom não disponível.');
        return;
      }
      
      // Não definir erro aqui para não bloquear a interface
      toast.error('Erro ao carregar dados da loja');
    }
  };

  const generateWaiterLink = async (storeId, storeSlug = 'default') => {
    try {
      setIsGeneratingLink(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.post(`${url}/api/waiter/generate-link`, 
        { baseUrl: FRONTEND_URL },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setWaiterLink(response.data.data.accessLink);
      } else {
        setWaiterLink(`${FRONTEND_URL}/waiter-order/${storeId}?token=waiter_${storeSlug}`);
      }
    } catch (error) {
      console.error('Erro ao gerar link do garçom:', error);
      setWaiterLink(`${FRONTEND_URL}/waiter-order/${storeId}?token=waiter_${storeSlug}`);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const fetchTables = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('Token não encontrado para buscar mesas');
        return;
      }
      
      const response = await axios.get(`${url}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTables(response.data.data || []);
      } else {
        console.warn('Erro na resposta da API de mesas:', response.data);
        setTables([]);
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      setTables([]);
      // Não mostrar toast de erro para mesas, pois é opcional
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (!text) {
      toast.error('Nenhum link disponível para copiar');
      return;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      toast.success('Link copiado!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  useEffect(() => {
    const initData = async () => {
      try {
        await Promise.all([
          fetchStoreData(),
          fetchTables()
        ]);
      } catch (error) {
        console.error('Erro ao inicializar:', error);
      } finally {
        setInitialLoading(false);
      }
    };
    
    initData();
  }, []);

  if (initialLoading) {
    return (
      <div className="waiter-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="waiter-management">
      <div className="waiter-header">
        <h2>Gerenciamento de Garçom</h2>
        <p>Gerencie o acesso dos garçons e visualize as mesas</p>
      </div>

      <div className="waiter-content">
        <div className="waiter-link-section">
          <h3>Link de Acesso do Garçom</h3>
          <div className="link-container">
            <input 
              type="text" 
              value={waiterLink} 
              readOnly 
              placeholder="Gerando link..."
              className="link-input"
            />
            <button 
              onClick={() => copyToClipboard(waiterLink)}
              disabled={!waiterLink || isGeneratingLink}
              className="copy-btn"
            >
              {isGeneratingLink ? 'Gerando...' : 'Copiar'}
            </button>
          </div>
          <p className="link-description">
            Compartilhe este link com os garçons
          </p>
        </div>

        <div className="tables-section">
          <h3>Mesas Disponíveis</h3>
          {loading ? (
            <div className="loading-tables">
              <p>Carregando mesas...</p>
            </div>
          ) : (
            <div className="tables-grid">
              {tables.length > 0 ? (
                tables.map((table) => (
                  <div key={table._id} className="table-card">
                    <div className="table-info">
                      <h4>Mesa {table.tableNumber}</h4>
                      <p>Capacidade: {table.capacity} pessoas</p>
                      <p className={`table-status ${table.status}`}>
                        Status: {table.status === 'available' ? 'Disponível' : 
                                table.status === 'occupied' ? 'Ocupada' : 'Reservada'}
                      </p>
                    </div>
                    <div className="table-actions">
                      <button 
                        onClick={() => copyToClipboard(`${waiterLink}?table=${table.tableNumber}`)}
                        disabled={!waiterLink}
                        className="table-link-btn"
                      >
                        Copiar Link da Mesa
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="no-tables">
                  <img src={assets.parcel_icon} alt="Sem mesas" />
                  <p>Nenhuma mesa cadastrada</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WaiterManagement;