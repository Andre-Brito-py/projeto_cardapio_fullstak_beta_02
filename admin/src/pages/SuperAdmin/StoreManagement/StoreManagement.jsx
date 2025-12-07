import React, { useState, useEffect } from 'react';
import './StoreManagement.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { SUPPORTED_LANGUAGES, SUPPORTED_CURRENCIES, getRegionalDefaults } from '../../../constants/localization';

const StoreManagement = ({ url, token }) => {
  const [stores, setStores] = useState([]);
  const [filteredStores, setFilteredStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [storeStats, setStoreStats] = useState({
    total: 0,
    active: 0,
    suspended: 0,
    pending: 0,
    totalRevenue: 0,
    avgRevenuePerStore: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    restaurantAddress: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    ownerName: '',
    ownerEmail: '',
    ownerPassword: '',
    subscriptionPlan: 'Básico',
    language: 'pt-BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    
  });
  useEffect(() => {
    const checkForBlockingElements = () => {
      const backdrop = document.querySelector('.sidebar-backdrop');
      const overlay = document.querySelector('.store-form-overlay');
      if (backdrop) {
        const backdropStyles = getComputedStyle(backdrop);
      }
    };
    checkForBlockingElements();
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
    if (token) {
      fetchStores();
    }
  }, [token]);

  // Filtrar e ordenar lojas
  useEffect(() => {
    let filtered = [...stores];

    // Aplicar filtro de busca
    if (searchTerm) {
      filtered = filtered.filter(store => 
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.ownerEmail.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Aplicar filtro de status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(store => store.status === statusFilter);
    }

    // Aplicar filtro de plano
    if (planFilter !== 'all') {
      filtered = filtered.filter(store => 
        (store.subscription?.plan || store.subscriptionPlan) === planFilter
      );
    }

    // Aplicar ordenação
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'ownerName':
          aValue = a.ownerName.toLowerCase();
          bValue = b.ownerName.toLowerCase();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'plan':
          aValue = a.subscription?.plan || a.subscriptionPlan;
          bValue = b.subscription?.plan || b.subscriptionPlan;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredStores(filtered);
  }, [stores, searchTerm, statusFilter, planFilter, sortBy, sortOrder]);

  // Calcular estatísticas
  useEffect(() => {
    const stats = {
      total: stores.length,
      active: stores.filter(s => s.status === 'active').length,
      suspended: stores.filter(s => s.status === 'suspended').length,
      pending: stores.filter(s => s.status === 'pending').length,
      totalRevenue: stores.reduce((sum, store) => sum + (store.totalRevenue || 0), 0),
      avgRevenuePerStore: 0
    };
    
    if (stats.total > 0) {
      stats.avgRevenuePerStore = stats.totalRevenue / stats.total;
    }
    
    setStoreStats(stats);
  }, [stores]);

  const fetchStores = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${url}/api/system/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStores(response.data.data.stores || []);
      } else {
        toast.error(response.data.message || 'Erro ao carregar lojas');
      }
    } catch (error) {
      console.error('Erro ao carregar lojas:', error.response?.data || error.message);
      const message = error.response?.data?.message || error.message || 'Erro ao conectar com o servidor';
      if (error.response?.status === 401 && (message.includes('Token inválido') || message.includes('Token não fornecido'))) {
        try {
          localStorage.removeItem('superAdminToken');
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
        } catch {}
        toast.error('Sessão expirada. Faça login novamente.');
        window.location.href = '/';
      } else {
        toast.error(message);
      }
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
        console.log('Dados sendo enviados para o backend:', formData);
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
      street: store.settings?.address?.street || '',
      number: store.settings?.address?.number || '',
      complement: store.settings?.address?.complement || '',
      neighborhood: store.settings?.address?.neighborhood || '',
      city: store.settings?.address?.city || '',
      state: store.settings?.address?.state || '',
      zipCode: store.settings?.address?.zipCode || '',
      ownerName: store.ownerName || '',
      ownerEmail: store.ownerEmail || store.email || '',
      ownerPassword: '', // Não pré-preencher senha por segurança
      subscriptionPlan: store.subscriptionPlan || 'Básico',
      language: store.language || 'pt-BR',
      currency: store.currency || 'BRL',
    timezone: store.timezone || 'America/Sao_Paulo',
    
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
    try {
      const response = await axios.delete(`${url}/api/system/stores/${storeToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        toast.success('Loja excluída com sucesso!');
        setShowDeleteModal(false);
        setStoreToDelete(null);
        setDeleteConfirmText('');
        fetchStores(); // Recarregar a lista
      } else {
        toast.error(response.data.message || 'Erro ao excluir loja');
      }
    } catch (error) {
      console.error('Erro ao excluir loja:', error);
      
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
        // Toggle store status function called
        
        if (!token) {
      console.error('Token não encontrado');
      toast.error('Token de autenticação não encontrado. Faça login novamente.');
      return;
    }
    
    setLoading(true);
    try {
      const newStatus = currentStatus === 'active' ? 'suspended' : 'active';
      
      const requestUrl = `${url}/api/system/stores/${storeId}/status`;
      const requestData = { status: newStatus };
      const requestHeaders = { Authorization: `Bearer ${token}` };
      
      const response = await axios.put(requestUrl, requestData, { headers: requestHeaders });
      
      if (response.data.success) {
        toast.success(`Loja ${newStatus === 'active' ? 'ativada' : 'desativada'} com sucesso!`);
        fetchStores();
      } else {
        toast.error(response.data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da loja:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao atualizar status da loja');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      restaurantAddress: '',
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zipCode: '',
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      subscriptionPlan: 'Básico',
      language: 'pt-BR',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      
    });
    setEditingStore(null);
    setShowForm(false);
  };

  // Funções utilitárias
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Proprietário', 'Email', 'Status', 'Plano', 'Data de Criação'];
    const csvContent = [
      headers.join(','),
      ...filteredStores.map(store => [
        `"${store.name}"`,
        `"${store.ownerName}"`,
        `"${store.ownerEmail}"`,
        `"${store.status}"`,
        `"${store.subscription?.plan || store.subscriptionPlan}"`,
        `"${new Date(store.createdAt).toLocaleDateString('pt-BR')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `lojas_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Paginação
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStores = filteredStores.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className='store-management'>
      <div className='store-management-header'>
        <div className='header-content'>
          <h2>Gerenciamento de Lojas</h2>
          <div className='header-actions'>
            <button 
              className='btn btn-secondary export-btn'
              onClick={exportToCSV}
              disabled={loading}
            >
              <i className='ti ti-download me-1'></i> Exportar CSV
            </button>
            <button 
              className='btn btn-primary add-store-btn'
              onClick={() => setShowForm(true)}
              disabled={loading}
            >
              <i className='ti ti-plus me-1'></i> Nova Loja
            </button>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className='store-stats'>
        <div className='card stat-card'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-building-store'></i></div>
            <div className='stat-content'>
              <h3>{storeStats.total}</h3>
              <p>Total de Lojas</p>
            </div>
          </div>
        </div>
        <div className='card stat-card active'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-circle-check'></i></div>
            <div className='stat-content'>
              <h3>{storeStats.active}</h3>
              <p>Lojas Ativas</p>
            </div>
          </div>
        </div>
        <div className='card stat-card suspended'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-player-pause'></i></div>
            <div className='stat-content'>
              <h3>{storeStats.suspended}</h3>
              <p>Lojas Suspensas</p>
            </div>
          </div>
        </div>
        <div className='card stat-card pending'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-hourglass'></i></div>
            <div className='stat-content'>
              <h3>{storeStats.pending}</h3>
              <p>Lojas Pendentes</p>
            </div>
          </div>
        </div>
        <div className='card stat-card revenue'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-coins'></i></div>
            <div className='stat-content'>
              <h3>{formatCurrency(storeStats.totalRevenue)}</h3>
              <p>Receita Total</p>
            </div>
          </div>
        </div>
        <div className='card stat-card avg-revenue'>
          <div className='card-body d-flex align-items-center gap-3'>
            <div className='stat-icon'><i className='ti ti-trending-up'></i></div>
            <div className='stat-content'>
              <h3>{formatCurrency(storeStats.avgRevenuePerStore)}</h3>
              <p>Receita Média/Loja</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e Busca */}
      <div className='store-filters card'>
        <div className='card-body d-flex align-items-center gap-3 flex-wrap'>
        <div className='search-box'>
          <input
            type='text'
            placeholder='Buscar por nome, proprietário ou email...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className='filter-group'>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value='all'>Todos os Status</option>
            <option value='active'>Ativas</option>
            <option value='suspended'>Suspensas</option>
            <option value='pending'>Pendentes</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value='all'>Todos os Planos</option>
            <option value='Básico'>Básico</option>
            <option value='Premium'>Premium</option>
            <option value='Enterprise'>Enterprise</option>
          </select>
        </div>
        <div className='results-info ms-auto'>
          Mostrando {currentStores.length} de {filteredStores.length} lojas
        </div>
        </div>
      </div>

      {showForm && (
        <div className='store-form-overlay'>
          <div className='store-form card'>
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
              
              <div className='form-row'>
                <div className='form-group'>
                  <label>Rua *</label>
                  <input
                    type='text'
                    name='street'
                    value={formData.street}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='form-group'>
                  <label>Número *</label>
                  <input
                    type='text'
                    name='number'
                    value={formData.number}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className='form-row'>
                <div className='form-group'>
                  <label>Complemento</label>
                  <input
                    type='text'
                    name='complement'
                    value={formData.complement}
                    onChange={handleInputChange}
                  />
                </div>
                <div className='form-group'>
                  <label>Bairro *</label>
                  <input
                    type='text'
                    name='neighborhood'
                    value={formData.neighborhood}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className='form-row'>
                <div className='form-group'>
                  <label>Cidade *</label>
                  <input
                    type='text'
                    name='city'
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className='form-group'>
                  <label>Estado *</label>
                  <input
                    type='text'
                    name='state'
                    value={formData.state}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>
              
              <div className='form-group'>
                <label>CEP *</label>
                <input
                  type='text'
                  name='zipCode'
                  value={formData.zipCode}
                  onChange={handleInputChange}
                  required
                  placeholder='00000-000'
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
                <button type='button' className='btn btn-outline' onClick={resetForm}>Cancelar</button>
                <button type='submit' className='btn btn-primary' disabled={loading}>
                  {loading ? 'Salvando...' : (editingStore ? 'Atualizar' : 'Criar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className='store-form-overlay'>
          <div className='delete-modal card'>
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
                className='btn btn-outline cancel-btn'
                onClick={cancelDelete}
              >
                Cancelar
              </button>
              <button 
                type='button' 
                className='btn btn-danger confirm-delete-btn'
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
        
        {!loading && filteredStores.length === 0 && (
          <div className='no-stores'>
            {stores.length === 0 ? 'Nenhuma loja encontrada' : 'Nenhuma loja corresponde aos filtros aplicados'}
          </div>
        )}
        
        {!loading && filteredStores.length > 0 && (
          <>
            <div className='card'>
              <div className='card-body'>
                <div className='table-responsive'>
                  <table className='stores-table table table-vcenter table-hover'>
                <thead>
                  <tr>
                    <th 
                      className={`sortable ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('name')}
                    >
                      Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortBy === 'ownerName' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('ownerName')}
                    >
                      Proprietário {sortBy === 'ownerName' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Email</th>
                    <th 
                      className={`sortable ${sortBy === 'status' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortBy === 'plan' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('plan')}
                    >
                      Plano {sortBy === 'plan' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th 
                      className={`sortable ${sortBy === 'createdAt' ? `sorted-${sortOrder}` : ''}`}
                      onClick={() => handleSort('createdAt')}
                    >
                      Criada em {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStores.map(store => (
                    <tr key={store._id} className={store.status !== 'active' ? 'inactive' : ''}>
                      <td>
                        <div className='store-info'>
                          <strong>{store.name}</strong>
                          {store.description && <small>{store.description}</small>}
                        </div>
                      </td>
                      <td>{store.ownerName}</td>
                      <td>{store.ownerEmail}</td>
                      <td>
                        <span className={`status ${store.status}`}>
                          {store.status === 'active' ? '✅ Ativa' : 
                           store.status === 'suspended' ? '⏸️ Suspensa' :
                           store.status === 'pending' ? '⏳ Pendente' : '❌ Inativa'}
                        </span>
                      </td>
                      <td>
                        <span className={`plan ${(store.subscription?.plan || store.subscriptionPlan).toLowerCase()}`}>
                          {store.subscription?.plan || store.subscriptionPlan}
                        </span>
                      </td>
                      <td>{new Date(store.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td className='actions'>
                      <button 
                        className='btn edit-btn'
                        onClick={() => handleEdit(store)}
                        disabled={loading}
                        title='Editar loja'
                      >
                        <i className='ti ti-pencil'></i>
                      </button>
                      <button 
                        className={`btn toggle-btn ${store.status === 'active' ? 'active' : 'inactive'}`}
                        onClick={() => toggleStoreStatus(store._id, store.status)}
                        disabled={loading}
                        title={store.status === 'active' ? 'Desativar loja' : 'Ativar loja'}
                      >
                        {store.status === 'active' ? <i className='ti ti-player-pause'></i> : <i className='ti ti-player-play'></i>}
                      </button>
                      <button 
                        className='btn delete-btn'
                        onClick={() => handleDelete(store._id)}
                        disabled={loading}
                        title='Excluir loja'
                      >
                        <i className='ti ti-trash'></i>
                      </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className='pagination'>
                <button 
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='btn pagination-btn'
                >
                  ← Anterior
                </button>
                
                <div className='pagination-info'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`btn pagination-btn ${currentPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button 
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='btn pagination-btn'
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StoreManagement;
