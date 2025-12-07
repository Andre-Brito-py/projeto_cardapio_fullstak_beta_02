import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { BACKEND_URL } from '../../config/urls';
import CustomerCharts from '../../components/Charts/CustomerCharts';
import ContactableCustomers from '../../components/ContactableCustomers/ContactableCustomers';
import CustomerSegmentation from '../../components/CustomerSegmentation/CustomerSegmentation';
import './Analytics.css';

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [segments, setSegments] = useState([]);
    const [contactableCustomers, setContactableCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedSegment, setSelectedSegment] = useState('');
    const [contactMethod, setContactMethod] = useState('whatsapp');
    const [dateRange, setDateRange] = useState(30);

    const storeId = localStorage.getItem('storeId');
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (storeId && token) {
            fetchAnalytics();
            fetchSegments();
        }
    }, [storeId, token, dateRange]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/analytics/customers/${storeId}?dateRange=${dateRange}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setAnalytics(data.data);
            } else {
                toast.error('Erro ao carregar analytics');
            }
        } catch (error) {
            console.error('Error fetching analytics:', error);
            toast.error('Erro ao carregar analytics');
        }
    };

    const fetchSegments = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/api/analytics/customers/${storeId}/segments`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSegments(data.data);
            }
        } catch (error) {
            console.error('Error fetching segments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchContactableCustomers = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (selectedSegment) queryParams.append('segment', selectedSegment);
            queryParams.append('contactMethod', contactMethod);

            const response = await fetch(`${BACKEND_URL}/api/analytics/customers/${storeId}/contactable?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setContactableCustomers(data.data);
            } else {
                toast.error('Erro ao carregar clientes para contato');
            }
        } catch (error) {
            console.error('Error fetching contactable customers:', error);
            toast.error('Erro ao carregar clientes para contato');
        }
    };

    const exportContactList = () => {
        if (contactableCustomers.length === 0) {
            toast.warning('Nenhum cliente disponível para exportar');
            return;
        }

        const csvContent = [
            ['Nome', 'Telefone', 'WhatsApp', 'Segmento', 'Total Pedidos', 'Último Pedido'],
            ...contactableCustomers.map(customer => [
                customer.name,
                customer.phone,
                customer.whatsappNumber || '',
                customer.customerSegment,
                customer.totalOrders,
                customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString('pt-BR') : 'Nunca'
            ])
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `clientes_${selectedSegment || 'todos'}_${contactMethod}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success('Lista de contatos exportada com sucesso!');
    };

    const getSegmentColor = (segment) => {
        const colors = {
            new: '#4CAF50',
            loyal: '#2196F3',
            inactive: '#FF9800',
            vip: '#9C27B0'
        };
        return colors[segment] || '#757575';
    };

    const getSegmentLabel = (segment) => {
        const labels = {
            new: 'Novos',
            loyal: 'Fiéis',
            inactive: 'Inativos',
            vip: 'VIP'
        };
        return labels[segment] || segment;
    };

    if (loading) {
        return <div className="analytics-loading">Carregando analytics...</div>;
    }

    return (
        <div className="analytics">
            <div className="analytics-header">
                <h1>Analytics de Clientes - Liza Campaigns</h1>
                <div className="date-range-selector">
                    <label>Período:</label>
                    <select 
                        value={dateRange} 
                        onChange={(e) => setDateRange(parseInt(e.target.value))}
                    >
                        <option value={7}>Últimos 7 dias</option>
                        <option value={30}>Últimos 30 dias</option>
                        <option value={90}>Últimos 90 dias</option>
                        <option value={365}>Último ano</option>
                    </select>
                </div>
            </div>

            {analytics && (
                <div className="analytics-overview">
                    <div className="metric-card">
                        <h3>Total de Clientes</h3>
                        <div className="metric-value">
                            {analytics.totalCustomers[0]?.count || 0}
                        </div>
                    </div>
                    <div className="metric-card">
                        <h3>Novos Clientes</h3>
                        <div className="metric-value">
                            {analytics.newCustomers[0]?.count || 0}
                        </div>
                    </div>
                    <div className="metric-card">
                        <h3>Clientes Fiéis</h3>
                        <div className="metric-value">
                            {analytics.loyalCustomers[0]?.count || 0}
                        </div>
                    </div>
                    <div className="metric-card">
                        <h3>Clientes Inativos</h3>
                        <div className="metric-value">
                            {analytics.inactiveCustomers[0]?.count || 0}
                        </div>
                    </div>
                    <div className="metric-card">
                        <h3>Clientes VIP</h3>
                        <div className="metric-value">
                            {analytics.vipCustomers[0]?.count || 0}
                        </div>
                    </div>
                </div>
            )}

            {/* Gráficos Interativos */}
      <CustomerCharts analytics={analytics} />

      {/* Clientes Contactáveis para Liza */}
      <ContactableCustomers />

      {/* Sistema de Segmentação */}
      <CustomerSegmentation />

      <div className="segments-section">
                <h2>Segmentos de Clientes</h2>
                <div className="segments-grid">
                    {segments.map((segment, index) => (
                        <div key={index} className="segment-card">
                            <div 
                                className="segment-color" 
                                style={{ backgroundColor: getSegmentColor(segment._id) }}
                            ></div>
                            <div className="segment-info">
                                <h4>{getSegmentLabel(segment._id)}</h4>
                                <p className="segment-count">{segment.count} clientes</p>
                                <p className="segment-orders">Média: {segment.avgOrders?.toFixed(1) || 0} pedidos</p>
                                <div className="contact-info">
                                    <span className="whatsapp-count">📱 {segment.contactableWhatsapp}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="campaign-section">
                <h2>Campanhas da Liza - Clientes para Contato</h2>
                <div className="campaign-filters">
                    <div className="filter-group">
                        <label>Segmento:</label>
                        <select 
                            value={selectedSegment} 
                            onChange={(e) => setSelectedSegment(e.target.value)}
                        >
                            <option value="">Todos os segmentos</option>
                            <option value="new">Novos</option>
                            <option value="loyal">Fiéis</option>
                            <option value="inactive">Inativos</option>
                            <option value="vip">VIP</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Método de Contato:</label>
                        <select 
                            value={contactMethod} 
                            onChange={(e) => setContactMethod(e.target.value)}
                        >
                            <option value="whatsapp">WhatsApp</option>
                        </select>
                    </div>
                    <button 
                        className="btn-primary" 
                        onClick={fetchContactableCustomers}
                    >
                        Buscar Clientes
                    </button>
                    {contactableCustomers.length > 0 && (
                        <button 
                            className="btn-secondary" 
                            onClick={exportContactList}
                        >
                            Exportar Lista ({contactableCustomers.length})
                        </button>
                    )}
                </div>

                {contactableCustomers.length > 0 && (
                    <div className="contactable-customers">
                        <h3>Clientes Disponíveis para Contato ({contactableCustomers.length})</h3>
                        <div className="customers-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Nome</th>
                                        <th>Telefone</th>
                                        <th>WhatsApp</th>
                                        <th>Segmento</th>
                                        <th>Pedidos</th>
                                        <th>Último Pedido</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {contactableCustomers.slice(0, 50).map((customer, index) => (
                                        <tr key={index}>
                                            <td>{customer.name}</td>
                                            <td>{customer.phone}</td>
                                            <td>{customer.whatsappNumber || '-'}</td>
                                        
                                            <td>
                                                <span 
                                                    className="segment-badge"
                                                    style={{ backgroundColor: getSegmentColor(customer.customerSegment) }}
                                                >
                                                    {getSegmentLabel(customer.customerSegment)}
                                                </span>
                                            </td>
                                            <td>{customer.totalOrders}</td>
                                            <td>
                                                {customer.lastOrderDate 
                                                    ? new Date(customer.lastOrderDate).toLocaleDateString('pt-BR')
                                                    : 'Nunca'
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {contactableCustomers.length > 50 && (
                                <p className="table-note">
                                    Mostrando primeiros 50 de {contactableCustomers.length} clientes. 
                                    Use a exportação para ver todos.
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Analytics;
