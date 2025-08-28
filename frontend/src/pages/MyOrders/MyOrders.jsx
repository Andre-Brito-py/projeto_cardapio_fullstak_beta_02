import React, { useContext, useEffect, useState } from 'react'
import './MyOrders.css'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import { assets } from './../../assets/assets';
import SEO from '../../components/SEO/SEO';

const MyOrders = () => {

const {url, token} = useContext(StoreContext);
const [data, setData] = useState([]);

const fetchOrders = async () => {
    try {
        const response = await axios.post(`${url}/api/order/userorders`, {}, {
            headers: { token }
        });
        
        if (response.data.success) {
            setData(response.data.data);
        } else {
            console.error('Erro ao buscar pedidos:', response.data.message);
            setData([]);
        }
    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        const errorMessage = error.response?.data?.message || 'Erro ao carregar pedidos. Tente novamente.';
        alert(errorMessage);
        setData([]);
    }
}

useEffect(() => {
    if(token){
        fetchOrders();
    }
}, [token])

  return (
    <div className='my-orders'>
      <SEO 
        title="Meus Pedidos - Food Delivery"
        description="Acompanhe o status dos seus pedidos e histórico de compras."
        keywords="meus pedidos, histórico, status pedido, food delivery"
      />
        <h2>Meus Pedidos</h2>
        <div className="container">
            {data.map((order, index) => {
                    return (
                        <div key={index} className="my-orders-order">
                            <img src={assets.parcel_icon} alt="" />
                            <p>{order.items.map((item, index) => {
                                if(index === order.items.length-1){
                                    return item.name+" x "+item.quantity
                                }else{
                                    return item.name+" x "+item.quantity + ","
                                }
                            })}</p>
                            <p>R$ {order.amount}.00</p>
                            <p>Itens: {order.items.length}</p>
                            <p><span>&#x25cf;</span><b>{order.status}</b></p>
                            <button onClick={fetchOrders}>Rastrear Pedido</button>
                        </div>
                    )
            })}
        </div>
    </div>
  )
}

export default MyOrders