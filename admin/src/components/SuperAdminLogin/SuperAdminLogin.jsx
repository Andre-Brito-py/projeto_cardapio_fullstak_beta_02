import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const SuperAdminLogin = ({ url, setToken, setSuperAdmin }) => {
  const [data, setData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const onChangeHandler = (event) => {
    const { name, value } = event.target;
    setData(prev => ({ ...prev, [name]: value }));
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
        localStorage.setItem('superAdminToken', response.data.token);
        localStorage.setItem('userRole', 'super_admin');
        toast.success(isRegister ? 'Super Admin criado com sucesso!' : 'Login realizado com sucesso!');
      } else {
        toast.error(response.data.message || 'Erro na operação');
      }
    } catch (error) {
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
    <div className="min-h-screen bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <motion.h2 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 text-center text-3xl font-extrabold text-white"
        >
          {isRegister ? 'Criar Super Admin' : 'Acesso Restrito'}
        </motion.h2>
        <p className="mt-2 text-center text-sm text-gray-400">
          Gerenciamento Global da Plataforma
        </p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-gray-800 py-8 px-4 shadow-2xl sm:rounded-xl sm:px-10 border border-gray-700">
          <form className="space-y-6" onSubmit={onSubmit}>
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-300">Nome Completo</label>
                <div className="mt-1">
                  <input
                    name="name"
                    type="text"
                    required
                    value={data.name}
                    onChange={onChangeHandler}
                    className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Seu nome"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300">E-mail Administrativo</label>
              <div className="mt-1">
                <input
                  name="email"
                  type="email"
                  required
                  value={data.email}
                  onChange={onChangeHandler}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  placeholder="admin@plataforma.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300">Senha Master</label>
              <div className="mt-1 relative">
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={data.password}
                  onChange={onChangeHandler}
                  className="appearance-none block w-full px-3 py-2 border border-gray-600 rounded-lg shadow-sm placeholder-gray-500 bg-gray-700 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm pr-10"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50"
              >
                {loading ? 'Processando...' : (isRegister ? 'Criar Acesso' : 'Entrar no Sistema')}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={() => {
                setIsRegister(!isRegister);
                setData({ name: '', email: '', password: '' });
              }}
              className="w-full text-center text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              {isRegister ? 'Já tem conta? Fazer login' : 'Configurar primeiro Super Admin'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SuperAdminLogin;
