import { useContext, useEffect, useState, useCallback } from 'react'
import './MyOrders.css'
import { StoreContext } from './../../components/context/StoreContext';
import axios from 'axios';
import { assets } from './../../assets/assets';
import SEO from '../../components/SEO/SEO';

const MyOrders = () => {

const {url, token} = useContext(StoreContext);
const [data, setData] = useState([]);
const [cashbackData, setCashbackData] = useState({ balance: 0, transactions: [] });

const fetchOrders = useCallback(async () => {
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
}, [url, token]);

const fetchCashback = useCallback(async () => {
    try {
        const response = await axios.get(`${url}/api/cashback/customer`, {
            headers: { token }
        });
        
        if (response.data.success) {
            setCashbackData(response.data.data);
        } else {
            console.error('Erro ao buscar cashback:', response.data.message);
        }
    } catch (error) {
        console.error('Erro ao buscar cashback:', error);
    }
}, [url, token]);

useEffect(() => {
    if(token){
        fetchOrders();
        fetchCashback();
    }
}, [token, fetchOrders, fetchCashback])

  return (
    <div className='my-orders'>
      <SEO 
        title="Meus Pedidos - Food Delivery"
        description="Acompanhe o status dos seus pedidos e histórico de compras."
        keywords="meus pedidos, histórico, status pedido, food delivery"
      />
        <div className="cashback-section">
            <h2>💰 Meu Cashback</h2>
            <div className="cashback-balance">
                <div className="balance-card">
                    <h3>Saldo Disponível</h3>
                    <p className="balance-amount">R$ {cashbackData.balance.toFixed(2)}</p>
                </div>
            </div>
            {cashbackData.transactions && cashbackData.transactions.length > 0 && (
                <div className="cashback-history">
                    <h3>Histórico de Cashback</h3>
                    <div className="transactions-list">
                        {cashbackData.transactions.slice(0, 5).map((transaction, index) => (
                            <div key={index} className="transaction-item">
                                <div className="transaction-info">
                                    <span className={`transaction-type ${transaction.type}`}>
                                        {transaction.type === 'earned' ? '💰 Ganhou' : '🎯 Usou'}
                                    </span>
                                    <span className="transaction-date">
                                        {new Date(transaction.createdAt).toLocaleDateString('pt-BR')}
                                    </span>
                                </div>
                                <span className={`transaction-amount ${transaction.type}`}>
                                    {transaction.type === 'earned' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
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