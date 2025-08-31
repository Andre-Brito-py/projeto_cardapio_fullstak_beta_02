import React, { useState, useEffect } from 'react';
import './InPersonSales.css';
import { toast } from 'react-toastify';
import axios from 'axios';
import { BACKEND_URL } from '../../config/urls';

const InPersonSales = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [salesHistory, setSalesHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [totalSales, setTotalSales] = useState(0);

  // Buscar produtos da API
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/food/list`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setProducts(response.data.data);
      } else {
        toast.error('Erro ao carregar produtos');
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  // Buscar categorias
  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/category/list`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  // Buscar histórico de vendas presenciais
  const fetchSalesHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${BACKEND_URL}/api/in-person-sales/history`, {
        headers: { token }
      });
      
      if (response.data.success) {
        setSalesHistory(response.data.data);
        // Calcular total de vendas
        const total = response.data.data.reduce((sum, sale) => sum + sale.total, 0);
        setTotalSales(total);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchProducts(),
        fetchCategories(),
        fetchSalesHistory()
      ]);
      setLoading(false);
    };
    loadData();
  }, []);

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} adicionado ao carrinho`);
  };

  // Remover produto do carrinho
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item._id !== productId));
  };

  // Atualizar quantidade no carrinho
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(cart.map(item => 
      item._id === productId 
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Calcular total do carrinho
  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Finalizar venda
  const completeSale = async () => {
    if (cart.length === 0) {
      toast.error('Adicione produtos ao carrinho antes de finalizar a venda');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const saleData = {
        items: cart.map(item => ({
          productId: item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        })),
        total: getCartTotal(),
        notes: ''
      };

      const response = await axios.post(`${BACKEND_URL}/api/in-person-sales/add`, saleData, {
        headers: { token }
      });

      if (response.data.success) {
        toast.success('Venda registrada com sucesso!');
        setCart([]);
        fetchSalesHistory(); // Atualizar histórico
      } else {
        toast.error(response.data.message || 'Erro ao registrar venda');
      }
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      toast.error('Erro ao registrar venda');
    }
  };

  // Filtrar produtos
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando produtos...</p>
      </div>
    );
  }

  return (
    <div className="in-person-sales">
      <div className="page-header">
        <div>
          <h1 className="page-title">Saídas Presenciais</h1>
          <p className="page-subtitle">Registre vendas realizadas pessoalmente na loja</p>
        </div>
        <div className="header-actions">
          <button 
            className={`history-btn ${showHistory ? 'active' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
          >
            {showHistory ? 'Ocultar Histórico' : 'Ver Histórico'}
          </button>
        </div>
      </div>

      <div className="sales-content">
        {!showHistory ? (
          <div className="sales-interface">
            {/* Filtros */}
            <div className="filters-section">
              <div className="search-box">
                <input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="category-filter">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="category-select"
                >
                  <option value="all">Todas as Categorias</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="main-content">
              {/* Lista de Produtos */}
              <div className="products-section">
                <h3>Produtos Disponíveis</h3>
                <div className="products-grid">
                  {filteredProducts.map(product => (
                    <div key={product._id} className="product-card">
                      <div className="product-image">
                        <img 
                          src={`${BACKEND_URL}/images/${product.image}`} 
                          alt={product.name}
                          onError={(e) => {
                            e.target.src = '/placeholder-image.png';
                          }}
                        />
                      </div>
                      <div className="product-info">
                        <h4>{product.name}</h4>
                        <p className="product-price">R$ {product.price.toFixed(2)}</p>
                        <button 
                          className="add-to-cart-btn"
                          onClick={() => addToCart(product)}
                        >
                          Adicionar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Carrinho */}
              <div className="cart-section">
                <h3>Carrinho de Vendas</h3>
                {cart.length === 0 ? (
                  <div className="empty-cart">
                    <p>Nenhum produto no carrinho</p>
                  </div>
                ) : (
                  <div className="cart-content">
                    <div className="cart-items">
                      {cart.map(item => (
                        <div key={item._id} className="cart-item">
                          <div className="item-info">
                            <h4>{item.name}</h4>
                            <p>R$ {item.price.toFixed(2)}</p>
                          </div>
                          <div className="quantity-controls">
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity - 1)}
                              className="quantity-btn"
                            >
                              -
                            </button>
                            <span className="quantity">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item._id, item.quantity + 1)}
                              className="quantity-btn"
                            >
                              +
                            </button>
                          </div>
                          <div className="item-total">
                            R$ {(item.price * item.quantity).toFixed(2)}
                          </div>
                          <button 
                            onClick={() => removeFromCart(item._id)}
                            className="remove-btn"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="cart-footer">
                      <div className="cart-total">
                        <strong>Total: R$ {getCartTotal().toFixed(2)}</strong>
                      </div>
                      <button 
                        className="complete-sale-btn"
                        onClick={completeSale}
                      >
                        Finalizar Venda
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Histórico de Vendas */
          <div className="history-section">
            <div className="history-header">
              <h3>Histórico de Vendas Presenciais</h3>
              <div className="total-sales">
                <strong>Total Vendido: R$ {totalSales.toFixed(2)}</strong>
              </div>
            </div>
            
            {salesHistory.length === 0 ? (
              <div className="no-sales">
                <p>Nenhuma venda presencial registrada ainda</p>
              </div>
            ) : (
              <div className="sales-list">
                {salesHistory.map(sale => (
                  <div key={sale._id} className="sale-card">
                    <div className="sale-header">
                      <div className="sale-date">
                        {new Date(sale.date).toLocaleString('pt-BR')}
                      </div>
                      <div className="sale-total">
                        R$ {sale.total.toFixed(2)}
                      </div>
                    </div>
                    <div className="sale-items">
                      {sale.items.map((item, index) => (
                        <div key={index} className="sale-item">
                          <span>{item.name}</span>
                          <span>{item.quantity}x R$ {item.price.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InPersonSales;