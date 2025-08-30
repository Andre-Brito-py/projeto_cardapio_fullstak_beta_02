import React from 'react'
import './Orders.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { assets } from './../../../../frontend/src/assets/assets';

const Orders = ({url, token}) => {

  const [orders, setOrders] = useState([])
  const [printingOrder, setPrintingOrder] = useState(null)

  const fetchAllOrders = async () =>{
    const response = await axios.get(url+"/api/order/list", {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'store-slug': 'loja-de-teste-gar-om'
      }
    });
    if(response.data.success){
      setOrders(response.data.data);
      console.log(response.data.data);
    }else{
      toast.error("Error")
    }
  }

  const statusHandler = async (event,orderId) =>{
    const response = await axios.post(url+"/api/order/status",{
      orderId,
      status:event.target.value
    }, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'store-slug': 'loja-de-teste-gar-om'
      }
    })
    if(response.data.success){
      await fetchAllOrders();
    }
  }

  const printOrder = async (orderId) => {
    setPrintingOrder(orderId);
    try {
      const response = await axios.post(
        url + "/api/print/print",
        { orderId },
        { headers: { token } }
      );
      
      if (response.data.success) {
        toast.success(response.data.message);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao imprimir pedido:', error);
      toast.error('Erro ao imprimir pedido. Verifique se a impressora está conectada.');
    } finally {
      setPrintingOrder(null);
    }
  }

  useEffect(()=>{
    fetchAllOrders()
  },[])
  return (
    <div className='order add'>
      <h3>Order Page</h3>
      <div className="order-list">
        {orders.map((order, index)=>(
          <div key={index} className="order-item">
            <img src={assets.parcel_icon} alt="" />
            <div>
              <p className="order-item-food">
                {order.items.map((item,index)=>{
                  if(index===order.items.length-1){
                    return item.name + " x " + item.quantity
                  }else{
                    return item.name + " x " + item.quantity + " , "
                  }
                })}
              </p>
              <p className="order-item-name">{order.address.firstName + " "+order.address.lastName}</p>
              
              {/* Informações sobre quem fez o pedido */}
              {order.isWaiterOrder && (
                <div className="order-waiter-info">
                  <p className="waiter-indicator">👨‍💼 Pedido feito pelo Garçom</p>
                </div>
              )}
              
              {/* Informações da Mesa */}
              {(order.tableId || order.tableNumber || order.orderType === 'dine_in') && (
                <div className="order-table-info">
                  <p className="table-indicator">🍽️ Mesa {order.tableId?.tableNumber || order.tableNumber || 'N/A'}</p>
                  {order.tableId?.displayName && order.tableId.displayName !== `Mesa ${order.tableId.tableNumber}` && (
                    <p className="table-name">({order.tableId.displayName})</p>
                  )}
                  <span className="order-type-badge dine-in">Consumo no Local</span>
                </div>
              )}
              
              {/* Endereço de Entrega (apenas para delivery) */}
              {!order.tableId && !order.tableNumber && order.orderType !== 'dine_in' && order.address && (
                <div className="order-item-address">
                  <p>{order.address.state + ","}</p>
                  <p>{order.address.city+" ,"+ order.address.state+" ,"+order.address.country+" ,"+order.address.zipcode}</p>
                  <p className='order-item-phone'>{order.address.phone}</p>
                  <span className="order-type-badge delivery">Entrega</span>
                </div>
              )}
              
              {/* Telefone para pedidos de mesa */}
              {(order.tableId || order.tableNumber || order.orderType === 'dine_in') && order.address?.phone && (
                <p className='order-item-phone'>📞 {order.address.phone}</p>
              )}
              
              {/* Observações do Pedido */}
              {order.notes && (
                <div className="order-notes-display">
                  <p className="order-notes-text">📝 <strong>Obs:</strong> {order.notes}</p>
                </div>
              )}
            </div>
            <p>Itmes: {order.items.length}</p>
            <p>₹{order.amount}</p>
            <div className="order-actions">
              <select onChange={(event)=> statusHandler(event,order._id)} value={order.status} >
                <option value="Food Processing">Food Processing</option>
                <option value="Out for delivery">Out for delivery</option>
                <option value="Delivered">Delivered</option>
              </select>
              <button 
                className={`print-btn ${printingOrder === order._id ? 'printing' : ''}`}
                onClick={() => printOrder(order._id)}
                disabled={printingOrder === order._id}
                title="Imprimir Pedido"
              >
                {printingOrder === order._id ? '🖨️ Imprimindo...' : '🖨️ Imprimir'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Orders