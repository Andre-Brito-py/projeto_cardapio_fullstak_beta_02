import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const List = ({ url }) => {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchList = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/food/admin/list`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
     
      if (response.data.success) {
        setList(response.data.data);
      } else {
        toast.error(response.data.message || "Erro ao carregar produtos");
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const removeFood = async (foodId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/food/remove`, { id: foodId }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message || 'Erro ao excluir produto');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    }
  };

  const toggleStockStatus = async (foodId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${url}/api/food/stock-status`, {
        id: foodId,
        isOutOfStock: !currentStatus
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        await fetchList();
      } else {
        toast.error(response.data.message || 'Erro ao atualizar status de estoque');
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cardápio</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie os produtos, preços e disponibilidade do seu catálogo.</p>
        </div>
        <button 
          onClick={() => navigate('/add')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
        >
          <i className="ti ti-plus text-lg"></i> Adicionar Produto
        </button>
      </div>

      {/* Main Card */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Produto</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Categoria</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Preço</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      Carregando produtos...
                    </div>
                  </td>
                </tr>
              ) : list.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    Nenhum produto cadastrado no seu cardápio ainda.
                  </td>
                </tr>
              ) : (
                list.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <img 
                          src={`${url}/images/${item.image}`} 
                          alt={item.name} 
                          className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                        />
                        <div className="text-sm font-medium text-gray-900">{item.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      R$ {Number(item.price).toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                        item.isOutOfStock 
                          ? 'bg-red-50 text-red-700 border-red-100' 
                          : 'bg-green-50 text-green-700 border-green-100'
                      }`}>
                        {item.isOutOfStock ? 'Esgotado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/edit/${item._id}`)}
                          className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Editar Produto"
                        >
                          <i className="ti ti-edit text-lg"></i>
                        </button>
                        <button
                          onClick={() => toggleStockStatus(item._id, item.isOutOfStock)}
                          className={`p-1.5 rounded-md transition-colors ${
                            item.isOutOfStock 
                              ? 'text-green-600 hover:bg-green-50' 
                              : 'text-amber-500 hover:bg-amber-50'
                          }`}
                          title={item.isOutOfStock ? 'Marcar como Disponível' : 'Marcar como Esgotado'}
                        >
                          <i className={`ti ${item.isOutOfStock ? 'ti-check' : 'ti-ban'} text-lg`}></i>
                        </button>
                        <button
                          onClick={() => navigate(`/stock-management/${item._id}`)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                          title="Gerenciar Estoque"
                        >
                          <i className="ti ti-box text-lg"></i>
                        </button>
                        <button
                          onClick={() => {
                            if(window.confirm('Tem certeza que deseja excluir este produto?')) {
                              removeFood(item._id)
                            }
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          title="Excluir"
                        >
                          <i className="ti ti-trash text-lg"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default List;
