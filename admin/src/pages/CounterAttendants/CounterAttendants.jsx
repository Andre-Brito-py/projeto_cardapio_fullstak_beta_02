import React, { useState, useEffect } from 'react';
import './CounterAttendants.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const CounterAttendants = ({ url }) => {
  const [attendants, setAttendants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAttendant, setEditingAttendant] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    shift: 'morning',
    permissions: []
  });

  const shifts = [
    { value: 'morning', label: 'Manhã' },
    { value: 'afternoon', label: 'Tarde' },
    { value: 'night', label: 'Noite' },
    { value: 'full', label: 'Integral' }
  ];

  const availablePermissions = [
    { value: 'create_orders', label: 'Criar Pedidos' },
    { value: 'view_reports', label: 'Ver Relatórios' },
    { value: 'manage_products', label: 'Gerenciar Produtos' }
  ];

  useEffect(() => {
    fetchAttendants();
  }, []);

  const fetchAttendants = async () => {
    try {
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');
      
      if (!storeId) {
        toast.error('ID da loja não encontrado. Faça login novamente.');
        return;
      }
      
      const response = await axios.get(`${url}/api/counter-attendant/store/${storeId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.data.success) {
        setAttendants(response.data.attendants || []);
      } else {
        toast.error(response.data.message || 'Erro ao carregar atendentes');
      }
    } catch (error) {
      console.error('Erro ao buscar atendentes:', error);
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

  const handlePermissionChange = (permission) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      const storeId = localStorage.getItem('storeId');
      const endpoint = editingAttendant 
        ? `${url}/api/counter-attendant/${editingAttendant._id}`
        : `${url}/api/counter-attendant/register`;
      
      const method = editingAttendant ? 'put' : 'post';
      const submitData = editingAttendant 
        ? { name: formData.name, shift: formData.shift, permissions: formData.permissions }
        : { ...formData, storeId };

      const response = await axios[method](endpoint, submitData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(editingAttendant ? 'Atendente atualizado com sucesso!' : 'Atendente cadastrado com sucesso!');
        setShowForm(false);
        setEditingAttendant(null);
        setFormData({
          name: '',
          email: '',
          password: '',
          shift: 'morning',
          permissions: []
        });
        fetchAttendants();
      } else {
        toast.error(response.data.message || 'Erro ao salvar atendente');
      }
    } catch (error) {
      console.error('Erro ao salvar atendente:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const handleEdit = (attendant) => {
    setEditingAttendant(attendant);
    setFormData({
      name: attendant.name,
      email: attendant.email,
      password: '',
      shift: attendant.shift,
      permissions: attendant.permissions || []
    });
    setShowForm(true);
  };

  const toggleAttendantStatus = async (attendantId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `${url}/api/counter-attendant/${attendantId}/toggle-status`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        toast.success(`Atendente ${currentStatus ? 'desativado' : 'ativado'} com sucesso!`);
        fetchAttendants();
      } else {
        toast.error(response.data.message || 'Erro ao alterar status');
      }
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingAttendant(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      shift: 'morning',
      permissions: []
    });
  };

  if (loading) {
    return <div className="loading">Carregando atendentes...</div>;
  }

  const copyCounterLink = () => {
    const counterUrl = window.location.origin.replace(':5174', ':5176');
    navigator.clipboard.writeText(counterUrl).then(() => {
      toast.success('Link copiado para a área de transferência!');
    }).catch(() => {
      toast.error('Erro ao copiar link');
    });
  };

  return (
    <div className="counter-attendants">
      <div className="header">
        <h1>Atendentes de Balcão</h1>
        <button 
          className="btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          + Novo Atendente
        </button>
      </div>

      <div className="counter-link-section">
        <div className="link-info">
          <h3>🔗 Link de Acesso para Atendentes</h3>
          <p>Compartilhe este link com seus atendentes para que possam acessar o sistema de balcão:</p>
          <div className="link-container">
            <input 
              type="text" 
              value={window.location.origin.replace(':5174', ':5176')} 
              readOnly 
              className="link-input"
            />
            <button 
              className="btn-copy" 
              onClick={copyCounterLink}
              title="Copiar link"
            >
              📋 Copiar
            </button>
          </div>
          <small className="link-note">
            💡 Os atendentes usarão suas credenciais (email e senha) para fazer login neste sistema.
          </small>
        </div>
      </div>

      {showForm && (
        <div className="form-container">
          <div className="form-header">
            <h2>{editingAttendant ? 'Editar Atendente' : 'Novo Atendente'}</h2>
            <button className="btn-close" onClick={cancelForm}>×</button>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Nome Completo *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Digite o nome completo"
              />
            </div>

            {!editingAttendant && (
              <>
                <div className="form-group">
                  <label>Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="Digite o email"
                  />
                </div>

                <div className="form-group">
                  <label>Senha *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    minLength={6}
                    placeholder="Digite a senha (mín. 6 caracteres)"
                  />
                </div>
              </>
            )}

            <div className="form-group">
              <label>Turno *</label>
              <select
                name="shift"
                value={formData.shift}
                onChange={handleInputChange}
                required
              >
                {shifts.map(shift => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Permissões</label>
              <div className="permissions-grid">
                {availablePermissions.map(permission => (
                  <label key={permission.value} className="permission-item">
                    <input
                      type="checkbox"
                      checked={formData.permissions.includes(permission.value)}
                      onChange={() => handlePermissionChange(permission.value)}
                    />
                    <span>{permission.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={cancelForm}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                {editingAttendant ? 'Atualizar' : 'Cadastrar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="attendants-list">
        {attendants.length === 0 ? (
          <div className="empty-state">
            <p>Nenhum atendente cadastrado</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Turno</th>
                  <th>Pedidos</th>
                  <th>Status</th>
                  <th>Cadastro</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {attendants.map(attendant => (
                  <tr key={attendant._id}>
                    <td>
                      <div className="attendant-info">
                        <strong>{attendant.name}</strong>
                        {attendant.permissions && attendant.permissions.length > 0 && (
                          <div className="permissions">
                            {attendant.permissions.map(permission => (
                              <span key={permission} className="permission-badge">
                                {availablePermissions.find(p => p.value === permission)?.label || permission}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                    <td>{attendant.email}</td>
                    <td>
                      <span className={`shift-badge shift-${attendant.shift}`}>
                        {shifts.find(s => s.value === attendant.shift)?.label || attendant.shift}
                      </span>
                    </td>
                    <td>{attendant.orderCount || 0}</td>
                    <td>
                      <span className={`status-badge ${attendant.isActive ? 'active' : 'inactive'}`}>
                        {attendant.isActive ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>{new Date(attendant.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td>
                      <div className="actions">
                        <button 
                          className="btn-edit"
                          onClick={() => handleEdit(attendant)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className={`btn-toggle ${attendant.isActive ? 'deactivate' : 'activate'}`}
                          onClick={() => toggleAttendantStatus(attendant._id, attendant.isActive)}
                          title={attendant.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {attendant.isActive ? '🔒' : '🔓'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CounterAttendants;