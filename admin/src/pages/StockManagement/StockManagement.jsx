import React, { useState, useEffect } from 'react';
import './StockManagement.css';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useParams, useNavigate } from 'react-router-dom';

const StockManagement = ({ url }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [outOfStockAddons, setOutOfStockAddons] = useState([]);
  const [outOfStockCategories, setOutOfStockCategories] = useState([]);

  const fetchProduct = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/food/${id}/details`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setProduct(response.data.data);
        setOutOfStockAddons(response.data.data.outOfStockAddons || []);
        setOutOfStockCategories(response.data.data.outOfStockAddonCategories || []);
      } else {
        toast.error('Produto não encontrado');
        navigate('/list');
      }
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      toast.error('Erro ao carregar produto');
      navigate('/list');
    } finally {
      setLoading(false);
    }
  };

  const updateStockStatus = async (updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${url}/api/food/stock-status`, {
        id: product._id,
        ...updates
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success('Status atualizado com sucesso');
        await fetchProduct();
      } else {
        toast.error(response.data.message || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const toggleProductStock = () => {
    updateStockStatus({ isOutOfStock: !product.isOutOfStock });
  };

  const toggleAddonStock = (addonName) => {
    const newOutOfStockAddons = outOfStockAddons.includes(addonName)
      ? outOfStockAddons.filter(name => name !== addonName)
      : [...outOfStockAddons, addonName];
    
    updateStockStatus({ outOfStockAddons: newOutOfStockAddons });
  };

  const toggleCategoryStock = (categoryName) => {
    const newOutOfStockCategories = outOfStockCategories.includes(categoryName)
      ? outOfStockCategories.filter(name => name !== categoryName)
      : [...outOfStockCategories, categoryName];
    
    updateStockStatus({ outOfStockAddonCategories: newOutOfStockCategories });
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="stock-management loading">
        <div className="loading-spinner">Carregando...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="stock-management error">
        <p>Produto não encontrado</p>
        <button onClick={() => navigate('/list')} className="back-btn">
          Voltar à Lista
        </button>
      </div>
    );
  }

  return (
    <div className="stock-management">
      <div className="header">
        <button onClick={() => navigate('/list')} className="back-btn">
          ← Voltar
        </button>
        <h2>Gerenciar Estoque - {product.name}</h2>
      </div>

      <div className="product-info">
        <div className="product-card">
          <img src={`${url}/images/${product.image}`} alt={product.name} />
          <div className="product-details">
            <h3>{product.name}</h3>
            <p className="description">{product.description}</p>
            <p className="price">₹{product.price}</p>
            <p className="category">{product.category}</p>
          </div>
          <div className="product-stock-control">
            <div className={`status-indicator ${product.isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
              {product.isOutOfStock ? 'Esgotado' : 'Disponível'}
            </div>
            <button 
              onClick={toggleProductStock}
              className={`toggle-btn ${product.isOutOfStock ? 'restock' : 'outstock'}`}
            >
              {product.isOutOfStock ? 'Repor Produto' : 'Esgotar Produto'}
            </button>
          </div>
        </div>
      </div>

      {/* Sistema Antigo - Extras */}
      {product.useOldSystem && product.extras && product.extras.length > 0 && (
        <div className="extras-section">
          <h3>Adicionais (Sistema Antigo)</h3>
          <div className="extras-grid">
            {product.extras.map((extra, index) => {
              const isOutOfStock = outOfStockAddons.includes(extra.name);
              return (
                <div key={index} className={`extra-card ${isOutOfStock ? 'out-of-stock' : ''}`}>
                  <div className="extra-info">
                    <h4>{extra.name}</h4>
                    <p className="extra-description">{extra.description}</p>
                    <p className="extra-price">+₹{extra.price}</p>
                  </div>
                  <div className="extra-controls">
                    <div className={`status-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                      {isOutOfStock ? 'Esgotado' : 'Disponível'}
                    </div>
                    <button 
                      onClick={() => toggleAddonStock(extra.name)}
                      className={`toggle-btn ${isOutOfStock ? 'restock' : 'outstock'}`}
                    >
                      {isOutOfStock ? 'Repor' : 'Esgotar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Sistema Novo - Categorias de Adicionais */}
      {!product.useOldSystem && product.inlineAddonCategories && product.inlineAddonCategories.length > 0 && (
        <div className="addon-categories-section">
          <h3>Categorias de Adicionais</h3>
          {product.inlineAddonCategories.map((category, categoryIndex) => {
            const isCategoryOutOfStock = outOfStockCategories.includes(category.name);
            const categoryAddons = product.categoryAddons[category.id] || [];
            
            return (
              <div key={categoryIndex} className={`category-section ${isCategoryOutOfStock ? 'out-of-stock' : ''}`}>
                <div className="category-header">
                  <div className="category-info">
                    <h4>{category.name}</h4>
                    <p className="category-description">{category.description}</p>
                  </div>
                  <div className="category-controls">
                    <div className={`status-badge ${isCategoryOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                      {isCategoryOutOfStock ? 'Categoria Esgotada' : 'Categoria Disponível'}
                    </div>
                    <button 
                      onClick={() => toggleCategoryStock(category.name)}
                      className={`toggle-btn ${isCategoryOutOfStock ? 'restock' : 'outstock'}`}
                    >
                      {isCategoryOutOfStock ? 'Repor Categoria' : 'Esgotar Categoria'}
                    </button>
                  </div>
                </div>
                
                {categoryAddons.length > 0 && (
                  <div className="addons-grid">
                    {categoryAddons.map((addon, addonIndex) => {
                      const isAddonOutOfStock = outOfStockAddons.includes(addon.name);
                      return (
                        <div key={addonIndex} className={`addon-card ${isAddonOutOfStock ? 'out-of-stock' : ''}`}>
                          <div className="addon-info">
                            <h5>{addon.name}</h5>
                            <p className="addon-description">{addon.description}</p>
                            <p className="addon-price">+₹{addon.price}</p>
                          </div>
                          <div className="addon-controls">
                            <div className={`status-badge ${isAddonOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                              {isAddonOutOfStock ? 'Esgotado' : 'Disponível'}
                            </div>
                            <button 
                              onClick={() => toggleAddonStock(addon.name)}
                              className={`toggle-btn ${isAddonOutOfStock ? 'restock' : 'outstock'}`}
                              disabled={isCategoryOutOfStock}
                            >
                              {isAddonOutOfStock ? 'Repor' : 'Esgotar'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Caso não tenha adicionais */}
      {((product.useOldSystem && (!product.extras || product.extras.length === 0)) ||
        (!product.useOldSystem && (!product.inlineAddonCategories || product.inlineAddonCategories.length === 0))) && (
        <div className="no-addons">
          <p>Este produto não possui adicionais configurados.</p>
        </div>
      )}
    </div>
  );
};

export default StockManagement;