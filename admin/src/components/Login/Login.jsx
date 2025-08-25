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

  const onChangeHandler = (event) => {
    const name = event.target.name;
    const value = event.target.value;
    setData(data => ({ ...data, [name]: value }));
  };

  const onLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(`${url}/api/user/login`, data);
      
      if (response.data.success) {
        setToken(response.data.token);
        localStorage.setItem('token', response.data.token);
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
        <h2>Admin Login</h2>
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
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;