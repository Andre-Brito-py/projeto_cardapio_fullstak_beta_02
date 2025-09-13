import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './WaiterOrderPage.css';
import WaiterFoodItem from './WaiterFoodItem';
import { assets } from '../../assets/assets';

const WaiterOrderPage = () => {
  const { storeId } = useParams();
  const [searchParams] = useSearchParams();
  const [storeData, setStoreData] = useState(null);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [categories, setCategories] = useState([]);
  const [foodList, setFoodList] = useState([]);
  const [cartItems, setCartItems] = useState({});
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [orderNotes, setOrderNotes] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [waiterToken, setWaiterToken] = useState(null);
  const [waiterName, setWaiterName] = useState('');
  const [currentOrders, setCurrentOrders] = useState([]);
  const [showOrderHistory, setShowOrderHistory] = useState(false);

  const url = 'http://localhost:4001';

  // Validar token de garçom
  const validateWaiterToken = useCallback(async (token) => {
    try {
      const response = await axios.post(`${url}/api/waiter/validate-token`, 
        { token },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setIsAuthenticated(true);
        setWaiterToken(token);
        setWaiterName(response.data.waiterName || 'Garçom');
        return true;
      } else {
        toast.error('Token de acesso inválido');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error('Erro ao validar token:', error);
      toast.error('Erro ao validar acesso de garçom');
      setIsAuthenticated(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const initializeWaiterOrderPage = async () => {
      try {
        // Get token from URL params or use default
        const tokenFromUrl = searchParams.get('token');
        const token = tokenFromUrl || `waiter_${storeId}`;
        
        // Validate token
        const isValid = await validateWaiterToken(token);
        if (!isValid) {
          setIsAuthenticated(false);
          setLoading(false);
          return;
        }
        
        // Fetch store data and other resources
        await Promise.all([
          fetchStoreData(token),
          fetchTables(),
          fetchCategories(),
          fetchFoodList(),
          fetchCurrentOrders()
        ]);
        
      } catch (error) {
        console.error('Erro ao inicializar interface do garçom:', error);
        toast.error('Erro ao carregar interface do garçom');
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      initializeWaiterOrderPage();
    }
  }, [storeId]);

  const fetchStoreData = useCallback(async (token) => {
    try {
      // First get the store slug using the store ID
      const storeResponse = await axios.get(`${url}/api/store/public/id/${storeId}`);
      
      if (storeResponse.data.success && storeResponse.data.store) {
        const storeSlug = storeResponse.data.store.slug;
        
        // Now fetch public store data using the slug
        const publicResponse = await axios.get(`${url}/api/store/public/${storeSlug}`);
        if (publicResponse.data.success) {
          setStoreData(publicResponse.data.store);
        }
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
    }
  }, [storeId]);

  const fetchTables = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/tables/public/${storeId}`, {
        headers: { 'X-Store-ID': storeId }
      });
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      toast.error('Erro ao carregar mesas');
    }
  }, [storeId]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/category/active`, {
        headers: { 'X-Store-ID': storeId }
      });
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  }, [storeId]);

  const fetchFoodList = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/food/list`, {
        headers: { 'X-Store-ID': storeId }
      });
      if (response.data.success) {
        setFoodList(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  }, [storeId]);

  const fetchCurrentOrders = useCallback(async () => {
    try {
      // Só buscar pedidos se uma mesa estiver selecionada
      if (selectedTable && waiterToken) {
        const response = await axios.get(`${url}/api/waiter/table/${selectedTable}/orders`, {
          headers: { Authorization: `Bearer ${waiterToken}` }
        });
        if (response.data.success) {
          setCurrentOrders(response.data.data || []);
        }
      } else {
        setCurrentOrders([]);
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
      setCurrentOrders([]);
    }
  }, [selectedTable, waiterToken]);

  const addToCart = (itemId) => {
    if (!cartItems[itemId]) {
      setCartItems(prev => ({ ...prev, [itemId]: 1 }));
    } else {
      setCartItems(prev => ({ ...prev, [itemId]: prev[itemId] + 1 }));
    }
  };

  const removeFromCart = (itemId) => {
    setCartItems(prev => ({ ...prev, [itemId]: prev[itemId] - 1 }));
  };

  const getTotalCartAmount = () => {
    let totalAmount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        let itemInfo = foodList.find(product => product._id === item);
        if (itemInfo) {
          totalAmount += itemInfo.price * cartItems[item];
        }
      }
    }
    return totalAmount;
  };

  const getCartItemCount = () => {
    let totalCount = 0;
    for (const item in cartItems) {
      if (cartItems[item] > 0) {
        totalCount += cartItems[item];
      }
    }
    return totalCount;
  };

  const handlePlaceOrder = async () => {
    if (!selectedTable) {
      toast.error('Selecione uma mesa primeiro');
      return;
    }

    if (getCartItemCount() === 0) {
      toast.error('Adicione itens ao pedido');
      return;
    }

    if (!waiterToken) {
      toast.error('Token de autenticação não encontrado');
      return;
    }

    try {
      const orderItems = [];
      for (const item in cartItems) {
        if (cartItems[item] > 0) {
          let itemInfo = foodList.find(product => product._id === item);
          orderItems.push({
            ...itemInfo,
            quantity: cartItems[item]
          });
        }
      }

      const orderData = {
        tableId: selectedTable,
        items: orderItems,
        notes: orderNotes,
        waiterName: waiterName
      };

      const response = await axios.post(`${url}/api/waiter/place-order`, orderData, {
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      
      if (response.data.success) {
        toast.success('Pedido realizado com sucesso!');
        setCartItems({});
        setSelectedTable('');
        setOrderNotes('');
        // Atualizar lista de pedidos
        fetchCurrentOrders();
      } else {
        toast.error(response.data.message || 'Erro ao fazer pedido');
      }
    } catch (error) {
      console.error('Erro ao fazer pedido:', error);
      toast.error('Erro ao processar pedido');
    }
  };

  const clearCart = () => {
    setCartItems({});
    setOrderNotes('');
    toast.info('Carrinho limpo');
  };

  const getTableName = (tableId) => {
    const table = tables.find(t => t._id === tableId);
    return table ? `Mesa ${table.tableNumber}` : 'Mesa não encontrada';
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="waiter-loading">
        <div className="loading-spinner"></div>
        <p>Carregando interface do garçom...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="waiter-order-page error">
        <div className="error-message">
          <h2>🚫 Acesso Negado</h2>
          <p>Token de autenticação inválido ou expirado.</p>
          <p>Entre em contato com o administrador para obter um novo link de acesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='waiter-order-page'>
      <div className='waiter-header'>
        <div className='header-info'>
          <h1>🍽️ Interface do Garçom</h1>
          {storeData && <h2>{storeData.name}</h2>}
          <p>Bem-vindo, <strong>{waiterName}</strong>!</p>
        </div>
        <div className='header-actions'>
          <button 
            className={`toggle-btn ${showOrderHistory ? 'active' : ''}`}
            onClick={() => setShowOrderHistory(!showOrderHistory)}
          >
            {showOrderHistory ? '📋 Novo Pedido' : '📊 Pedidos Ativos'}
          </button>
        </div>
      </div>

      {!showOrderHistory ? (
        <div className='waiter-content'>
          <div className='order-section'>
            <div className='table-selection'>
              <h3>🪑 Selecionar Mesa</h3>
              <select 
                value={selectedTable} 
                onChange={(e) => setSelectedTable(e.target.value)}
                className='table-select'
              >
                <option value=''>Selecione uma mesa</option>
                {tables.map((table) => (
                  <option key={table._id} value={table._id}>
                    Mesa {table.tableNumber} ({table.capacity} pessoas)
                  </option>
                ))}
              </select>
            </div>

            {getCartItemCount() > 0 && (
              <div className='cart-summary'>
                <div className='cart-info'>
                  <span className='cart-count'>{getCartItemCount()} itens</span>
                  <span className='cart-total'>R$ {getTotalCartAmount().toFixed(2)}</span>
                </div>
                <button className='clear-cart-btn' onClick={clearCart}>
                  🗑️ Limpar
                </button>
              </div>
            )}
          </div>

          <div className='menu-section'>
            <div className='category-menu'>
              <button 
                onClick={() => setCategory('All')} 
                className={category === 'All' ? 'active' : ''}
              >
                Todos
              </button>
              {categories.map((item, index) => (
                <button 
                  key={index} 
                  onClick={() => setCategory(item.name)} 
                  className={category === item.name ? 'active' : ''}
                >
                  {item.name}
                </button>
              ))}
            </div>

            <div className='food-display'>
              <h2>📖 Cardápio</h2>
              <div className='food-display-list'>
                {foodList.map((item, index) => {
                  if (category === 'All' || category === item.category) {
                    return (
                      <WaiterFoodItem
                        key={index}
                        id={item._id}
                        name={item.name}
                        description={item.description}
                        price={item.price}
                        image={item.image}
                        addToCart={addToCart}
                        removeFromCart={removeFromCart}
                        cartItems={cartItems}
                      />
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {getCartItemCount() > 0 && (
            <div className='cart-bottom'>
              <div className='cart-details'>
                <h3>📝 Resumo do Pedido</h3>
                <div className='cart-items-list'>
                  {Object.keys(cartItems).map(itemId => {
                    if (cartItems[itemId] > 0) {
                      const item = foodList.find(product => product._id === itemId);
                      if (item) {
                        return (
                          <div key={itemId} className='cart-item-row'>
                            <span>{item.name}</span>
                            <span>{cartItems[itemId]}x</span>
                            <span>R$ {(item.price * cartItems[itemId]).toFixed(2)}</span>
                          </div>
                        );
                      }
                    }
                    return null;
                  })}
                </div>
                
                <div className='cart-total-section'>
                  <div className='total-line'>
                    <strong>Total: R$ {getTotalCartAmount().toFixed(2)}</strong>
                  </div>
                </div>
              </div>
              
              <div className='order-notes'>
                <h3>📋 Observações do Pedido</h3>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder='Adicione observações sobre o pedido (ex: sem cebola, ponto da carne, etc.)...'
                  rows='3'
                />
              </div>
              
              <div className='order-actions'>
                <button 
                  onClick={handlePlaceOrder}
                  className='place-order-btn'
                  disabled={!selectedTable}
                >
                  🚀 Enviar Pedido
                </button>
                <button 
                  onClick={clearCart}
                  className='clear-order-btn'
                >
                  🗑️ Limpar Pedido
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className='orders-history'>
          <h3>📊 Pedidos Ativos</h3>
          {currentOrders.length > 0 ? (
            <div className='orders-list'>
              {currentOrders.map((order, index) => (
                <div key={order._id || index} className='order-card'>
                  <div className='order-header'>
                    <h4>{getTableName(order.tableId)}</h4>
                    <span className={`order-status ${order.status}`}>
                      {order.status === 'pending' ? '⏳ Pendente' : 
                       order.status === 'preparing' ? '👨‍🍳 Preparando' : 
                       order.status === 'ready' ? '✅ Pronto' : '🚚 Entregue'}
                    </span>
                  </div>
                  <div className='order-items'>
                    {order.items && order.items.map((item, idx) => (
                      <div key={idx} className='order-item'>
                        <span>{item.name}</span>
                        <span>{item.quantity}x</span>
                      </div>
                    ))}
                  </div>
                  {order.notes && (
                    <div className='order-notes-display'>
                      <strong>Obs:</strong> {order.notes}
                    </div>
                  )}
                  <div className='order-total'>
                    <strong>Total: R$ {order.total ? order.total.toFixed(2) : '0.00'}</strong>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className='no-orders'>
              <p>📭 Nenhum pedido ativo no momento</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WaiterOrderPage;