import React, { useState, useEffect } from 'react';
import './SystemLogs.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const SystemLogs = ({ url, token }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    evento: '',
    lojaId: '',
    page: 1,
    limit: 50
  });
  const [stores, setStores] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50
  });

  // Buscar logs do sistema
  const fetchLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/asaas/admin/payment-logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params: filters
      });
      
      if (response.data.success) {
        setLogs(response.data.data.logs);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Erro ao buscar logs:', error);
      toast.error('Erro ao carregar logs do sistema');
    } finally {
      setLoading(false);
    }
  };

  // Buscar lojas para o filtro
  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/system/stores`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setStores(response.data.stores);
      }
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
    }
  };

  // Reprocessar pagamento
  const reprocessPayment = async (paymentId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${url}/api/asaas/admin/payments/${paymentId}/reprocess`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Pagamento reprocessado com sucesso');
        fetchLogs(); // Recarregar logs
      }
    } catch (error) {
      console.error('Erro ao reprocessar pagamento:', error);
      toast.error('Erro ao reprocessar pagamento');
    }
  };

  useEffect(() => {
    fetchLogs();
    fetchStores();
  }, [filters]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset para primeira página ao filtrar
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'RECEIVED': { class: 'success', text: 'Recebido' },
      'PENDING': { class: 'warning', text: 'Pendente' },
      'CONFIRMED': { class: 'success', text: 'Confirmado' },
      'OVERDUE': { class: 'danger', text: 'Vencido' },
      'REFUNDED': { class: 'info', text: 'Reembolsado' },
      'RECEIVED_IN_CASH': { class: 'success', text: 'Recebido em Dinheiro' },
      'REFUND_REQUESTED': { class: 'warning', text: 'Reembolso Solicitado' },
      'CHARGEBACK_REQUESTED': { class: 'danger', text: 'Chargeback Solicitado' },
      'CHARGEBACK_DISPUTE': { class: 'danger', text: 'Disputa de Chargeback' },
      'AWAITING_CHARGEBACK_REVERSAL': { class: 'warning', text: 'Aguardando Reversão' }
    };
    
    const statusInfo = statusMap[status] || { class: 'secondary', text: status };
    return <span className={`status-badge ${statusInfo.class}`}>{statusInfo.text}</span>;
  };

  const getEventBadge = (evento) => {
    const eventMap = {
      'PAYMENT_CREATED': { class: 'info', text: 'Pagamento Criado' },
      'PAYMENT_UPDATED': { class: 'warning', text: 'Pagamento Atualizado' },
      'PAYMENT_CONFIRMED': { class: 'success', text: 'Pagamento Confirmado' },
      'PAYMENT_RECEIVED': { class: 'success', text: 'Pagamento Recebido' },
      'PAYMENT_OVERDUE': { class: 'danger', text: 'Pagamento Vencido' },
      'PAYMENT_DELETED': { class: 'danger', text: 'Pagamento Excluído' },
      'PAYMENT_RESTORED': { class: 'info', text: 'Pagamento Restaurado' },
      'PAYMENT_REFUNDED': { class: 'warning', text: 'Pagamento Reembolsado' },
      'PAYMENT_RECEIVED_IN_CASH': { class: 'success', text: 'Recebido em Dinheiro' },
      'PAYMENT_CHARGEBACK_REQUESTED': { class: 'danger', text: 'Chargeback Solicitado' },
      'PAYMENT_CHARGEBACK_DISPUTE': { class: 'danger', text: 'Disputa de Chargeback' },
      'PAYMENT_AWAITING_CHARGEBACK_REVERSAL': { class: 'warning', text: 'Aguardando Reversão' }
    };
    
    const eventInfo = eventMap[evento] || { class: 'secondary', text: evento };
    return <span className={`event-badge ${eventInfo.class}`}>{eventInfo.text}</span>;
  };

  if (loading) {
    return (
      <div className="system-logs">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Carregando logs do sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="system-logs">
      <div className="logs-header">
        <h1>📋 Logs do Sistema</h1>
        <p>Monitore todas as atividades e eventos do sistema</p>
      </div>

      {/* Filtros */}
      <div className="logs-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select 
            value={filters.status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
          >
            <option value="">Todos os Status</option>
            <option value="RECEIVED">Recebido</option>
            <option value="PENDING">Pendente</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="OVERDUE">Vencido</option>
            <option value="REFUNDED">Reembolsado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Evento:</label>
          <select 
            value={filters.evento} 
            onChange={(e) => handleFilterChange('evento', e.target.value)}
          >
            <option value="">Todos os Eventos</option>
            <option value="PAYMENT_CREATED">Pagamento Criado</option>
            <option value="PAYMENT_CONFIRMED">Pagamento Confirmado</option>
            <option value="PAYMENT_RECEIVED">Pagamento Recebido</option>
            <option value="PAYMENT_OVERDUE">Pagamento Vencido</option>
            <option value="PAYMENT_REFUNDED">Pagamento Reembolsado</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Loja:</label>
          <select 
            value={filters.lojaId} 
            onChange={(e) => handleFilterChange('lojaId', e.target.value)}
          >
            <option value="">Todas as Lojas</option>
            {stores.map(store => (
              <option key={store._id} value={store._id}>{store.name}</option>
            ))}
          </select>
        </div>

        <button 
          className="refresh-btn"
          onClick={() => fetchLogs()}
        >
          🔄 Atualizar
        </button>
      </div>

      {/* Tabela de Logs */}
      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Loja</th>
              <th>Evento</th>
              <th>Status</th>
              <th>Valor</th>
              <th>ID Pagamento</th>
              <th>Processado</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <tr key={index}>
                  <td>
                    <div className="log-time">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </td>
                  <td>
                    <div className="store-info">
                      <strong>{log.lojaId?.name || 'N/A'}</strong>
                      <small>{log.lojaId?.slug || ''}</small>
                    </div>
                  </td>
                  <td>{getEventBadge(log.evento)}</td>
                  <td>{getStatusBadge(log.status)}</td>
                  <td>
                    <strong>
                      {log.valor ? `R$ ${parseFloat(log.valor).toFixed(2)}` : 'N/A'}
                    </strong>
                  </td>
                  <td>
                    <code>{log.paymentId}</code>
                  </td>
                  <td>
                    <span className={`processed-badge ${log.processado ? 'yes' : 'no'}`}>
                      {log.processado ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td>
                    {!log.processado && (
                      <button 
                        className="action-btn reprocess"
                        onClick={() => reprocessPayment(log.paymentId)}
                      >
                        Reprocessar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="no-logs">
                  Nenhum log encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button 
            disabled={pagination.currentPage === 1}
            onClick={() => handlePageChange(pagination.currentPage - 1)}
          >
            ← Anterior
          </button>
          
          <span className="page-info">
            Página {pagination.currentPage} de {pagination.totalPages}
            ({pagination.totalItems} itens)
          </span>
          
          <button 
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => handlePageChange(pagination.currentPage + 1)}
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default SystemLogs;