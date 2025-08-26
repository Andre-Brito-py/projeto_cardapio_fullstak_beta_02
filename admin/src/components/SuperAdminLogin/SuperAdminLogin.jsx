import React, { useState } from 'react';
import './SuperAdminLogin.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const SuperAdminLogin = ({ url, setToken, setSuperAdmin }) => {
  const [data, setData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      const endpoint = isRegister ? '/api/system/super-admin/create' : '/api/system/super-admin/login';
      const response = await axios.post(`${url}${endpoint}`, data);
      
      if (response.data.success) {
        setToken(response.data.token);
        setSuperAdmin(true);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('userRole', 'super_admin');
        toast.success(isRegister ? 'Super Admin criado com sucesso!' : 'Login realizado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro na operação');
      }
    } catch (error) {
      console.error('Erro na operação:', error);
      if (error.response?.status === 400 && isRegister) {
        toast.error('Super Admin já existe. Faça login.');
        setIsRegister(false);
      } else {
        toast.error('Erro ao conectar com o servidor');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='super-admin-login-container'>
      <div className='super-admin-login-form'>
        <h2>{isRegister ? 'Criar Super Admin' : 'Super Admin Login'}</h2>
        <form onSubmit={onSubmit}>
          {isRegister && (
            <div className='form-group'>
              <label>Nome:</label>
              <input
                name='name'
                onChange={onChangeHandler}
                value={data.name}
                type='text'
                placeholder='Digite seu nome completo'
                required
              />
            </div>
          )}
          
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
            {loading ? 'Processando...' : (isRegister ? 'Criar Super Admin' : 'Entrar')}
          </button>
        </form>
        
        <div className='toggle-mode'>
          <button 
            type='button' 
            onClick={() => {
              setIsRegister(!isRegister);
              setData({ name: '', email: '', password: '' });
            }}
            className='toggle-button'
          >
            {isRegister ? 'Já tem conta? Fazer login' : 'Criar primeiro Super Admin'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminLogin;