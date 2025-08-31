import React, { useState, useEffect } from 'react';
import './UserManagement.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const UserManagement = ({ url }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterStore, setFilterStore] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);
  const [bulkAction, setBulkAction] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'customer',
    isActive: true,
    storeId: '',
    permissions: {
      dashboard: { read: true, write: false },
      orders: { read: true, write: false, delete: false },
      products: { read: true, write: false, delete: false },
      users: { read: false, write: false, delete: false },
      analytics: { read: true, write: false },
      settings: { read: false, write: false },
      financial: { read: false, write: false }
    },
    profile: {
      phone: '',
      address: '',
      department: '',
      lastLogin: null,
      loginAttempts: 0,
      twoFactorEnabled: false
    }
  });
  const [stores, setStores] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    storeAdmins: 0,
    customers: 0,
    superAdmins: 0,
    newUsersThisMonth: 0,
    activeUsersToday: 0,
    suspendedUsers: 0
  });

  useEffect(() => {
    fetchUsers();
    fetchStores();
    fetchStats();
  }, []);

  // Fetch audit logs for a specific user
  const fetchAuditLogs = async (userId) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.get(`${url}/api/system/users/${userId}/audit`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setAuditLogs(response.data.logs);
      }
    } catch (error) {
      console.error('Erro ao buscar logs de auditoria:', error);
      toast.error('Erro ao carregar logs de auditoria');
    }
  };

  // Update user permissions
  const updateUserPermissions = async (userId, permissions) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.put(`${url}/api/system/users/${userId}/permissions`, 
        { permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Permissões atualizadas com sucesso!');
        fetchUsers();
        setShowPermissionsModal(false);
      } else {
        toast.error('Erro ao atualizar permissões');
      }
    } catch (error) {
      console.error('Erro ao atualizar permissões:', error);
      toast.error('Erro ao atualizar permissões');
    }
  };

  // Bulk actions
  const handleBulkAction = async () => {
    if (!bulkAction || selectedUsers.length === 0) {
      toast.warning('Selecione usuários e uma ação');
      return;
    }

    const confirmMessage = `Tem certeza que deseja ${bulkAction} ${selectedUsers.length} usuário(s)?`;
    if (!window.confirm(confirmMessage)) return;

    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.post(`${url}/api/system/users/bulk-action`, 
        { action: bulkAction, userIds: selectedUsers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Ação ${bulkAction} executada com sucesso!`);
        fetchUsers();
        fetchStats();
        setSelectedUsers([]);
        setBulkAction('');
      } else {
        toast.error('Erro ao executar ação em lote');
      }
    } catch (error) {
      console.error('Erro na ação em lote:', error);
      toast.error('Erro ao executar ação em lote');
    }
  };

  // Export users data
  const exportUsers = () => {
    const csvData = filteredUsers.map(user => ({
      Nome: user.name,
      Email: user.email,
      Role: user.role,
      Status: user.isActive ? 'Ativo' : 'Inativo',
      Loja: getStoreName(user.storeId),
      'Criado em': new Date(user.createdAt).toLocaleDateString('pt-BR'),
      'Último Login': user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `usuarios_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.get(`${url}/api/system/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setUsers(response.data.users);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.get(`${url}/api/system/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.get(`${url}/api/system/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStats(response.data.stats.users);
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('superAdminToken');
      const endpoint = editingUser 
        ? `${url}/api/system/users/${editingUser._id}`
        : `${url}/api/system/users`;
      
      const method = editingUser ? 'put' : 'post';
      const submitData = { ...formData };
      
      // Remove password if editing and password is empty
      if (editingUser && !submitData.password) {
        delete submitData.password;
      }
      
      const response = await axios[method](endpoint, submitData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(editingUser ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!');
        fetchUsers();
        fetchStats();
        resetForm();
        setShowModal(false);
      } else {
        toast.error(response.data.message || 'Erro ao salvar usuário');
      }
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      toast.error(error.response?.data?.message || 'Erro ao salvar usuário');
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive,
      storeId: user.storeId || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Tem certeza que deseja deletar este usuário?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.delete(`${url}/api/system/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Usuário deletado com sucesso!');
        fetchUsers();
        fetchStats();
      } else {
        toast.error('Erro ao deletar usuário');
      }
    } catch (error) {
      console.error('Erro ao deletar usuário:', error);
      toast.error('Erro ao deletar usuário');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.put(`${url}/api/system/users/${userId}/status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success(`Usuário ${!currentStatus ? 'ativado' : 'desativado'} com sucesso!`);
        fetchUsers();
        fetchStats();
      } else {
        toast.error('Erro ao alterar status do usuário');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status do usuário');
    }
  };

  const resetPassword = async (userId) => {
    if (!window.confirm('Tem certeza que deseja resetar a senha deste usuário?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('superAdminToken');
      const response = await axios.post(`${url}/api/system/users/${userId}/reset-password`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(`Senha resetada! Nova senha: ${response.data.newPassword}`);
      } else {
        toast.error('Erro ao resetar senha');
      }
    } catch (error) {
      console.error('Erro ao resetar senha:', error);
      toast.error('Erro ao resetar senha');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'customer',
      isActive: true,
      storeId: '',
      permissions: {
        dashboard: { read: true, write: false },
        orders: { read: true, write: false, delete: false },
        products: { read: true, write: false, delete: false },
        users: { read: false, write: false, delete: false },
        analytics: { read: true, write: false },
        settings: { read: false, write: false },
        financial: { read: false, write: false }
      },
      profile: {
        phone: '',
        address: '',
        department: '',
        lastLogin: null,
        loginAttempts: 0,
        twoFactorEnabled: false
      }
    });
    setEditingUser(null);
  };

  // Handle sorting
  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Handle user selection for bulk actions
  const handleUserSelection = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users
  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(user => user._id));
    }
  };

  // Open permissions modal
  const openPermissionsModal = (user) => {
    setSelectedUser(user);
    setShowPermissionsModal(true);
  };

  // Open audit modal
  const openAuditModal = (user) => {
    setSelectedUser(user);
    fetchAuditLogs(user._id);
    setShowAuditModal(true);
  };

  // Filter and search logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.profile?.phone && user.profile.phone.includes(searchTerm)) ||
                         (user.profile?.department && user.profile.department.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.isActive) ||
                         (filterStatus === 'inactive' && !user.isActive);
    const matchesStore = filterStore === 'all' || user.storeId === filterStore;
    
    return matchesSearch && matchesRole && matchesStatus && matchesStore;
  }).sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    // Handle nested properties
    if (sortBy === 'storeName') {
      aValue = getStoreName(a.storeId);
      bValue = getStoreName(b.storeId);
    }
    
    if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
      aValue = new Date(aValue || 0);
      bValue = new Date(bValue || 0);
    }
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination logic
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  const getStoreName = (storeId) => {
    const store = stores.find(s => s._id === storeId);
    return store ? store.name : 'N/A';
  };

  if (loading) {
    return <div className="loading">Carregando usuários...</div>;
  }

  return (
    <div className="user-management">
      <div className="user-management-header">
        <div className="header-left">
          <h2>Gerenciamento de Usuários</h2>
          <span className="results-count">{filteredUsers.length} usuário(s) encontrado(s)</span>
        </div>
        <div className="header-actions">
          <button className="export-btn" onClick={exportUsers}>
            📊 Exportar CSV
          </button>
          <button 
            className="btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Novo Usuário
          </button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <h3>{stats.totalUsers}</h3>
            <p>Total de Usuários</p>
          </div>
        </div>
        <div className="stat-card active">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{stats.activeUsers}</h3>
            <p>Usuários Ativos</p>
          </div>
        </div>
        <div className="stat-card admins">
          <div className="stat-icon">👨‍💼</div>
          <div className="stat-content">
            <h3>{stats.storeAdmins}</h3>
            <p>Administradores</p>
          </div>
        </div>
        <div className="stat-card customers">
          <div className="stat-icon">🛒</div>
          <div className="stat-content">
            <h3>{stats.customers}</h3>
            <p>Clientes</p>
          </div>
        </div>
        <div className="stat-card superadmins">
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>{stats.superAdmins}</h3>
            <p>Super Admins</p>
          </div>
        </div>
        <div className="stat-card new-users">
          <div className="stat-icon">📈</div>
          <div className="stat-content">
            <h3>{stats.newUsersThisMonth}</h3>
            <p>Novos este Mês</p>
          </div>
        </div>
        <div className="stat-card active-today">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>{stats.activeUsersToday}</h3>
            <p>Ativos Hoje</p>
          </div>
        </div>
        <div className="stat-card suspended">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <h3>{stats.suspendedUsers}</h3>
            <p>Suspensos</p>
          </div>
        </div>
      </div>

      {/* Advanced Filters and Bulk Actions */}
      <div className="user-controls">
        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="🔍 Buscar por nome, email, telefone ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)}
            >
              <option value="all">Todos os Roles</option>
              <option value="customer">Cliente</option>
              <option value="admin">Administrador</option>
              <option value="superadmin">Super Admin</option>
            </select>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
            </select>
            <select 
              value={filterStore} 
              onChange={(e) => setFilterStore(e.target.value)}
            >
              <option value="all">Todas as Lojas</option>
              {stores.map(store => (
                <option key={store._id} value={store._id}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedUsers.length > 0 && (
          <div className="bulk-actions">
            <span className="selected-count">{selectedUsers.length} selecionado(s)</span>
            <select 
              value={bulkAction} 
              onChange={(e) => setBulkAction(e.target.value)}
            >
              <option value="">Selecionar Ação</option>
              <option value="activate">Ativar</option>
              <option value="deactivate">Desativar</option>
              <option value="delete">Excluir</option>
              <option value="reset-password">Resetar Senha</option>
            </select>
            <button 
              className="bulk-action-btn"
              onClick={handleBulkAction}
              disabled={!bulkAction}
            >
              Executar
            </button>
            <button 
              className="clear-selection-btn"
              onClick={() => setSelectedUsers([])}
            >
              Limpar Seleção
            </button>
          </div>
        )}
      </div>

      {/* Enhanced Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                  onChange={handleSelectAll}
                  title="Selecionar todos"
                />
              </th>
              <th 
                className={`sortable ${sortBy === 'name' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('name')}
              >
                Nome {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'email' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('email')}
              >
                Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'role' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('role')}
              >
                Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'storeName' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('storeName')}
              >
                Loja {sortBy === 'storeName' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'isActive' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('isActive')}
              >
                Status {sortBy === 'isActive' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th 
                className={`sortable ${sortBy === 'createdAt' ? `sorted-${sortOrder}` : ''}`}
                onClick={() => handleSort('createdAt')}
              >
                Criado em {sortBy === 'createdAt' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user._id} className={selectedUsers.includes(user._id) ? 'selected' : ''}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelection(user._id)}
                  />
                </td>
                <td>
                  <div className="user-info">
                    <strong>{user.name}</strong>
                    {user.profile?.department && (
                      <small>{user.profile.department}</small>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-contact">
                    <div>{user.email}</div>
                    {user.profile?.phone && (
                      <small>{user.profile.phone}</small>
                    )}
                  </div>
                </td>
                <td>
                  <span className={`role ${user.role}`}>
                    {user.role === 'customer' ? 'Cliente' : 
                     user.role === 'admin' ? 'Admin' : 'Super Admin'}
                  </span>
                </td>
                <td>{getStoreName(user.storeId)}</td>
                <td>
                  <span className={`status ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</td>
                <td>
                  <div className="actions">
                    <button 
                      className="edit-btn"
                      onClick={() => handleEdit(user)}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button 
                      className="permissions-btn"
                      onClick={() => openPermissionsModal(user)}
                      title="Gerenciar Permissões"
                    >
                      🔐
                    </button>
                    <button 
                      className="audit-btn"
                      onClick={() => openAuditModal(user)}
                      title="Ver Auditoria"
                    >
                      📋
                    </button>
                    <button 
                      className={`toggle-btn ${user.isActive ? 'active' : 'inactive'}`}
                      onClick={() => toggleUserStatus(user._id, user.isActive)}
                      title={user.isActive ? 'Desativar' : 'Ativar'}
                    >
                      {user.isActive ? '🔒' : '🔓'}
                    </button>
                    <button 
                      className="reset-btn"
                      onClick={() => resetPassword(user._id)}
                      title="Resetar Senha"
                    >
                      🔑
                    </button>
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(user._id)}
                      title="Deletar"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </button>
          <span>Página {currentPage} de {totalPages}</span>
          <button 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Email:</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Senha {editingUser && '(deixe em branco para manter atual)'}:</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  required={!editingUser}
                />
              </div>
              <div className="form-group">
                <label>Role:</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                >
                  <option value="customer">Cliente</option>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>
              {formData.role === 'admin' && (
                <div className="form-group">
                  <label>Loja:</label>
                  <select
                    value={formData.storeId}
                    onChange={(e) => setFormData({...formData, storeId: e.target.value})}
                    required
                  >
                    <option value="">Selecione uma loja</option>
                    {stores.map(store => (
                      <option key={store._id} value={store._id}>
                        {store.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                  />
                  Usuário Ativo
                </label>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Permissions Modal */}
      {showPermissionsModal && selectedUser && (
        <div className="modal-overlay">
          <div className="permissions-modal">
            <div className="modal-header">
              <h3>Gerenciar Permissões - {selectedUser.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowPermissionsModal(false)}
              >
                ×
              </button>
            </div>
            <div className="permissions-content">
              {Object.entries(selectedUser.permissions || {}).map(([module, perms]) => (
                <div key={module} className="permission-module">
                  <h4>{module.charAt(0).toUpperCase() + module.slice(1)}</h4>
                  <div className="permission-controls">
                    {Object.entries(perms).map(([action, allowed]) => (
                      <label key={action} className="permission-item">
                        <input
                          type="checkbox"
                          checked={allowed}
                          onChange={(e) => {
                            const updatedPermissions = {
                              ...selectedUser.permissions,
                              [module]: {
                                ...selectedUser.permissions[module],
                                [action]: e.target.checked
                              }
                            };
                            setSelectedUser({
                              ...selectedUser,
                              permissions: updatedPermissions
                            });
                          }}
                        />
                        <span>{action.charAt(0).toUpperCase() + action.slice(1)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setShowPermissionsModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-primary"
                onClick={() => updateUserPermissions(selectedUser._id, selectedUser.permissions)}
              >
                Salvar Permissões
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Modal */}
      {showAuditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="audit-modal">
            <div className="modal-header">
              <h3>Auditoria - {selectedUser.name}</h3>
              <button 
                className="modal-close"
                onClick={() => setShowAuditModal(false)}
              >
                ×
              </button>
            </div>
            <div className="audit-content">
              <div className="audit-summary">
                <div className="audit-stat">
                  <span>Último Login:</span>
                  <strong>
                    {selectedUser.lastLogin 
                      ? new Date(selectedUser.lastLogin).toLocaleString('pt-BR')
                      : 'Nunca'
                    }
                  </strong>
                </div>
                <div className="audit-stat">
                  <span>Tentativas de Login:</span>
                  <strong>{selectedUser.loginAttempts || 0}</strong>
                </div>
                <div className="audit-stat">
                  <span>2FA Ativo:</span>
                  <strong>{selectedUser.profile?.twoFactorEnabled ? 'Sim' : 'Não'}</strong>
                </div>
              </div>
              
              <div className="audit-logs">
                <h4>Logs de Atividade</h4>
                <div className="logs-list">
                  {auditLogs.length > 0 ? (
                    auditLogs.map((log, index) => (
                      <div key={index} className="log-item">
                        <div className="log-time">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </div>
                        <div className="log-action">{log.action}</div>
                        <div className="log-details">{log.details}</div>
                      </div>
                    ))
                  ) : (
                    <div className="no-logs">Nenhum log de auditoria encontrado</div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button 
                type="button" 
                onClick={() => setShowAuditModal(false)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;