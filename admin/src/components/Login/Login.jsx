import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = ({ url, setToken }) => {
  const [data, setData] = useState({
    email: '',
    password: '',
    storeDomain: ''
  });
  const [loading, setLoading] = useState(false);
  const [stores, setStores] = useState([]);
  const [showStoreSelection, setShowStoreSelection] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };

  const fetchStores = async () => {
    try {
      const response = await axios.get(`${url}/api/system/stores/public`);
      if (response.data.success) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Se não há domínio da loja selecionado, mostrar seleção
      if (!data.storeDomain && !showStoreSelection) {
        await fetchStores();
        setShowStoreSelection(true);
        setLoading(false);
        return;
      }
      
      const loginData = {
        email: data.email,
        password: data.password,
        storeDomain: data.storeDomain
      };
      
      const response = await axios.post(`${url}/api/user/login`, loginData);
      
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', response.data.user.role);
        localStorage.setItem('storeId', response.data.user.storeId);
        toast.success('Login realizado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro ao fazer login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='login-form'>
        <h2>Store Admin Login</h2>
        
        {!showStoreSelection ? (
          <form onSubmit={onLogin}>
            <div className='form-group'>
              <label>Email:</label>
              <input
                name='email'
                onChange={onChangeHandler}
                value={data.email}
                type='email'
                placeholder='Digite seu email'
                required
              />
            </div>
            
            <div className='form-group'>
              <label>Senha:</label>
              <input
                name='password'
                onChange={onChangeHandler}
                value={data.password}
                type='password'
                placeholder='Digite sua senha'
                required
              />
            </div>
            
            <button type='submit' disabled={loading}>
              {loading ? 'Verificando...' : 'Continuar'}
            </button>
          </form>
        ) : (
          <div className='store-selection'>
            <h3>Selecione sua Loja</h3>
            <div className='stores-list'>
              {stores.map(store => (
                <div 
                  key={store._id} 
                  className={`store-option ${data.storeDomain === store.domain ? 'selected' : ''}`}
                  onClick={() => setData({...data, storeDomain: store.domain})}
                >
                  <h4>{store.name}</h4>
                  <p>{store.domain}</p>
                  {store.description && <small>{store.description}</small>}
                </div>
              ))}
            </div>
            
            <div className='store-selection-actions'>
              <button 
                type='button' 
                onClick={() => {
                  setShowStoreSelection(false);
                  setData({...data, storeDomain: ''});
                }}
                className='back-btn'
              >
                Voltar
              </button>
              
              <button 
                onClick={onLogin}
                disabled={!data.storeDomain || loading}
                className='login-btn'
              >
                {loading ? 'Entrando...' : 'Entrar na Loja'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;