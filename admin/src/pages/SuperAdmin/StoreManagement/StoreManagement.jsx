import React, { useState, useEffect } from 'react';
import './StoreManagement.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, getRegionalDefaults } from '../../../constants/localization';

const StoreManagement = ({ url, token }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restaurantAddress: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    subscriptionPlan: 'Básico',
    language: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo'
  });

  
  useEffect(() => {
    console.log('🔍 StoreManagement montado - verificando elementos que podem bloquear cliques');
    
    const checkForBlockingElements = () => {
      const backdrop = document.querySelector('.sidebar-backdrop');
      const overlay = document.querySelector('.store-form-overlay');
      
      console.log('📊 Estado dos elementos:');
      console.log('  - Sidebar backdrop:', backdrop ? 'Presente' : 'Ausente');
      console.log('  - Store form overlay:', overlay ? 'Presente' : 'Ausente');
      
      if (backdrop) {
        const backdropStyles = getComputedStyle(backdrop);
        console.log('  - Backdrop visível:', backdropStyles.display !== 'none');
        console.log('  - Backdrop z-index:', backdropStyles.zIndex);
      }
    };
    
    checkForBlockingElements();
    
    // Verificar novamente após um pequeno delay
    const timer = setTimeout(checkForBlockingElements, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Função para atualizar configurações regionais quando o idioma muda
  const handleLanguageChange = (e) => {
    const selectedLanguage = e.target.value;
    const regionalDefaults = getRegionalDefaults(selectedLanguage);
    
    setFormData(prev => ({
      ...prev,
      language: selectedLanguage,
      currency: regionalDefaults.currency,
      timezone: regionalDefaults.timezone
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/system/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStores(response.data.data.stores || []);
      } else {
        toast.error('Erro ao carregar lojas');
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let response;
      
      if (editingStore) {
        // Editando loja existente
        response = await axios.put(`${url}/api/system/stores/${editingStore._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        // Criando nova loja
        response = await axios.post(`${url}/api/system/stores`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(editingStore ? 'Loja atualizada com sucesso!' : 'Loja criada com sucesso!');
        resetForm();
        fetchStores();
      } else {
        toast.error(response.data.message || (editingStore ? 'Erro ao atualizar loja' : 'Erro ao criar loja'));
      }
    } catch (error) {
      console.error(editingStore ? 'Erro ao atualizar loja:' : 'Erro ao criar loja:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name || '',
      description: store.description || '',
      restaurantAddress: store.restaurantAddress || store.address || '',
      ownerName: store.ownerName || '',
      ownerEmail: store.ownerEmail || store.email || '',
      ownerPassword: '', // Não pré-preencher senha por segurança
      subscriptionPlan: store.subscriptionPlan || 'Básico',
      language: store.language || 'pt-BR',
      currency: store.currency || 'BRL',
      timezone: store.timezone || 'America/Sao_Paulo'
    });
    setShowForm(true);
  };

  const handleDelete = (storeId) => {
    const store = stores.find(s => s._id === storeId);
    if (!store) return;

    setStoreToDelete(store);
    setShowDeleteModal(true);
    setDeleteConfirmText('');
  };

  const confirmDelete = async () => {
    console.log('=== INICIANDO EXCLUSÃO ===');
    console.log('URL:', `${url}/api/system/stores/${storeToDelete._id}`);
    console.log('Token:', token ? 'Token presente' : 'Token ausente');
    console.log('Store ID:', storeToDelete._id);
    
    try {
      const response = await axios.delete(`${url}/api/system/stores/${storeToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('=== RESPOSTA DO SERVIDOR ===');
      console.log('Status:', response.status);
      console.log('Data:', response.data);

      if (response.data.success) {
        toast.success('Loja excluída com sucesso!');
        setShowDeleteModal(false);
        setStoreToDelete(null);
        setDeleteConfirmText('');
        fetchStores(); // Recarregar a lista
      } else {
        console.log('Erro do servidor:', response.data.message);
        toast.error(response.data.message || 'Erro ao excluir loja');
      }
    } catch (error) {
      console.error('=== ERRO COMPLETO ===');
      console.error('Error object:', error);
      console.error('Response:', error.response);
      console.error('Response data:', error.response?.data);
      console.error('Response status:', error.response?.status);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao excluir loja. Tente novamente.');
      }
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setStoreToDelete(null);
    setDeleteConfirmText('');
  };

  const toggleStoreStatus = async (storeId, currentStatus) => {
    console.log('🔄 toggleStoreStatus chamado:', { storeId, currentStatus, token: token ? 'presente' : 'ausente' });
    
    if (!token) {
      console.error('❌ Token não encontrado!');
      toast.error('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }
    
    setLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      console.log('📊 Alterando status de', currentStatus, 'para', newStatus);
      
      const requestUrl = `${url}/api/system/stores/${storeId}/status`;
      const requestData = { status: newStatus };
      const requestHeaders = { Authorization: `Bearer ${token}` };
      
      console.log('🌐 Fazendo requisição:', {
        url: requestUrl,
        data: requestData,
        headers: { ...requestHeaders, Authorization: 'Bearer [HIDDEN]' }
      });
      
      const response = await axios.put(requestUrl, requestData, { headers: requestHeaders });
      
      console.log('✅ Resposta recebida:', response.data);
      
      if (response.data.success) {
        toast.success(`Loja ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
        console.log('🔄 Recarregando lista de lojas...');
        fetchStores();
      } else {
        console.error('❌ Erro na resposta:', response.data.message);
        toast.error(response.data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      console.error('📋 Detalhes do erro:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao atualizar status da loja');
      }
    } finally {
      console.log('🏁 toggleStoreStatus finalizado');
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      restaurantAddress: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      subscriptionPlan: 'Básico',
      language: 'pt-BR',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo'
    });
    setEditingStore(null);
    setShowForm(false);
  };

  return (
    <div className='store-management'>
      <div className='store-management-header'>
        <h2>Gerenciamento de Lojas</h2>
        <button 
          className='add-store-btn'
          onClick={() => setShowForm(true)}
          disabled={loading}
        >
          + Nova Loja
        </button>
      </div>

      {showForm && (
        <div className='store-form-overlay'>
          <div className='store-form'>
            <h3>{editingStore ? 'Editar Loja' : 'Nova Loja'}</h3>
            <form onSubmit={handleSubmit}>
              <div className='form-group'>
                <label>Nome da Loja *</label>
                <input
                  type='text'
                  name='name'
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className='form-group'>
                <label>Descrição</label>
                <textarea
                  name='description'
                  value={formData.description}
                  onChange={handleInputChange}
                  rows='3'
                />
              </div>
              
              <div className='form-group'>
                <label>Endereço do Restaurante *</label>
                <input
                  type='text'
                  name='restaurantAddress'
                  value={formData.restaurantAddress}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className='form-group'>
                <label>Nome do Proprietário *</label>
                <input
                  type='text'
                  name='ownerName'
                  value={formData.ownerName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className='form-group'>
                <label>Email do Proprietário *</label>
                <input
                  type='email'
                  name='ownerEmail'
                  value={formData.ownerEmail}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className='form-group'>
                <label>Senha do Proprietário *</label>
                <input
                  type='password'
                  name='ownerPassword'
                  value={formData.ownerPassword}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className='form-group'>
                <label>Plano de Assinatura</label>
                <select
                  name='subscriptionPlan'
                  value={formData.subscriptionPlan}
                  onChange={handleInputChange}
                >
                  <option value='Básico'>Básico</option>
                  <option value='Premium'>Premium</option>
                  <option value='Enterprise'>Enterprise</option>
                </select>
              </div>
              
              <div className='form-group'>
                <label>Idioma da Loja *</label>
                <select
                  name='language'
                  value={formData.language}
                  onChange={handleLanguageChange}
                  required
                >
                  {SUPPORTED_LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
                <small>O idioma será usado na interface da loja e comunicações com clientes</small>
              </div>
              
              <div className='form-group'>
                <label>Moeda da Loja *</label>
                <select
                  name='currency'
                  value={formData.currency}
                  onChange={handleInputChange}
                  required
                >
                  {SUPPORTED_CURRENCIES.map(currency => (
                    <option key={currency.code} value={currency.code}>
                      {currency.symbol} {currency.name} ({currency.code})
                    </option>
                  ))}
                </select>
                <small>A moeda será usada para preços e transações na loja</small>
              </div>
              
              <div className='form-actions'>
                <button type='button' onClick={resetForm}>Cancelar</button>
                <button type='submit' disabled={loading}>
                  {loading ? 'Salvando...' : (editingStore ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className='store-form-overlay'>
          <div className='delete-modal'>
            <h3>⚠️ Confirmar Exclusão</h3>
            <div className='delete-warning'>
              <p>Tem certeza que deseja excluir a loja <strong>"{storeToDelete?.name}"</strong>?</p>
              
              <div className='warning-list'>
                <p><strong>ATENÇÃO: Esta ação irá excluir permanentemente:</strong></p>
                <ul>
                  <li>A loja e todas suas configurações</li>
                  <li>Todos os produtos da loja</li>
                  <li>Todos os administradores da loja</li>
                  <li>Banners relacionados aos produtos</li>
                </ul>
                <p><strong>Esta ação NÃO PODE ser desfeita!</strong></p>
              </div>
            </div>
            
            <div className='modal-actions'>
              <button 
                type='button' 
                className='cancel-btn'
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button 
                type='button' 
                className='confirm-delete-btn'
                onClick={confirmDelete}
              >
                Excluir Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='stores-list'>
        {loading && <div className='loading'>Carregando...</div>}
        
        {!loading && stores.length === 0 && (
          <div className='no-stores'>Nenhuma loja encontrada</div>
        )}
        
        {!loading && stores.length > 0 && (
          <table className='stores-table'>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Proprietário</th>
                <th>Email</th>
                <th>Status</th>
                <th>Plano</th>
                <th>Criada em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {stores.map(store => (
                <tr key={store._id} className={store.status !== 'active' ? 'inactive' : ''}>
                  <td>{store.name}</td>
                  <td>{store.ownerName}</td>
                  <td>{store.ownerEmail}</td>
                  <td>
                    <span className={`status ${store.status === 'active' ? 'active' : 'inactive'}`}>
                      {store.status === 'active' ? 'Ativa' : 
                       store.status === 'suspended' ? 'Suspensa' :
                       store.status === 'pending' ? 'Pendente' : 'Inativa'}
                    </span>
                  </td>
                  <td>{store.subscription?.plan || store.subscriptionPlan}</td>
                  <td>{new Date(store.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className='actions'>
                    <button 
                      className='edit-btn'
                      onClick={() => handleEdit(store)}
                      disabled={loading}
                    >
                      Editar
                    </button>
                    <button 
                      className={`toggle-btn ${store.status === 'active' ? 'active' : 'inactive'}`}
                      onClick={() => toggleStoreStatus(store._id, store.status)}
                      disabled={loading}
                    >
                      {store.status === 'active' ? 'Desativar' : 'Ativar'}
                    </button>
                    <button 
                      className='delete-btn'
                      onClick={() => handleDelete(store._id)}
                      disabled={loading}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StoreManagement;