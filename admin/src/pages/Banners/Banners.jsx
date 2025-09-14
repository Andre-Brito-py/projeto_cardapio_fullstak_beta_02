import React, { useState, useEffect } from 'react';
import './Banners.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { url } from '../../assets/assets';

const Banners = () => {
  const [banners, setBanners] = useState([]);
  const [products, setProducts] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    image: null,
    productId: ''
  });

  const fetchBanners = async () => {
    try {
      const response = await axios.get(`${url}/api/banner/listall`, {
        headers: { token: localStorage.getItem('token') }
      });
      if (response.data.success) {
        setBanners(response.data.data);
      }
    } catch (error) {
      toast.error('Erro ao carregar banners');
    }
  };

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/food/admin/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        toast.error(response.data.message || 'Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const data = new FormData();
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('order', formData.order);
    data.append('productId', formData.productId);
    
    if (formData.image) {
      data.append('image', formData.image);
    }

    try {
      let response;
      if (editingBanner) {
        data.append('id', editingBanner._id);
        response = await axios.post(`${url}/api/banner/update`, data, {
          headers: { token: localStorage.getItem('token') }
        });
      } else {
        response = await axios.post(`${url}/api/banner/add`, data, {
          headers: { token: localStorage.getItem('token') }
        });
      }

      if (response.data.success) {
        toast.success(response.data.message);
        fetchBanners();
        resetForm();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Erro ao salvar banner');
    }
  };

  const handleDelete = async (bannerId, isDefault = false) => {
    const confirmMessage = isDefault 
      ? 'ATENÇÃO: Este é um banner padrão do sistema. Tem certeza que deseja excluí-lo? Esta ação não pode ser desfeita.'
      : 'Tem certeza que deseja excluir este banner?';
      
    if (window.confirm(confirmMessage)) {
      try {
        const requestData = { id: bannerId };
        if (isDefault) {
          requestData.confirmDefault = true;
        }
        
        const response = await axios.post(`${url}/api/banner/remove`, 
          requestData,
          { headers: { token: localStorage.getItem('token') } }
        );
        
        if (response.data.success) {
          toast.success(response.data.message);
          fetchBanners();
        } else if (response.data.requiresConfirmation) {
          // Tentar novamente com confirmação
          handleDelete(bannerId, true);
        } else {
          toast.error(response.data.message);
        }
      } catch (error) {
        toast.error('Erro ao excluir banner');
      }
    }
  };

  const handleToggleStatus = async (bannerId) => {
    try {
      const response = await axios.post(`${url}/api/banner/toggle`, 
        { id: bannerId },
        { headers: { token: localStorage.getItem('token') } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
        fetchBanners();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error('Erro ao alterar status do banner');
    }
  };

  const handleEdit = (banner) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title,
      description: banner.description,
      order: banner.order,
      image: null,
      productId: banner.productId || ''
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', order: 0, image: null, productId: '' });
    setEditingBanner(null);
    setShowAddForm(false);
  };

  useEffect(() => {
    fetchBanners();
    fetchProducts();
  }, []);

  return (
    <div className='banners'>
      <div className="banners-header">
        <h2>Gerenciar Banners</h2>
        <button 
          className="add-banner-btn" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancelar' : 'Adicionar Banner'}
        </button>
      </div>

      {showAddForm && (
        <div className="banner-form">
          <h3>{editingBanner ? 'Editar Banner' : 'Adicionar Novo Banner'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <label>Ordem de Exibição:</label>
              <input
                type="number"
                value={formData.order}
                onChange={(e) => setFormData({...formData, order: parseInt(e.target.value)})}
                min="0"
              />
            </div>
            
            <div className="form-group">
              <label>Produto Vinculado (Opcional):</label>
              <select
                value={formData.productId}
                onChange={(e) => setFormData({...formData, productId: e.target.value})}
              >
                <option value="">Nenhum produto específico</option>
                {products.map((product) => (
                  <option key={product._id} value={product._id}>
                    {product.name} - {product.category}
                  </option>
                ))}
              </select>
              <small>Se selecionado, o botão do banner direcionará para este produto específico.</small>
            </div>
            
            <div className="form-group">
              <label>Imagem:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFormData({...formData, image: e.target.files[0]})}
                required={!editingBanner}
              />
              <div className="image-recommendation">
                <p><strong>Tamanho recomendado:</strong></p>
                <ul>
                  <li>Proporção: 16:9 (widescreen)</li>
                  <li>Resolução mínima: 1200x675 pixels</li>
                  <li>Resolução ideal: 1920x1080 pixels</li>
                  <li>Formato: JPG, PNG ou WebP</li>
                  <li>Tamanho máximo: 2MB</li>
                </ul>
                <p><em>A imagem será exibida como banner principal no topo da página inicial, ocupando toda a largura da tela.</em></p>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="save-btn">
                {editingBanner ? 'Atualizar' : 'Salvar'}
              </button>
              <button type="button" className="cancel-btn" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="banners-list">
        <h3>Banners Cadastrados</h3>
        {banners.length === 0 ? (
          <p>Nenhum banner cadastrado.</p>
        ) : (
          <div className="banners-grid">
            {banners.map((banner) => (
              <div key={banner._id} className={`banner-card ${!banner.isActive ? 'inactive' : ''}`}>
                <div className="banner-image">
                  <img src={banner.image.startsWith('http') ? banner.image : `${url}/images/${banner.image}`} alt={banner.title} />
                </div>
                <div className="banner-info">
                  <h4>{banner.title} {banner.isDefault && <span className="default-badge">Padrão</span>}</h4>
                  <p>{banner.description}</p>
                  <span className="banner-order">Ordem: {banner.order}</span>
                  <span className={`banner-status ${banner.isActive ? 'active' : 'inactive'}`}>
                    {banner.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                <div className="banner-actions">
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEdit(banner)}
                  >
                    Editar
                  </button>
                  <button 
                    className={`toggle-btn ${banner.isActive ? 'deactivate' : 'activate'}`}
                    onClick={() => handleToggleStatus(banner._id)}
                  >
                    {banner.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => handleDelete(banner._id, banner.isDefault)}
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Banners;