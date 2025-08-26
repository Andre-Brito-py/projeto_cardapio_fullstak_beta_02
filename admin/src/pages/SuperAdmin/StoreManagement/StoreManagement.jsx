import React, { useState, useEffect } from 'react';
import './StoreManagement.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const StoreManagement = ({ url, token }) => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restaurantAddress: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    subscriptionPlan: 'Básico'
  });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/system/stores`, {
        headers: { token }
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${url}/api/system/stores`, formData, {
        headers: { token }
      });
      
      if (response.data.success) {
        toast.success('Loja criada com sucesso!');
        setShowForm(false);
        setFormData({
          name: '',
          description: '',
          restaurantAddress: '',
          ownerName: '',
          ownerEmail: '',
          ownerPassword: '',
          subscriptionPlan: 'Básico'
        });
        fetchStores();
      } else {
        toast.error(response.data.message || 'Erro ao criar loja');
      }
    } catch (error) {
      console.error('Erro ao criar loja:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (store) => {
    setEditingStore(store);
    setFormData({
      name: store.name,
      domain: store.domain,
      description: store.description || '',
      address: store.address || '',
      phone: store.phone || '',
      email: store.email || '',
      isActive: store.isActive
    });
    setShowForm(true);
  };

  const handleDelete = async (storeId) => {
    toast.info('Funcionalidade de exclusão será implementada em breve');
  };

  const toggleStoreStatus = async (storeId, currentStatus) => {
    setLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      const response = await axios.put(`${url}/api/system/stores/${storeId}/status`, 
        { status: newStatus },
        { headers: { token } }
      );
      
      if (response.data.success) {
        toast.success('Status da loja atualizado!');
        fetchStores();
      } else {
        toast.error(response.data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status da loja');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      domain: '',
      description: '',
      address: '',
      phone: '',
      email: '',
      isActive: true
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
                <tr key={store._id} className={!store.isActive ? 'inactive' : ''}>
                  <td>{store.name}</td>
                  <td>{store.ownerName}</td>
                  <td>{store.ownerEmail}</td>
                  <td>
                    <span className={`status ${store.isActive ? 'active' : 'inactive'}`}>
                      {store.isActive ? 'Ativa' : 'Inativa'}
                    </span>
                  </td>
                  <td>{store.subscriptionPlan}</td>
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
                      className={`toggle-btn ${store.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleStoreStatus(store._id, store.isActive)}
                      disabled={loading}
                    >
                      {store.isActive ? 'Desativar' : 'Ativar'}
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