import React, { useState, useEffect } from 'react'
import { Plus, Minus, ShoppingCart, X, Check } from 'lucide-react'
import { toast } from 'react-toastify'

const Orders = ({ attendant }) => {
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('dinheiro');
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState(['dinheiro', 'pix', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao']);
  const [observations, setObservations] = useState('')

  useEffect(() => {
    fetchProducts()
    fetchTodayOrders()
    fetchAcceptedPaymentMethods()
  }, [])

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/counter-orders/products', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setProducts(data.products || [])
      }
    } catch (error) {
      console.error('Erro ao buscar produtos:', error)
    }
  }

  const fetchAcceptedPaymentMethods = async () => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/settings/payment-methods', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.acceptedPaymentMethods) {
          setAcceptedPaymentMethods(data.acceptedPaymentMethods)
          // Se o método atual não estiver na lista aceita, usar o primeiro disponível
          if (!data.acceptedPaymentMethods.includes(paymentMethod)) {
            setPaymentMethod(data.acceptedPaymentMethods[0] || 'dinheiro')
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar formas de pagamento aceitas:', error)
    }
  }

  const fetchTodayOrders = async () => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/counter-orders/today', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = (product) => {
    const existingItem = cart.find(item => item._id === product._id)
    
    if (existingItem) {
      setCart(cart.map(item => 
        item._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { ...product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId) => {
    const existingItem = cart.find(item => item._id === productId)
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item._id === productId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ))
    } else {
      setCart(cart.filter(item => item._id !== productId))
    }
  }

  const clearCart = () => {
    setCart([])
    setCustomerName('')
    setCustomerPhone('')
    setPaymentMethod('dinheiro')
    setObservations('')
  }

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const createOrder = async () => {
    if (cart.length === 0) {
      toast.error('Adicione pelo menos um item ao pedido')
      return
    }

    if (!customerName.trim()) {
      toast.error('Digite o nome do cliente')
      return
    }

    setCreating(true)

    try {
      const token = localStorage.getItem('counter-token')
      const orderData = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        paymentMethod: paymentMethod,
        items: cart.map(item => ({
          productId: item._id,
          quantity: item.quantity,
          price: item.price
        })),
        observations: observations.trim(),
        total: calculateTotal()
      }

      const response = await fetch('/api/counter-orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(orderData)
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Pedido criado com sucesso!')
        clearCart()
        fetchTodayOrders()
      } else {
        toast.error(data.message || 'Erro ao criar pedido')
      }
    } catch (error) {
      console.error('Erro ao criar pedido:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setCreating(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch(`/api/counter-orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Status atualizado com sucesso!')
        fetchTodayOrders()
      } else {
        const data = await response.json()
        toast.error(data.message || 'Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast.error('Erro de conexão. Tente novamente.')
    }
  }

  if (loading) {
    return <div className="loading">Carregando...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Pedidos Presenciais</h1>

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        {/* Seção de Criação de Pedidos */}
        <div>
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Novo Pedido</h2>
            
            <div className="form-group">
              <label className="form-label">Nome do Cliente</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="form-control"
                placeholder="Digite o nome do cliente"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Telefone do Cliente (opcional)</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="form-control"
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Forma de Pagamento</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="form-control"
              >
                {acceptedPaymentMethods.map(method => {
                  const paymentLabels = {
                    'dinheiro': '💵 Dinheiro',
                    'pix': '💳 PIX',
                    'cartao_credito': '💳 Cartão de Crédito',
                    'cartao_debito': '💳 Cartão de Débito',
                    'vale_refeicao': '🍽️ Vale Refeição',
                    'vale_alimentacao': '🛒 Vale Alimentação'
                  };
                  return (
                    <option key={method} value={method}>
                      {paymentLabels[method] || method}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Observações</label>
              <textarea
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                className="form-control"
                placeholder="Observações do pedido (opcional)"
                rows={3}
              />
            </div>

            <h3 style={{ margin: '1.5rem 0 1rem' }}>Produtos Disponíveis</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {products.map(product => (
                <div key={product._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  marginBottom: '0.5rem'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{product.name}</div>
                    <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                      R$ {product.price.toFixed(2)}
                    </div>
                  </div>
                  <button
                    onClick={() => addToCart(product)}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem' }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Carrinho */}
          {cart.length > 0 && (
            <div className="card" style={{ marginTop: '1rem' }}>
              <h3 style={{ marginBottom: '1rem' }}>Carrinho</h3>
              
              {cart.map(item => (
                <div key={item._id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid #eee'
                }}>
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.name}</div>
                    <div style={{ color: '#6c757d', fontSize: '0.9rem' }}>
                      R$ {item.price.toFixed(2)} x {item.quantity}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      onClick={() => removeFromCart(item._id)}
                      className="btn btn-secondary"
                      style={{ padding: '0.25rem' }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '2rem', textAlign: 'center' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => addToCart(item)}
                      className="btn btn-primary"
                      style={{ padding: '0.25rem' }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1rem',
                paddingTop: '1rem',
                borderTop: '2px solid #ddd'
              }}>
                <strong style={{ fontSize: '1.2rem' }}>
                  Total: R$ {calculateTotal().toFixed(2)}
                </strong>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={clearCart}
                    className="btn btn-secondary"
                  >
                    <X size={16} />
                    Limpar
                  </button>
                  <button
                    onClick={createOrder}
                    disabled={creating}
                    className="btn btn-success"
                  >
                    <ShoppingCart size={16} />
                    {creating ? 'Criando...' : 'Criar Pedido'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Seção de Pedidos do Dia */}
        <div>
          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Pedidos de Hoje</h2>
            
            {orders.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#6c757d', padding: '2rem' }}>
                Nenhum pedido criado hoje
              </p>
            ) : (
              <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                {orders.map(order => (
                  <div key={order._id} style={{
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    padding: '1rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '0.5rem'
                    }}>
                      <strong>#{order.orderNumber}</strong>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.8rem',
                        backgroundColor: order.status === 'completed' ? '#d4edda' : 
                                       order.status === 'preparing' ? '#fff3cd' : '#f8d7da',
                        color: order.status === 'completed' ? '#155724' : 
                               order.status === 'preparing' ? '#856404' : '#721c24'
                      }}>
                        {order.status === 'completed' ? 'Concluído' : 
                         order.status === 'preparing' ? 'Preparando' : 'Pendente'}
                      </span>
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Cliente:</strong> {order.customerName}
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Total:</strong> R$ {order.total.toFixed(2)}
                    </div>
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <strong>Horário:</strong> {new Date(order.createdAt).toLocaleTimeString()}
                    </div>
                    
                    {order.observations && (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <strong>Observações:</strong> {order.observations}
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '1rem' }}>
                      <strong>Itens:</strong>
                      <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
                        {order.items.map((item, index) => (
                          <li key={index}>
                            {item.quantity}x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {order.status !== 'completed' && (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {order.status === 'pending' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'preparing')}
                            className="btn btn-primary"
                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                          >
                            Iniciar Preparo
                          </button>
                        )}
                        {order.status === 'preparing' && (
                          <button
                            onClick={() => updateOrderStatus(order._id, 'completed')}
                            className="btn btn-success"
                            style={{ fontSize: '0.8rem', padding: '0.5rem' }}
                          >
                            <Check size={14} />
                            Concluir
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Orders