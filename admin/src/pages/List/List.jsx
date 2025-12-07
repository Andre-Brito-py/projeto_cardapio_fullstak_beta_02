// eslint-disable-next-line no-unused-vars
import React, { useEffect, useState } from 'react'
import './List.css'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

// eslint-disable-next-line react/prop-types
const List = ({url}) => {
  const [list, setList] = useState([]);
  const navigate = useNavigate();

  const fetchList = async () =>{
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/food/admin/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
     
      if(response.data.success){
        setList(response.data.data)
      }
      else{
        toast.error(response.data.message || "Erro ao carregar produtos")
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  }

  const removeFood = async (foodId) =>{
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/food/remove`, {id:foodId}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if(response.data.success){
        toast.success(response.data.message)
        await fetchList();
      }else{
        toast.error(response.data.message || 'Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  }

  const toggleStockStatus = async (foodId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${url}/api/food/stock-status`, {
        id: foodId,
        isOutOfStock: !currentStatus
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if(response.data.success){
        toast.success(response.data.message);
        await fetchList();
      }else{
        toast.error(response.data.message || 'Erro ao atualizar status de estoque');
      }
    } catch (error) {
      console.error('Erro ao atualizar status de estoque:', error);
      toast.error('Erro ao conectar com o servidor');
    }
  }

  const openStockManagement = (item) => {
    navigate(`/stock-management/${item._id}`);
  }

  useEffect(()=>{
    fetchList();
  },[])
  return (
    <div className='list'>
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between">
          <h2 className="m-0">Produtos</h2>
          <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={() => navigate('/add')}>Adicionar Produto</button>
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-vcenter">
              <thead>
                <tr>
                  <th>Imagem</th>
                  <th>Nome</th>
                  <th>Categoria</th>
                  <th>Preço</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item, index) => (
                  <tr key={index}>
                    <td>
                      <img src={`${url}/images/` + item.image} alt={item.name} style={{ width: 40, height: 40, borderRadius: 4, border: '1px solid var(--tblr-border-color)' }} />
                    </td>
                    <td className="font-weight-medium">{item.name}</td>
                    <td>{item.category}</td>
                    <td>₹{item.price}</td>
                    <td>
                      <span className={`badge ${item.isOutOfStock ? 'bg-red-lt' : 'bg-green-lt'}`}>
                        {item.isOutOfStock ? 'Esgotado' : 'Disponível'}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-inline-flex gap-2">
                        <button
                          onClick={() => navigate(`/edit/${item._id}`)}
                          className="btn btn-outline btn-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleStockStatus(item._id, item.isOutOfStock)}
                          className={`btn btn-sm ${item.isOutOfStock ? 'btn-success' : 'btn-warning'}`}
                        >
                          {item.isOutOfStock ? 'Repor' : 'Esgotar'}
                        </button>
                        <button
                          onClick={() => openStockManagement(item)}
                          className="btn btn-secondary btn-sm"
                        >
                          Gerenciar
                        </button>
                        <button
                          onClick={() => removeFood(item._id)}
                          className="btn btn-danger btn-sm"
                        >
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default List
