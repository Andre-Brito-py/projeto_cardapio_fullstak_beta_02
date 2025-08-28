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

  useEffect(()=>{
    fetchList();
  },[])
  return (
    <div className='list add flex-col'>
      <p>All Foods List</p>
      <div className="list-table">
        <div className="list-table-format title">
            <b>Image</b>
            <b>Name</b>
            <b>Category</b>
            <b>Price</b>
            <b>Actions</b>
        </div>
        {list.map((item,index)=>{
          return(
            <div key={index} className="list-table-format">
              <img src={`${url}/images/`+item.image} alt="" />
              <p>{item.name}</p>
              <p>{item.category}</p>
              <p>₹{item.price}</p>
              <div className="action-buttons">
                <button 
                  onClick={() => navigate(`/edit/${item._id}`)} 
                  className="edit-btn"
                >
                  Editar
                </button>
                <button 
                  onClick={() => removeFood(item._id)} 
                  className="delete-btn"
                >
                  Excluir
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default List