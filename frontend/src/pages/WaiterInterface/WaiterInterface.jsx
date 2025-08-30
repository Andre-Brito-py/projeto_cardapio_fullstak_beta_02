import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import './WaiterInterface.css';
import FoodItem from '../../components/FoodItem/FoodItem';
import { assets } from '../../assets/assets';

const WaiterInterface = () => {
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

  const url = 'http://localhost:4000';

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
    const initializeWaiterInterface = async () => {
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
          fetchStoreData(),
          fetchTables(),
          fetchCategories(),
          fetchFoodList()
        ]);
        
      } catch (error) {
        console.error('Erro ao inicializar interface do garçom:', error);
        toast.error('Erro ao carregar interface do garçom');
      } finally {
        setLoading(false);
      }
    };
    
    if (storeId) {
      initializeWaiterInterface();
    }
  }, [storeId]);

  const fetchStoreData = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/store/public/${storeId}`);
      if (response.data.success) {
        setStoreData(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados da loja:', error);
      toast.error('Erro ao carregar dados da loja');
    }
  }, [storeId]);

  const fetchTables = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/table/public/${storeId}`);
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
        headers: { storeId }
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
        headers: { storeId }
      });
      if (response.data.success) {
        setFoodList(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos');
    }
  }, [storeId]);

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
        notes: orderNotes
      };

      const response = await axios.post(`${url}/api/waiter/place-order`, orderData, {
        headers: { Authorization: `Bearer ${waiterToken}` }
      });
      
      if (response.data.success) {
        toast.success('Pedido realizado com sucesso!');
        setCartItems({});
        setSelectedTable('');
        setOrderNotes('');
      } else {
        toast.error(response.data.message || 'Erro ao fazer pedido');
      }
    } catch (error) {
      console.error('Erro ao fazer pedido:', error);
      toast.error('Erro ao processar pedido');
    }
  };

  if (loading || isAuthenticated === null) {
    return (
      <div className="waiter-loading">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  if (isAuthenticated === false) {
    return (
      <div className="waiter-interface error">
        <div className="error-message">
          <h2>Acesso Negado</h2>
          <p>Token de autenticação inválido ou expirado.</p>
          <p>Entre em contato com o administrador para obter um novo link de acesso.</p>
        </div>
      </div>
    );
  }

  return (
    <div className='waiter-interface'>
      <div className='waiter-header'>
        <h1>Interface do Garçom</h1>
        {storeData && <h2>{storeData.name}</h2>}
      </div>

      <div className='waiter-content'>
        <div className='table-selection'>
          <h3>Selecionar Mesa</h3>
          <select 
            value={selectedTable} 
            onChange={(e) => setSelectedTable(e.target.value)}
            className='table-select'
          >
            <option value=''>Selecione uma mesa</option>
            {tables.map((table) => (
              <option key={table._id} value={table._id}>
                Mesa {table.tableNumber}
              </option>
            ))}
          </select>
        </div>

        <div className='menu-section'>
          <div className='category-menu'>
            <p onClick={() => setCategory('All')} className={category === 'All' ? 'active' : ''}>Todos</p>
            {categories.map((item, index) => (
              <p key={index} onClick={() => setCategory(item.name)} className={category === item.name ? 'active' : ''}>
                {item.name}
              </p>
            ))}
          </div>

          <div className='food-display'>
            <h2>Cardápio</h2>
            <div className='food-display-list'>
              {foodList.map((item, index) => {
                if (category === 'All' || category === item.category) {
                  return (
                    <FoodItem
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
            <div className='cart-total'>
              <h2>Total do Pedido</h2>
              <div className='cart-total-details'>
                <p>Subtotal: R$ {getTotalCartAmount().toFixed(2)}</p>
                <hr />
                <b>Total: R$ {getTotalCartAmount().toFixed(2)}</b>
              </div>
            </div>
            
            <div className='order-notes'>
              <h3>Observações do Pedido</h3>
              <textarea
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder='Adicione observações sobre o pedido...'
                rows='3'
              />
            </div>
            
            <button 
              onClick={handlePlaceOrder}
              className='place-order-btn'
              disabled={!selectedTable}
            >
              Realizar Pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default WaiterInterface;