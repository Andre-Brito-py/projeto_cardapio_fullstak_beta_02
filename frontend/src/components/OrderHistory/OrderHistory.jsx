import { useContext, useEffect, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import './OrderHistory.css';
import { StoreContext } from '../context/StoreContext';
import axios from 'axios';

const OrderHistory = ({ storeId, onItemClick }) => {
    const { url, token } = useContext(StoreContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expanded, setExpanded] = useState(false);

    const fetchOrderHistory = useCallback(async () => {
        if (!token || !storeId) return;
        
        setLoading(true);
        try {
            const response = await axios.post(`${url}/api/order/userorders`, {}, {
                headers: { token }
            });
            
            if (response.data.success) {
                // Filtrar pedidos apenas desta loja e pegar os 5 mais recentes
                const storeOrders = response.data.data
                    .filter(order => order.storeId === storeId)
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 5);
                setOrders(storeOrders);
            }
        } catch (error) {
            console.error('Erro ao buscar histórico de pedidos:', error);
        } finally {
            setLoading(false);
        }
    }, [url, token, storeId]);

    useEffect(() => {
        fetchOrderHistory();
    }, [fetchOrderHistory]);

    const handleItemClick = (item) => {
        if (onItemClick) {
            onItemClick(item);
        }
    };

    const getUniqueItems = () => {
        const itemMap = new Map();
        
        orders.forEach(order => {
            order.items.forEach(item => {
                if (itemMap.has(item.name)) {
                    itemMap.get(item.name).quantity += item.quantity;
                    itemMap.get(item.name).orderCount += 1;
                } else {
                    itemMap.set(item.name, {
                        ...item,
                        orderCount: 1
                    });
                }
            });
        });

        return Array.from(itemMap.values())
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 6);
    };

    if (!token) {
        return (
            <div className="order-history">
                <div className="order-history-header">
                    <h3>📋 Seus Pedidos Anteriores</h3>
                    <p className="login-prompt">Faça login para ver seus pedidos anteriores</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="order-history">
                <div className="order-history-header">
                    <h3>📋 Seus Pedidos Anteriores</h3>
                </div>
                <div className="order-history-loading">
                    <div className="loading-spinner"></div>
                    <p>Carregando histórico...</p>
                </div>
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="order-history">
                <div className="order-history-header">
                    <h3>📋 Seus Pedidos Anteriores</h3>
                    <p className="no-orders">Você ainda não fez pedidos nesta loja</p>
                </div>
            </div>
        );
    }

    const uniqueItems = getUniqueItems();

    return (
        <div className="order-history">
            <div className="order-history-header">
                <h3>📋 Seus Pedidos Anteriores</h3>
                <button 
                    className="expand-toggle"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? 'Ver menos' : 'Ver mais'}
                </button>
            </div>

            <div className="order-history-content">
                {!expanded ? (
                    // Visualização compacta - itens mais pedidos
                    <div className="frequent-items">
                        <h4>🔥 Seus favoritos</h4>
                        <div className="frequent-items-grid">
                            {uniqueItems.map((item, index) => (
                                <div 
                                    key={index} 
                                    className="frequent-item"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="item-info">
                                        <span className="item-name">{item.name}</span>
                                        <span className="item-stats">
                                            Pedido {item.quantity}x em {item.orderCount} pedido{item.orderCount > 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <button className="reorder-btn">
                                        ➕ Pedir novamente
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    // Visualização expandida - histórico completo
                    <div className="order-history-expanded">
                        <h4>📅 Histórico completo</h4>
                        <div className="orders-list">
                            {orders.map((order, index) => (
                                <div key={index} className="order-item">
                                    <div className="order-header">
                                        <span className="order-date">
                                            {new Date(order.date).toLocaleDateString('pt-BR')}
                                        </span>
                                        <span className="order-total">
                                            R$ {order.amount.toFixed(2)}
                                        </span>
                                        <span className={`order-status ${order.status.toLowerCase()}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <div className="order-items">
                                        {order.items.map((item, itemIndex) => (
                                            <div 
                                                key={itemIndex} 
                                                className="order-item-detail"
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <span className="item-name">{item.name}</span>
                                                <span className="item-quantity">x{item.quantity}</span>
                                                <button className="reorder-item-btn">
                                                    ➕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

OrderHistory.propTypes = {
    storeId: PropTypes.string.isRequired,
    onItemClick: PropTypes.func
};

export default OrderHistory;