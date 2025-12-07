import React, { useState, useEffect } from 'react';
import './Tables.css';
import { toast } from 'react-toastify';
import axios from 'axios';

const Tables = ({ url }) => {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTables, setLoadingTables] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTable, setEditingTable] = useState(null);
  
  // Form states
  const [tableNumber, setTableNumber] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [capacity, setCapacity] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Fetch tables
  const fetchTables = async () => {
    try {
      setLoadingTables(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/tables`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setTables(response.data.data);
      } else {
        toast.error('Erro ao carregar mesas');
      }
    } catch (error) {
      console.error('Erro ao buscar mesas:', error);
      toast.error('Erro ao carregar mesas');
    } finally {
      setLoadingTables(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setTableNumber('');
    setDisplayName('');
    setCapacity('');
    setLocation('');
    setNotes('');
    setIsActive(true);
    setEditingTable(null);
    setShowAddForm(false);
  };

  // Add or update table
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!tableNumber.trim()) {
      toast.error('Número da mesa é obrigatório');
      return;
    }
    
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const tableData = {
        tableNumber: parseInt(tableNumber),
        displayName: displayName || `Mesa ${tableNumber}`,
        capacity: capacity ? parseInt(capacity) : undefined,
        location: location || undefined,
        notes: notes || undefined,
        isActive
      };
      
      let response;
      if (editingTable) {
        response = await axios.put(`${url}/api/tables/${editingTable._id}`, tableData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${url}/api/tables`, tableData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
      
      if (response.data.success) {
        toast.success(editingTable ? 'Mesa atualizada com sucesso!' : 'Mesa criada com sucesso!');
        resetForm();
        fetchTables();
      } else {
        toast.error(response.data.message || 'Erro ao salvar mesa');
      }
    } catch (error) {
      console.error('Erro ao salvar mesa:', error);
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Erro ao salvar mesa');
      }
    } finally {
      setLoading(false);
    }
  };

  // Edit table
  const handleEdit = (table) => {
    setEditingTable(table);
    setTableNumber(table.tableNumber.toString());
    setDisplayName(table.displayName);
    setCapacity(table.capacity ? table.capacity.toString() : '');
    setLocation(table.location || '');
    setNotes(table.notes || '');
    setIsActive(table.isActive);
    setShowAddForm(true);
  };

  // Delete table
  const handleDelete = async (tableId) => {
    if (!window.confirm('Tem certeza que deseja excluir esta mesa?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${url}/api/tables/${tableId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('Mesa excluída com sucesso!');
        fetchTables();
      } else {
        toast.error('Erro ao excluir mesa');
      }
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      toast.error('Erro ao excluir mesa');
    }
  };

  // Toggle table status
  const toggleTableStatus = async (tableId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.put(`${url}/api/tables/${tableId}`, 
        { isActive: !currentStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        toast.success('Status da mesa atualizado!');
        fetchTables();
      } else {
        toast.error('Erro ao atualizar status da mesa');
      }
    } catch (error) {
      console.error('Erro ao atualizar status da mesa:', error);
      toast.error('Erro ao atualizar status da mesa');
    }
  };

  // Generate QR codes for all tables
  const generateAllQRCodes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/tables/generate-qr-all`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        toast.success('QR codes gerados para todas as mesas!');
        fetchTables();
      } else {
        toast.error('Erro ao gerar QR codes');
      }
    } catch (error) {
      console.error('Erro ao gerar QR codes:', error);
      toast.error('Erro ao gerar QR codes');
    } finally {
      setLoading(false);
    }
  };

  // Print QR codes (PDF Download)
  const printQRCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/tables/print-qr-all`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        responseType: 'blob' // Para receber o PDF como blob
      });
      
      // Criar URL do blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = 'QR-Codes-Todas-Mesas.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF dos QR codes baixado com sucesso!');
    } catch (error) {
      console.error('Erro ao imprimir QR codes:', error);
      toast.error('Erro ao gerar PDF dos QR codes');
    }
  };

  // Print QR codes directly to thermal printer
  const printQRCodesDirect = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/tables/print-qr-all-direct`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Aqui você pode integrar com a API de impressão térmica
        // Por exemplo, enviar os dados para a impressora conectada
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao imprimir QR codes diretamente:', error);
      toast.error('Erro ao imprimir QR codes na impressora térmica');
    }
  };
  
  // Print individual QR code (PDF Download)
  const printIndividualQR = async (tableId, tableNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${url}/api/tables/${tableId}/print-qr`, {
        headers: { 
          Authorization: `Bearer ${token}`
        },
        responseType: 'blob' // Para receber o PDF como blob
      });
      
      // Criar URL do blob e fazer download
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `QR-Mesa-${tableNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`PDF do QR code da Mesa ${tableNumber} baixado com sucesso!`);
    } catch (error) {
      console.error('Erro ao imprimir QR code individual:', error);
      toast.error('Erro ao gerar PDF do QR code');
    }
  };

  // Print individual QR code directly to thermal printer
  const printIndividualQRDirect = async (tableId, tableNumber) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${url}/api/tables/${tableId}/print-qr-direct`, {}, {
        headers: { 
          Authorization: `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Aqui você pode integrar com a API de impressão térmica
        // Por exemplo, enviar os dados para a impressora conectada
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Erro ao imprimir QR code diretamente:', error);
      toast.error('Erro ao imprimir QR code na impressora térmica');
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  if (loadingTables) {
    return (
      <div className="tables">
        <div className="loading">Carregando mesas...</div>
      </div>
    );
  }

  return (
    <div className="tables">
      <div className="tables-header">
        <h2>Gerenciamento de Mesas</h2>
        <div className="header-actions">
          <button 
            className="btn btn-primary"
            onClick={generateAllQRCodes}
            disabled={loading}
          >
            {loading ? 'Gerando...' : 'Gerar QR Codes'}
          </button>
          <button 
            className="btn btn-indigo"
            onClick={printQRCodes}
            disabled={tables.filter(t => t.isActive && t.qrCodeUrl).length === 0}
            title="Baixar PDF com todos os QR codes"
          >
            <i className="ti ti-file-text"></i> Baixar PDF
          </button>
          <button 
            className="btn btn-orange"
            onClick={printQRCodesDirect}
            disabled={tables.filter(t => t.isActive && t.qrCodeUrl).length === 0}
            title="Imprimir diretamente na impressora térmica"
          >
            <i className="ti ti-printer"></i> Imprimir Direto
          </button>
          <button 
            className="btn btn-success"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancelar' : 'Adicionar Mesa'}
          </button>
        </div>
      </div>

      {showAddForm && (
        <div className="card add-form-section">
          <div className="card-header">
            <h3 className="card-title">{editingTable ? 'Editar Mesa' : 'Adicionar Nova Mesa'}</h3>
          </div>
          <div className="card-body">
          <form onSubmit={handleSubmit} className="table-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="tableNumber">Número da Mesa *</label>
                <input
                  type="number"
                  id="tableNumber"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  placeholder="Ex: 1, 2, 3..."
                  className="form-control"
                  required
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="displayName">Nome de Exibição</label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ex: Mesa 1, Mesa VIP..."
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="capacity">Capacidade (pessoas)</label>
                <input
                  type="number"
                  id="capacity"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value)}
                  placeholder="Ex: 2, 4, 6..."
                  className="form-control"
                  min="1"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="location">Localização</label>
                <input
                  type="text"
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Área externa, Salão principal..."
                  className="form-control"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="notes">Observações</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Observações sobre a mesa..."
                className="form-control"
                rows="3"
              />
            </div>
            
            <div className="form-group">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  id="isActiveSwitch"
                />
                <label className="form-check-label" htmlFor="isActiveSwitch">Mesa ativa</label>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="button" onClick={resetForm} className="btn btn-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Salvando...' : (editingTable ? 'Atualizar' : 'Criar Mesa')}
              </button>
            </div>
          </form>
          </div>
        </div>
      )}

      <div className="card tables-list">
        <div className="card-header">
          <h3 className="card-title">Mesas Cadastradas ({tables.length})</h3>
        </div>
        <div className="card-body">
        
        {tables.length === 0 ? (
          <div className="empty-state">
            <p>Nenhuma mesa cadastrada ainda.</p>
            <button 
              className="action-btn add-btn"
              onClick={() => setShowAddForm(true)}
            >
              Adicionar Primeira Mesa
            </button>
          </div>
        ) : (
          <div className="tables-grid">
            {tables.map((table) => (
              <div key={table._id} className={`card table-card ${!table.isActive ? 'inactive' : ''}`}>
                <div className="table-header">
                  <div className="table-number">Mesa {table.tableNumber}</div>
                  <div className="table-status">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={table.isActive}
                        onChange={() => toggleTableStatus(table._id, table.isActive)}
                        id={`active-${table._id}`}
                      />
                      <label className="form-check-label" htmlFor={`active-${table._id}`}></label>
                    </div>
                  </div>
                </div>
                
                <div className="table-info">
                  <h4>{table.displayName}</h4>
                  {table.capacity && <p><strong>Capacidade:</strong> {table.capacity} pessoas</p>}
                  {table.location && <p><strong>Local:</strong> {table.location}</p>}
                  {table.notes && <p><strong>Obs:</strong> {table.notes}</p>}
                  
                  <div className="qr-info">
                    {table.qrCodeUrl ? (
                      <div className="qr-preview d-flex align-items-center gap-2">
                        <img src={table.qrCodeUrl} alt={`QR Code Mesa ${table.tableNumber}`} />
                        <span className="badge bg-green-lt">QR Code gerado</span>
                      </div>
                    ) : (
                      <span className="badge bg-yellow-lt">QR Code não gerado</span>
                    )}
                  </div>
                </div>
                
                <div className="table-actions">
                      <button 
                        className="btn btn-warning"
                        onClick={() => handleEdit(table)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-indigo"
                        onClick={() => printIndividualQR(table._id, table.tableNumber)}
                        disabled={!table.qrCodeUrl}
                        title={table.qrCodeUrl ? 'Baixar PDF do QR Code' : 'QR Code não disponível'}
                      >
                        <i className="ti ti-file-text"></i> PDF
                      </button>
                      <button 
                        className="btn btn-orange"
                        onClick={() => printIndividualQRDirect(table._id, table.tableNumber)}
                        disabled={!table.qrCodeUrl}
                        title={table.qrCodeUrl ? 'Imprimir QR Code diretamente na impressora térmica' : 'QR Code não disponível'}
                      >
                        <i className="ti ti-printer"></i> Direto
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={() => handleDelete(table._id)}
                      >
                        Excluir
                      </button>
                    </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default Tables;
