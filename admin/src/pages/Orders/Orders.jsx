import React from 'react'
import './Orders.css'
import { useState } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify';
import { useEffect } from 'react';
 

const Orders = ({url, token}) => {

  const [orders, setOrders] = useState([])
  const [allOrders, setAllOrders] = useState([])
  const [printingOrder, setPrintingOrder] = useState(null)
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [filteredTotals, setFilteredTotals] = useState({ count: 0, revenue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Food Processing');

  const fetchAllOrders = async () =>{
    const response = await axios.get(url+"/api/order/list", {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    if(response.data.success){
      setAllOrders(response.data.data);
      setOrders(response.data.data);
    }else{
      toast.error("Error")
    }
  }

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
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      filtered = filtered.filter(order => {
        const name = `${order.address?.firstName || ''} ${order.address?.lastName || ''}`.toLowerCase();
        const items = (order.items || []).map(i => i.name).join(' ').toLowerCase();
        const notes = (order.notes || '').toLowerCase();
        const mesa = String(order.tableId?.tableNumber || order.tableNumber || '').toLowerCase();
        return name.includes(q) || items.includes(q) || notes.includes(q) || mesa.includes(q);
      });
    }
    setOrders(filtered);
    const totalRevenue = filtered.reduce((sum, order) => sum + Number(order.amount || 0), 0);
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
        'Authorization': `Bearer ${token}`
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
        { headers: { Authorization: `Bearer ${token}` } }
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
  }, [deliveryTypeFilter, statusFilter, paymentMethodFilter, searchQuery, allOrders]);
  return (
    <div className='orders'>
      <div className="card">
        <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
          <h2 className="m-0">Pedidos</h2>
          <div className="d-flex align-items-center flex-wrap gap-2">
            <div className="d-flex flex-column">
              <label className="form-label m-0">Tipo</label>
              <select 
                value={deliveryTypeFilter}
                onChange={(e) => setDeliveryTypeFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="all">Todos</option>
                <option value="delivery">Entrega</option>
                <option value="waiter">Garçom</option>
                <option value="in_person">Presencial</option>
              </select>
            </div>
            <div className="d-flex flex-column">
              <label className="form-label m-0">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="all">Todos</option>
                <option value="Food Processing">Processando</option>
                <option value="Out for delivery">Saiu para Entrega</option>
                <option value="Delivered">Entregue</option>
              </select>
            </div>
            <div className="d-flex flex-column">
              <label className="form-label m-0">Pagamento</label>
              <select 
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="form-select form-select-sm"
              >
                <option value="all">Todos</option>
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao_credito">Crédito</option>
                <option value="cartao_debito">Débito</option>
                <option value="vale_refeicao">Vale Refeição</option>
                <option value="vale_alimentacao">Vale Alimentação</option>
              </select>
            </div>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-blue-lt">{orders.length} pedidos</span>
              <span className="badge bg-green-lt">R$ {filteredTotals.revenue.toFixed(2)}</span>
            </div>
            <div className="d-flex flex-column">
              <label className="form-label m-0">Busca</label>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-control form-control-sm"
                placeholder="Cliente, item, mesa, obs"
              />
            </div>
          </div>
        </div>
        <div className="card-body">
          {selectedIds.length > 0 && (
            <div className="bulk-actions d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
              <div className="d-flex align-items-center gap-2">
                <span className="badge bg-orange-lt">{selectedIds.length} selecionados</span>
                <select 
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="form-select form-select-sm"
                >
                  <option value="Food Processing">Processando</option>
                  <option value="Out for delivery">Saiu para Entrega</option>
                  <option value="Delivered">Entregue</option>
                </select>
                <button className="btn btn-outline btn-sm" onClick={async () => { for (const id of selectedIds) { await axios.post(url+"/api/order/status",{ orderId:id, status:bulkStatus }, { headers: { 'Authorization': `Bearer ${token}`, 'store-slug': 'loja-de-teste-gar-om' } }) } await fetchAllOrders(); toast.success('Status atualizado em massa'); }}>Atualizar status</button>
                <button className="btn btn-outline btn-sm" onClick={async () => { for (const id of selectedIds) { await printOrder(id) } }} disabled={printingOrder !== null}>Imprimir selecionados</button>
              </div>
              <button className="btn btn-link btn-sm" onClick={() => setSelectedIds([])}>Limpar seleção</button>
            </div>
          )}
          <div className="table-responsive">
            <table className="table table-vcenter">
              <thead>
                <tr>
                  <th style={{width:'32px'}}>
                    <input type="checkbox" className="form-check-input" onChange={() => { const ids = orders.map(o => o._id); const allSelected = ids.every(id => selectedIds.includes(id)); setSelectedIds(allSelected ? [] : ids); }} checked={orders.length > 0 && orders.every(o => selectedIds.includes(o._id))} />
                  </th>
                  <th>ID</th>
                  <th>Cliente</th>
                  <th>Itens</th>
                  <th>Tipo</th>
                  <th>Método</th>
                  <th>Mesa</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th className="text-end">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={index}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="form-check-input" 
                        onChange={() => setSelectedIds(prev => prev.includes(order._id) ? prev.filter(x => x !== order._id) : [...prev, order._id])} 
                        checked={selectedIds.includes(order._id)}
                      />
                    </td>
                    <td>#{String(order._id).slice(-6)}</td>
                    <td>
                      <div className="font-weight-medium">{order.address?.firstName} {order.address?.lastName}</div>
                      {order.notes && (
                        <div className="text-muted">Obs: {order.notes}</div>
                      )}
                    </td>
                    <td>{order.items?.length || 0}</td>
                    <td>
                      <span className="badge bg-orange-lt">
                        {getDeliveryTypeLabel(order.deliveryType || 'delivery')}
                      </span>
                    </td>
                    <td>
                      <span className="badge bg-blue-lt">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </span>
                    </td>
                    <td>{order.tableId?.tableNumber || order.tableNumber || '—'}</td>
                    <td>R$ {Number(order.amount).toFixed(2)}</td>
                    <td>
                      <select 
                        onChange={(event) => statusHandler(event, order._id)} 
                        value={order.status}
                        className="form-select form-select-sm"
                      >
                        <option value="Food Processing">Processando</option>
                        <option value="Out for delivery">Saiu para Entrega</option>
                        <option value="Delivered">Entregue</option>
                      </select>
                    </td>
                    <td className="text-end">
                      <button 
                        className={`btn btn-outline btn-sm ${printingOrder === order._id ? 'disabled' : ''}`}
                        onClick={() => printOrder(order._id)}
                        disabled={printingOrder === order._id}
                        title="Imprimir Pedido"
                      >
                        {printingOrder === order._id ? 'Imprimindo…' : 'Imprimir'}
                      </button>
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

export default Orders
