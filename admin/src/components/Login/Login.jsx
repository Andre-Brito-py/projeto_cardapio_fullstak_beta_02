import React, { useState } from 'react';
import './Login.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = ({ url, setToken }) => {
  const [data, setData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };



  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      // Primeiro, tentar fazer login direto sem seleção de loja
      // O backend já associa o store admin à sua loja específica
      const response = await axios.post(`${url}/api/store/admin/login`, {
        email: data.email,
        password: data.password
      });
      
      if (response.data.success && response.data.token) {
        // Login bem-sucedido - o usuário já está associado à sua loja
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'store_admin');
        localStorage.setItem('storeId', response.data.user.storeId);
        localStorage.setItem('storeName', response.data.user.storeName);
        toast.success('Login realizado com sucesso!');
        return;
      }
      
      // Se chegou aqui, as credenciais são inválidas
      toast.error(response.data.message || 'Credenciais inválidas');
      
    } catch (error) {
      console.error('Erro no login:', error);
      
      // Se o erro for de credenciais inválidas, não mostrar seleção de lojas
      if (error.response?.status === 401 || error.response?.data?.message?.includes('Credenciais')) {
        toast.error('Email ou senha incorretos');
      } else {
        toast.error('Erro ao conectar com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='login-container'>
      <div className='card login-form'>
        <div className='card-header'>
          <h2 className='card-title'>Store Admin Login</h2>
        </div>
        <div className='card-body'>
          <form onSubmit={onLogin}>
            <div className='form-group'>
              <label>Email</label>
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
              <label>Senha</label>
              <div className='password-input-group'>
                <input
                  name='password'
                  onChange={onChangeHandler}
                  value={data.password}
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Digite sua senha'
                  required
                />
                <button 
                  type="button" 
                  className="password-toggle-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                >
                  {showPassword ? <i className='ti ti-eye-off'></i> : <i className='ti ti-eye'></i>}
                </button>
              </div>
            </div>
            
            <button className='btn btn-primary w-full' type='submit' disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
