import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Orders = ({ url, token }) => {
  const [orders, setOrders] = useState([]);
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [printingOrder, setPrintingOrder] = useState(null);
  const [deliveryTypeFilter, setDeliveryTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [filteredTotals, setFilteredTotals] = useState({ count: 0, revenue: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('Food Processing');

  const fetchAllOrders = async () => {
    setLoading(true);
    try {
      const response = await axios.get(url + "/api/order/list", {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        setAllOrders(response.data.data);
        setOrders(response.data.data);
      } else {
        toast.error("Erro ao buscar pedidos");
      }
    } catch (error) {
      toast.error('Erro ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

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

  const getDeliveryTypeLabel = (type) => {
    const labels = {
      'delivery': 'Entrega',
      'waiter': 'Garçom', 
      'in_person': 'Presencial'
    };
    return labels[type] || type;
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

  const statusHandler = async (event, orderId) => {
    try {
      const response = await axios.post(url + "/api/order/status", {
        orderId,
        status: event.target.value
      }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.data.success) {
        toast.success("Status atualizado!");
        await fetchAllOrders();
      }
    } catch(err) {
      toast.error('Erro ao atualizar status');
    }
  };

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
      toast.error('Erro ao imprimir pedido. Verifique a impressora.');
    } finally {
      setPrintingOrder(null);
    }
  };

  const handleBulkStatusUpdate = async () => {
    try {
      for (const id of selectedIds) {
        await axios.post(url + "/api/order/status", { orderId: id, status: bulkStatus }, { 
          headers: { 'Authorization': `Bearer ${token}` } 
        });
      }
      toast.success('Status atualizado em massa');
      setSelectedIds([]);
      await fetchAllOrders();
    } catch(err) {
      toast.error('Erro ao atualizar pedidos');
    }
  };

  const handleBulkPrint = async () => {
    for (const id of selectedIds) {
      await printOrder(id);
    }
    setSelectedIds([]);
  };

  useEffect(() => {
    fetchAllOrders();
  }, []);

  useEffect(() => {
    filterOrders();
  }, [deliveryTypeFilter, statusFilter, paymentMethodFilter, searchQuery, allOrders]);

  return (
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciador de Pedidos</h1>
            <p className="text-sm text-gray-500 mt-1">Monitore e gerencie os pedidos em tempo real.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-50 text-indigo-700">
              {filteredTotals.count} pedidos
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-50 text-green-700">
              R$ {filteredTotals.revenue.toFixed(2).replace('.', ',')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Tipo</label>
            <select 
              value={deliveryTypeFilter}
              onChange={(e) => setDeliveryTypeFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="delivery">Entrega</option>
              <option value="waiter">Garçom</option>
              <option value="in_person">Presencial</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Status</label>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="Food Processing">Processando</option>
              <option value="Out for delivery">Saiu para Entrega</option>
              <option value="Delivered">Entregue</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Pagamento</label>
            <select 
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-lg shadow-sm"
            >
              <option value="all">Todos</option>
              <option value="pix">PIX</option>
              <option value="dinheiro">Dinheiro</option>
              <option value="cartao_credito">Crédito</option>
              <option value="cartao_debito">Débito</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Busca</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ti ti-search text-gray-400"></i>
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-2"
                placeholder="Cliente, item, mesa..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-indigo-100 text-indigo-800">
              {selectedIds.length} selecionados
            </span>
            <select 
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
              className="block pl-3 pr-10 py-1.5 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="Food Processing">Processando</option>
              <option value="Out for delivery">Saiu para Entrega</option>
              <option value="Delivered">Entregue</option>
            </select>
            <button 
              onClick={handleBulkStatusUpdate}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Atualizar Status
            </button>
            <button 
              onClick={handleBulkPrint}
              disabled={printingOrder !== null}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Imprimir Selecionados
            </button>
          </div>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          >
            Limpar Seleção
          </button>
        </motion.div>
      )}

      {/* Orders Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input 
                    type="checkbox" 
                    onChange={() => { 
                      const ids = orders.map(o => o._id); 
                      setSelectedIds(ids.every(id => selectedIds.includes(id)) ? [] : ids); 
                    }} 
                    checked={orders.length > 0 && orders.every(o => selectedIds.includes(o._id))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Itens</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo/Pagamento</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Mesa/Valor</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
                      Carregando pedidos...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    Nenhum pedido encontrado.
                  </td>
                </tr>
              ) : (
                orders.map((order, index) => (
                  <tr key={index} className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(order._id) ? 'bg-indigo-50/30' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input 
                        type="checkbox" 
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        onChange={() => setSelectedIds(prev => prev.includes(order._id) ? prev.filter(x => x !== order._id) : [...prev, order._id])} 
                        checked={selectedIds.includes(order._id)}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{String(order._id).slice(-6)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{order.address?.firstName} {order.address?.lastName}</div>
                      {order.notes && (
                        <div className="text-xs text-gray-500 mt-1 italic">Obs: {order.notes}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.items?.length || 0} itens
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 self-start">
                          {getDeliveryTypeLabel(order.deliveryType || 'delivery')}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 self-start">
                          {getPaymentMethodLabel(order.paymentMethod)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1">
                        {order.deliveryType === 'waiter' || order.deliveryType === 'in_person' ? (
                          <span className="text-xs text-gray-500">Mesa: <strong className="text-gray-900">{order.tableId?.tableNumber || order.tableNumber || '—'}</strong></span>
                        ) : null}
                        <span className="text-sm font-semibold text-gray-900">R$ {Number(order.amount).toFixed(2).replace('.', ',')}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        onChange={(event) => statusHandler(event, order._id)} 
                        value={order.status}
                        className={`block w-full pl-3 pr-8 py-1.5 text-xs font-medium rounded-full focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800 border-green-200' :
                          order.status === 'Out for delivery' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}
                      >
                        <option value="Food Processing">Processando</option>
                        <option value="Out for delivery">Saiu para Entrega</option>
                        <option value="Delivered">Entregue</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className={`inline-flex items-center p-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${printingOrder === order._id ? 'opacity-50 cursor-wait' : ''}`}
                        onClick={() => printOrder(order._id)}
                        disabled={printingOrder === order._id}
                        title="Imprimir Pedido"
                      >
                        <i className={`ti ${printingOrder === order._id ? 'ti-loader animate-spin' : 'ti-printer'} text-lg text-gray-500`}></i>
                      </button>
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

export default Orders;
