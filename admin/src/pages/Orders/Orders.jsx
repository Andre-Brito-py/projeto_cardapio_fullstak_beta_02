import React from 'react'
import './Orders.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useEffect } from 'react';
import { assets } from './../../../../frontend/src/assets/assets';

const Orders = ({url, token}) => {

  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [printingOrder, setPrintingOrder] = useState(null)
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [filteredTotals, setFilteredTotals] = useState({ count: 0, revenue: 0 });

  const fetchAllOrders = async () =>{
    const response = await axios.get(url+"/api/order/list", {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'store-slug': 'loja-de-teste-gar-om'
      }
    });
    if(response.data.success){
      setAllOrders(response.data.data);
      setOrders(response.data.data);
    }else{
      toast.error("Error")
    }
  }

  // Filter orders based on delivery type and status
  const filterOrders = () => {
    let filtered = [...allOrders];
    
    if (deliveryTypeFilter !== 'all') {
      filtered = filtered.filter(order => order.deliveryType === deliveryTypeFilter);
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (paymentMethodFilter !== 'all') {
      filtered = filtered.filter(order => order.paymentMethod === paymentMethodFilter);
    }
    
    setOrders(filtered);
    
    // Calculate filtered totals
    const totalRevenue = filtered.reduce((sum, order) => sum + order.amount, 0);
    setFilteredTotals({ count: filtered.length, revenue: totalRevenue });
  };

  // Get delivery type label
  const getDeliveryTypeLabel = (type) => {
    const labels = {
      'delivery': 'Entrega',
      'waiter': 'Garçom', 
      'in_person': 'Presencial'
    };
    return labels[type] || type;
  };

  // Get delivery type icon
  const getDeliveryTypeIcon = (type) => {
    const icons = {
      'delivery': '🚚',
      'waiter': '👨‍💼',
      'in_person': '🏪'
    };
    return icons[type] || '📦';
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'pix': 'PIX',
      'dinheiro': 'Dinheiro',
      'cartao_credito': 'Cartão de Crédito',
      'cartao_debito': 'Cartão de Débito',
      'vale_refeicao': 'Vale Refeição',
      'vale_alimentacao': 'Vale Alimentação'
    };
    return labels[method] || method || 'Não informado';
  };

  const getPaymentMethodIcon = (method) => {
    const icons = {
      'pix': '💳',
      'dinheiro': '💵',
      'cartao_credito': '💳',
      'cartao_debito': '💳',
      'vale_refeicao': '🍽️',
      'vale_alimentacao': '🛒'
    };
    return icons[method] || '💰';
  };

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

  useEffect(() => {
    filterOrders();
  }, [deliveryTypeFilter, statusFilter, paymentMethodFilter, allOrders]);
  return (
    <div className='order add'>
      <h3>Order Page</h3>
      
      {/* Filters Section */}
      <div className="order-filters">
        <div className="filter-group">
          <label>Filtrar por Tipo de Saída:</label>
          <select 
            value={deliveryTypeFilter} 
            onChange={(e) => setDeliveryTypeFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Tipos</option>
            <option value="delivery">🚚 Entrega</option>
            <option value="waiter">👨‍💼 Garçom</option>
            <option value="in_person">🏪 Presencial</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filtrar por Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Status</option>
            <option value="Food Processing">Processando</option>
            <option value="Out for delivery">Saiu para Entrega</option>
            <option value="Delivered">Entregue</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>Filtrar por Método de Pagamento:</label>
          <select 
            value={paymentMethodFilter} 
            onChange={(e) => setPaymentMethodFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos os Métodos</option>
            <option value="pix">PIX</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="cartao_credito">Cartão de Crédito</option>
            <option value="cartao_debito">Cartão de Débito</option>
            <option value="vale_refeicao">Vale Refeição</option>
            <option value="vale_alimentacao">Vale Alimentação</option>
          </select>
        </div>
        
        <div className="filter-summary">
          <div className="summary-item">
            <span className="summary-label">Pedidos:</span>
            <span className="summary-value">{orders.length} de {allOrders.length}</span>
          </div>
          <div className="summary-item">
            <span className="summary-label">Faturamento:</span>
            <span className="summary-value">R$ {filteredTotals.revenue.toFixed(2)}</span>
          </div>
        </div>
      </div>
      
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
              
              {/* Delivery Type Badge */}
              <div className={`delivery-type-badge ${order.deliveryType || 'delivery'}`}>
                {getDeliveryTypeIcon(order.deliveryType || 'delivery')} 
                {getDeliveryTypeLabel(order.deliveryType || 'delivery')}
              </div>
              
              {/* Payment Method Badge */}
              <div className="payment-method-badge">
                {getPaymentMethodIcon(order.paymentMethod)} {getPaymentMethodLabel(order.paymentMethod)}
              </div>
              
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