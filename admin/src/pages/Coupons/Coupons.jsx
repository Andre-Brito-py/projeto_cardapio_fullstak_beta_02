import React, { useState, useEffect } from 'react';
import './Coupons.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Coupons = ({ url }) => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [showStats, setShowStats] = useState(null);
  const [couponStats, setCouponStats] = useState(null);
  
  // Form states
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState('percentage');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [validFrom, setValidFrom] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [firstTimeUserOnly, setFirstTimeUserOnly] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoadingCoupons(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/coupons/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCoupons(response.data.data);
      } else {
        toast.error('Erro ao carregar cupons');
      }
    } catch (error) {
      console.error('Erro ao buscar cupons:', error);
      toast.error('Erro ao carregar cupons');
    } finally {
      setLoadingCoupons(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setCode('');
    setName('');
    setDescription('');
    setDiscountType('percentage');
    setDiscountValue('');
    setMinOrderValue('');
    setMaxDiscountAmount('');
    setMaxUses('');
    setMaxUsesPerUser('1');
    setValidFrom('');
    setValidUntil('');
    setFirstTimeUserOnly(false);
    setIsActive(true);
    setEditingCoupon(null);
    setShowAddForm(false);
  };

  // Add or update coupon
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!code.trim() || !name.trim() || !discountValue || !validUntil) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }
    
    if (discountType === 'percentage' && (discountValue < 0 || discountValue > 100)) {
      toast.error('Desconto percentual deve estar entre 0 e 100');
      return;
    }
    
    if (discountType === 'fixed' && discountValue < 0) {
      toast.error('Valor do desconto deve ser positivo');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const couponData = {
        code: code.toUpperCase(),
        name,
        description,
        discountType,
        discountValue: parseFloat(discountValue),
        minOrderValue: minOrderValue ? parseFloat(minOrderValue) : 0,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        maxUsesPerUser: parseInt(maxUsesPerUser),
        validFrom: validFrom || new Date().toISOString(),
        validUntil,
        firstTimeUserOnly,
        isActive
      };
      
      let response;
      if (editingCoupon) {
        response = await axios.put(`${url}/api/coupons/${editingCoupon._id}`, couponData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${url}/api/coupons/create`, couponData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(editingCoupon ? 'Cupom atualizado com sucesso!' : 'Cupom criado com sucesso!');
        resetForm();
        fetchCoupons();
      } else {
        toast.error(response.data.message || 'Erro ao salvar cupom');
      }
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao salvar cupom');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit coupon
  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setCode(coupon.code);
    setName(coupon.name);
    setDescription(coupon.description || '');
    setDiscountType(coupon.discountType);
    setDiscountValue(coupon.discountValue.toString());
    setMinOrderValue(coupon.minOrderValue ? coupon.minOrderValue.toString() : '');
    setMaxDiscountAmount(coupon.maxDiscountAmount ? coupon.maxDiscountAmount.toString() : '');
    setMaxUses(coupon.maxUses ? coupon.maxUses.toString() : '');
    setMaxUsesPerUser(coupon.maxUsesPerUser.toString());
    setValidFrom(coupon.validFrom ? new Date(coupon.validFrom).toISOString().slice(0, 16) : '');
    setValidUntil(new Date(coupon.validUntil).toISOString().slice(0, 16));
    setFirstTimeUserOnly(coupon.firstTimeUserOnly);
    setIsActive(coupon.isActive);
    setShowAddForm(true);
  };

  // Delete coupon
  const handleDelete = async (couponId) => {
    if (!window.confirm('Tem certeza que deseja excluir este cupom?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${url}/api/coupons/${couponId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Cupom excluído com sucesso!');
        fetchCoupons();
      } else {
        toast.error('Erro ao excluir cupom');
      }
    } catch (error) {
      console.error('Erro ao excluir cupom:', error);
      toast.error('Erro ao excluir cupom');
    }
  };

  // Toggle coupon status
  const toggleCouponStatus = async (couponId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(`${url}/api/coupons/${couponId}/toggle-status`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Status do cupom atualizado!');
        fetchCoupons();
      } else {
        toast.error('Erro ao atualizar status do cupom');
      }
    } catch (error) {
      console.error('Erro ao atualizar status do cupom:', error);
      toast.error('Erro ao atualizar status do cupom');
    }
  };

  // Get coupon statistics
  const getCouponStats = async (couponId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/coupons/${couponId}/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCouponStats(response.data.data);
        setShowStats(couponId);
      } else {
        toast.error('Erro ao carregar estatísticas');
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      toast.error('Erro ao carregar estatísticas');
    }
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if coupon is expired
  const isCouponExpired = (validUntil) => {
    return new Date(validUntil) < new Date();
  };

  // Check if coupon is exhausted
  const isCouponExhausted = (coupon) => {
    return coupon.maxUses && coupon.usedCount >= coupon.maxUses;
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  return (
    <div className="coupons">
      <div className="coupons-header">
        <h2>Gerenciamento de Cupons</h2>
        <div className="header-actions">
          <button 
            className="add-btn"
            onClick={() => setShowAddForm(true)}
            disabled={loading}
          >
            + Adicionar Cupom
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCoupon ? 'Editar Cupom' : 'Adicionar Novo Cupom'}</h3>
              <button className="close-btn" onClick={resetForm}>×</button>
            </div>
            
            <form onSubmit={handleSubmit} className="coupon-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Código do Cupom *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Ex: DESCONTO10"
                    maxLength={20}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Nome do Cupom *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Desconto de 10%"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descrição</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descrição opcional do cupom"
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Tipo de Desconto *</label>
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                    required
                  >
                    <option value="percentage">Percentual (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                    <option value="free_shipping">Frete Grátis</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    {discountType === 'percentage' ? 'Percentual de Desconto (%) *' : 'Valor do Desconto (R$) *'}
                  </label>
                  <input
                    type="number"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    placeholder={discountType === 'percentage' ? '10' : '5.00'}
                    min="0"
                    max={discountType === 'percentage' ? '100' : undefined}
                    step={discountType === 'percentage' ? '1' : '0.01'}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Valor Mínimo do Pedido (R$)</label>
                  <input
                    type="number"
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                {discountType === 'percentage' && (
                  <div className="form-group">
                    <label>Desconto Máximo (R$)</label>
                    <input
                      type="number"
                      value={maxDiscountAmount}
                      onChange={(e) => setMaxDiscountAmount(e.target.value)}
                      placeholder="Opcional"
                      min="0"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Limite Total de Usos</label>
                  <input
                    type="number"
                    value={maxUses}
                    onChange={(e) => setMaxUses(e.target.value)}
                    placeholder="Ilimitado"
                    min="1"
                  />
                </div>
                <div className="form-group">
                  <label>Limite por Usuário *</label>
                  <input
                    type="number"
                    value={maxUsesPerUser}
                    onChange={(e) => setMaxUsesPerUser(e.target.value)}
                    placeholder="1"
                    min="1"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Válido a partir de</label>
                  <input
                    type="datetime-local"
                    value={validFrom}
                    onChange={(e) => setValidFrom(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Válido até *</label>
                  <input
                    type="datetime-local"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={firstTimeUserOnly}
                      onChange={(e) => setFirstTimeUserOnly(e.target.checked)}
                    />
                    Apenas para novos usuários
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                    />
                    Cupom ativo
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-btn">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="submit-btn">
                  {loading ? 'Salvando...' : (editingCoupon ? 'Atualizar' : 'Criar Cupom')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStats && couponStats && (
        <div className="modal-overlay">
          <div className="modal-content stats-modal">
            <div className="modal-header">
              <h3>Estatísticas do Cupom</h3>
              <button className="close-btn" onClick={() => setShowStats(null)}>×</button>
            </div>
            
            <div className="stats-content">
              <div className="stats-grid">
                <div className="stat-card">
                  <h4>Total de Usos</h4>
                  <p className="stat-value">{couponStats.totalUses}</p>
                </div>
                <div className="stat-card">
                  <h4>Desconto Total Concedido</h4>
                  <p className="stat-value">{formatCurrency(couponStats.totalDiscountGiven)}</p>
                </div>
                <div className="stat-card">
                  <h4>Valor Total dos Pedidos</h4>
                  <p className="stat-value">{formatCurrency(couponStats.totalOrderValue)}</p>
                </div>
                <div className="stat-card">
                  <h4>Usuários Únicos</h4>
                  <p className="stat-value">{couponStats.uniqueUsers}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coupons List */}
      <div className="coupons-list">
        {loadingCoupons ? (
          <div className="loading">Carregando cupons...</div>
        ) : coupons.length === 0 ? (
          <div className="no-data">
            <p>Nenhum cupom encontrado</p>
            <button className="add-btn" onClick={() => setShowAddForm(true)}>
              Criar Primeiro Cupom
            </button>
          </div>
        ) : (
          <div className="coupons-table">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nome</th>
                  <th>Tipo</th>
                  <th>Desconto</th>
                  <th>Usos</th>
                  <th>Validade</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className={!coupon.isActive ? 'inactive' : ''}>
                    <td>
                      <span className="coupon-code">{coupon.code}</span>
                    </td>
                    <td>{coupon.name}</td>
                    <td>
                      <span className={`discount-type ${coupon.discountType}`}>
                        {coupon.discountType === 'percentage' ? 'Percentual' : 
                         coupon.discountType === 'fixed' ? 'Fixo' : 'Frete Grátis'}
                      </span>
                    </td>
                    <td>
                      {coupon.discountType === 'percentage' ? 
                        `${coupon.discountValue}%` : 
                        coupon.discountType === 'fixed' ? 
                        formatCurrency(coupon.discountValue) : 
                        'Frete Grátis'
                      }
                    </td>
                    <td>
                      <span className="usage-info">
                        {coupon.usedCount}/{coupon.maxUses || '∞'}
                      </span>
                    </td>
                    <td>
                      <span className="validity-info">
                        {formatDate(coupon.validUntil)}
                      </span>
                    </td>
                    <td>
                      <span className={`status ${
                        !coupon.isActive ? 'inactive' :
                        isCouponExpired(coupon.validUntil) ? 'expired' :
                        isCouponExhausted(coupon) ? 'exhausted' : 'active'
                      }`}>
                        {!coupon.isActive ? 'Inativo' :
                         isCouponExpired(coupon.validUntil) ? 'Expirado' :
                         isCouponExhausted(coupon) ? 'Esgotado' : 'Ativo'
                        }
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(coupon)}
                          title="Editar"
                        >
                          ✏️
                        </button>
                        <button 
                          className="stats-btn"
                          onClick={() => getCouponStats(coupon._id)}
                          title="Estatísticas"
                        >
                          📊
                        </button>
                        <button 
                          className={`toggle-btn ${coupon.isActive ? 'active' : 'inactive'}`}
                          onClick={() => toggleCouponStatus(coupon._id, coupon.isActive)}
                          title={coupon.isActive ? 'Desativar' : 'Ativar'}
                        >
                          {coupon.isActive ? '🔴' : '🟢'}
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(coupon._id)}
                          title="Excluir"
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
        )}
      </div>
    </div>
  );
};

export default Coupons;