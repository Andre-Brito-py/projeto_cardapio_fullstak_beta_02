import { useContext, useEffect, useState, useCallback } from 'react'
import PropTypes from 'prop-types'
import './PlaceOrder.css'
import { StoreContext } from '../../components/context/StoreContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO/SEO';
import useDeliveryCalculation from '../../hooks/useDeliveryCalculation';

const PlaceOrder = ({ setShowLogin }) => {
  const {getTotalCartAmount, token, food_list, cartItems, url} = useContext(StoreContext);
  const { deliveryData, calculateDeliveryFee } = useDeliveryCalculation(url);
  const navigate = useNavigate();

  const [data, setData] = useState({
    firstName:"",
    lastName:"",
    email:"",
    street:"",
    number:"",
    complement:"",
    neighborhood:"",
    city:"",
    state:"",
    zipcode:"",
    country:"",
    phone:""
  });

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('cartao');
  const [cardType, setCardType] = useState('credito');
  const [pixKey, setPixKey] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');
  
  // Coupon states
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  
  // Shipping states
  const [shippingFee, setShippingFee] = useState(0);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState('');
  const [shippingData, setShippingData] = useState(null);

  const handleChange = (event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({...data, [name]: value}));
    }

  const fetchPixKey = useCallback(async () => {
    try {
      const response = await axios.get(`${url}/api/settings/pix-key`);
      if (response.data.success) {
        setPixKey(response.data.pixKey || 'Chave PIX não configurada');
      }
    } catch (error) {
      console.error('Erro ao buscar chave PIX:', error);
      setPixKey('Erro ao carregar chave PIX');
    }
  }, [url]);

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar chave PIX:', error);
    }
  };

  // Coupon functions
  const validateCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError('Digite um código de cupom');
      return;
    }

    setCouponLoading(true);
    setCouponError('');

    try {
      const subtotal = getTotalCartAmount();
      // Enviar token apenas se disponível para validação de cupom
      const headers = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await axios.post(`${url}/api/coupons/validate`, {
        code: couponCode.toUpperCase(),
        orderValue: subtotal
      }, {
        headers
      });

      if (response.data.success) {
        const coupon = response.data.coupon;
        const discount = response.data.discount;
        
        setAppliedCoupon(coupon);
        setCouponDiscount(discount);
        setCouponError('');
      } else {
        setCouponError(response.data.message || 'Cupom inválido');
        setAppliedCoupon(null);
        setCouponDiscount(0);
      }
    } catch (error) {
      console.error('Erro ao validar cupom:', error);
      setCouponError(error.response?.data?.message || 'Erro ao validar cupom');
      setAppliedCoupon(null);
      setCouponDiscount(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponCode('');
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponError('');
  };

  const handleCouponInputChange = (e) => {
    setCouponCode(e.target.value.toUpperCase());
    if (appliedCoupon) {
      removeCoupon();
    }
  };

  // Função para calcular frete usando Google Maps API
  const calculateShippingFee = async () => {
    if (deliveryType !== 'delivery') {
      setShippingFee(0);
      setShippingData(null);
      return;
    }

    if (!data.street || !data.number || !data.neighborhood || !data.city || !data.state || !data.zipcode) {
      return; // Não calcular se campos obrigatórios estão vazios
    }

    setShippingLoading(true);
    setShippingError('');

    try {
      const address = {
        street: data.street,
        number: data.number,
        complement: data.complement,
        neighborhood: data.neighborhood,
        city: data.city,
        state: data.state,
        zipCode: data.zipcode
      };

      const response = await axios.post(`${url}/api/shipping/calculate`, {
        address: address
      });

      if (response.data.success) {
        setShippingFee(response.data.fee);
        setShippingData(response.data.shippingData);
        setShippingError('');
      } else {
        setShippingError(response.data.message || 'Erro ao calcular frete');
        setShippingFee(0);
        setShippingData(null);
      }
    } catch (error) {
      console.error('Erro ao calcular frete:', error);
      setShippingError('Erro ao calcular frete. Usando taxa padrão.');
      // Fallback para taxa de entrega padrão
      setShippingFee(deliveryData?.fee || 5);
      setShippingData(null);
    } finally {
      setShippingLoading(false);
    }
  };

  // Função para validar email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const placeOrder = async (event) => {
    event.preventDefault();
    
    // Validação adicional de email para pedidos sem login
    if (!token && !validateEmail(data.email)) {
      alert('Por favor, insira um endereço de email válido. Precisamos dele para enviar atualizações sobre seu pedido.');
      return;
    }
    
    // Validação adicional para pedidos sem login
    if (!token) {
      if (!data.firstName.trim() || !data.lastName.trim()) {
        alert('Por favor, preencha seu nome completo.');
        return;
      }
      if (!data.phone.trim()) {
        alert('Por favor, informe seu telefone para contato sobre o pedido.');
        return;
      }
    }
    
    try {
      let orderItems = [];
      
      // Processar itens do carrinho com suas chaves compostas
      Object.keys(cartItems).forEach(cartKey => {
        const cartItem = cartItems[cartKey];
        if (cartItem && cartItem.quantity > 0) {
          // Encontrar o item na lista de comidas
          const foodItem = food_list.find(item => item._id === cartItem.itemId);
          if (foodItem) {
            let itemInfo = {
              ...foodItem,
              quantity: cartItem.quantity,
              extras: cartItem.extras || [],
              observations: cartItem.observations || '',
              includeDisposables: cartItem.includeDisposables || false
            };
            orderItems.push(itemInfo);
          }
        }
      });
      
      const deliveryFee = deliveryType === 'delivery' ? shippingFee : 0;
      const finalAmount = getTotalCartAmount() + deliveryFee - couponDiscount;
      
      let orderData = {
        address: data,
        items: orderItems,
        amount: finalAmount,
        deliveryType: deliveryType,
        deliveryFee: deliveryFee,
        shippingData: shippingData, // Dados do Google Maps
        couponCode: appliedCoupon?.code || null,
        discountAmount: couponDiscount,
        customerId: selectedCustomer?._id || null,
        customerInfo: selectedCustomer ? {
          name: selectedCustomer.name,
          phone: selectedCustomer.phone,
          address: selectedCustomer.address
        } : null
      };

      // Enviar token apenas se disponível (usuário logado)
      const headers = {};
      if (token) {
        headers.token = token;
      }
      
      const response = await axios.post(`${url}/api/order/place`, orderData, {
        headers
      });
      
      if(response.data.success) {
        const { session_url } = response.data;
        window.location.replace(session_url);
      } else {
        alert(response.data.message || 'Erro ao processar pedido. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao fazer pedido:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao processar pedido. Verifique sua conexão e tente novamente.';
      alert(errorMessage);
    }
  }

  // Carregar informações do cliente e configurações de entrega
  useEffect(() => {
    const customerData = localStorage.getItem('selectedCustomer');
    const savedDeliveryType = localStorage.getItem('deliveryType');
    const savedDeliveryAddress = localStorage.getItem('deliveryAddress');
    
    if (!customerData) {
      // Se não há cliente selecionado, redirecionar para seleção de cliente
      navigate('/customer-info');
      return;
    }
    
    try {
      const customer = JSON.parse(customerData);
      setSelectedCustomer(customer);
      
      // Preencher dados do formulário com informações do cliente
      setData({
        firstName: customer.name.split(' ')[0] || '',
        lastName: customer.name.split(' ').slice(1).join(' ') || '',
        email: customer.email || '',
        street: customer.address?.street || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        zipcode: customer.address?.zipCode || '',
        country: customer.address?.country || 'Brasil',
        phone: customer.phone || ''
      });
      
      // Configurar tipo de entrega
      if (savedDeliveryType) {
        setDeliveryType(savedDeliveryType);
      }
      
      // Se for entrega e há endereço salvo, usar esse endereço
      if (savedDeliveryType === 'delivery' && savedDeliveryAddress) {
        const deliveryAddr = JSON.parse(savedDeliveryAddress);
        setData(prev => ({
          ...prev,
          street: deliveryAddr.street || prev.street,
          city: deliveryAddr.city || prev.city,
          state: deliveryAddr.state || prev.state,
          zipcode: deliveryAddr.zipCode || prev.zipcode,
          country: deliveryAddr.country || prev.country
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar dados do cliente:', error);
      navigate('/customer-info');
    }
  }, [navigate]);

  // Verificar se carrinho está vazio após sincronização
  useEffect(() => {
    // Aguardar um pouco para garantir que a sincronização aconteceu
    const timeoutId = setTimeout(() => {
      if(getTotalCartAmount() === 0){
        console.log('🛒 PlaceOrder: Carrinho vazio, redirecionando para /cart');
        navigate('/cart');
      }
    }, 500); // Aguardar 500ms para sincronização
    
    return () => clearTimeout(timeoutId);
  }, [getTotalCartAmount, navigate]);

  useEffect(() => {
    if (paymentMethod === 'pix') {
      fetchPixKey();
    }
  }, [paymentMethod, fetchPixKey]);

  // Calcular taxa de entrega quando endereço mudar
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      calculateShippingFee();
    }, 1000); // Debounce de 1 segundo para evitar muitas chamadas

    return () => clearTimeout(timeoutId);
  }, [data.street, data.number, data.neighborhood, data.city, data.state, data.zipcode, deliveryType]);

  return (
    <>
      <SEO 
        title="Finalizar Pedido - Food Delivery"
        description="Complete seu pedido com informações de entrega e pagamento seguro."
        keywords="finalizar pedido, pagamento, entrega, food delivery"
      />
      <form onSubmit={placeOrder} className='place-order'>
      <div className="place-order-left">
        <p className="title">Informações de Entrega</p>
        
        {/* Seção informativa sobre cadastro opcional */}
        {!token && (
          <div className="guest-checkout-info">
            <div className="info-box">
              <h4>💡 Dica: Cadastre-se e aproveite os benefícios!</h4>
              <ul>
                <li>🎯 Acompanhe seus pedidos em tempo real</li>
                <li>📋 Histórico completo de pedidos</li>
                <li>⚡ Checkout mais rápido em futuras compras</li>
                <li>🎁 Ofertas e cupons exclusivos</li>
                <li>📱 Notificações sobre o status do pedido</li>
              </ul>
              <p className="optional-note">
                <strong>Não se preocupe:</strong> Você pode fazer seu pedido sem cadastro, 
                mas recomendamos criar uma conta para uma experiência completa!
              </p>
              <button 
                type="button" 
                onClick={() => setShowLogin(true)}
                className="register-suggestion-btn"
              >
                Criar Conta Agora
              </button>
            </div>
          </div>
        )}
        
        <div className="multi-fields">
          <input required name='firstName' onChange={handleChange} value={data.firstName} type="text" placeholder='Nome'/>
                <input required name='lastName' onChange={handleChange} value={data.lastName} type="text" placeholder='Sobrenome'/>
        </div>
        <input required name='email' onChange={handleChange} value={data.email} type="email" placeholder='Endereço de email'/>
                <div className="multi-fields">
          <input required name='street' onChange={handleChange} value={data.street} type="text" placeholder='Rua' style={{flex: '2'}}/>
          <input required name='number' onChange={handleChange} value={data.number} type="text" placeholder='Número' style={{flex: '1'}}/>
        </div>
        <input name='complement' onChange={handleChange} value={data.complement} type="text" placeholder='Complemento (opcional)'/>
        <input required name='neighborhood' onChange={handleChange} value={data.neighborhood} type="text" placeholder='Bairro'/>
        <div className="multi-fields">
          <input required name='city' onChange={handleChange} value={data.city}  type="text" placeholder='Cidade'/>
          <input required name='state' onChange={handleChange} value={data.state} type="text" placeholder='Estado'/>
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={handleChange} value={data.zipcode} type="text" placeholder='CEP'/>
          <input required name='country' onChange={handleChange} value={data.country} type="text" placeholder='País'/>
        </div>
        <input required name='phone' onChange={handleChange} value={data.phone} type="text" placeholder='Telefone' />
        
        {/* Delivery Type Selection */}
        <div className="delivery-type-section">
          <p className="title">Tipo de Pedido</p>
          <div className="delivery-options">
            <div className="payment-option">
              <input 
                type="radio" 
                id="delivery" 
                name="deliveryType" 
                value="delivery" 
                checked={deliveryType === 'delivery'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              <label htmlFor="delivery">🚚 Entrega</label>
            </div>
            
            <div className="payment-option">
              <input 
                type="radio" 
                id="pickup" 
                name="deliveryType" 
                value="pickup" 
                checked={deliveryType === 'pickup'}
                onChange={(e) => setDeliveryType(e.target.value)}
              />
              <label htmlFor="pickup">🏪 Retirar no Local</label>
            </div>
          </div>
        </div>
        
        {/* Payment Method Section */}
        <div className="payment-section">
          <p className="title">Forma de Pagamento</p>
          
          <div className="payment-options">
            <div className="payment-option">
              <input 
                type="radio" 
                id="cartao" 
                name="paymentMethod" 
                value="cartao" 
                checked={paymentMethod === 'cartao'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <label htmlFor="cartao">Cartão</label>
            </div>
            
            <div className="payment-option">
              <input 
                type="radio" 
                id="especie" 
                name="paymentMethod" 
                value="especie" 
                checked={paymentMethod === 'especie'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <label htmlFor="especie">Dinheiro (Espécie)</label>
            </div>
            
            <div className="payment-option">
              <input 
                type="radio" 
                id="pix" 
                name="paymentMethod" 
                value="pix" 
                checked={paymentMethod === 'pix'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <label htmlFor="pix">PIX</label>
            </div>
          </div>
          
          {/* Card Type Selection */}
          {paymentMethod === 'cartao' && (
            <div className="card-type-section">
              <p className="subtitle">Tipo de Cartão:</p>
              <div className="card-type-options">
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="credito" 
                    name="cardType" 
                    value="credito" 
                    checked={cardType === 'credito'}
                    onChange={(e) => setCardType(e.target.value)}
                  />
                  <label htmlFor="credito">Crédito</label>
                </div>
                
                <div className="payment-option">
                  <input 
                    type="radio" 
                    id="debito" 
                    name="cardType" 
                    value="debito" 
                    checked={cardType === 'debito'}
                    onChange={(e) => setCardType(e.target.value)}
                  />
                  <label htmlFor="debito">Débito</label>
                </div>
              </div>
            </div>
          )}
          
          {/* PIX Key Section */}
          {paymentMethod === 'pix' && (
            <div className="pix-section">
              <p className="subtitle">Chave PIX:</p>
              <div className="pix-key-container">
                <input 
                  type="text" 
                  value={pixKey} 
                  readOnly 
                  className="pix-key-input"
                  placeholder="Carregando chave PIX..."
                />
                <button 
                  type="button" 
                  onClick={copyPixKey}
                  className={`copy-pix-btn ${copySuccess ? 'copied' : ''}`}
                  disabled={!pixKey || pixKey === 'Chave PIX não configurada'}
                >
                  {copySuccess ? '✓ Copiado!' : 'Copiar'}
                </button>
              </div>
              {pixKey === 'Chave PIX não configurada' && (
                <p className="pix-error">Chave PIX não foi configurada pelo administrador.</p>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="place-order-right">
        {/* Cart Items Section */}
        <div className="cart-items-section">
          <h2>Seus Itens</h2>
          <div className="cart-items-list">
            {Object.keys(cartItems).map((cartKey) => {
              const cartItem = cartItems[cartKey];
              if (cartItem && cartItem.quantity > 0) {
                const item = food_list.find(product => product._id === cartItem.itemId);
                if (item) {
                  let itemPrice = item.price;
                  if (cartItem.extras && cartItem.extras.length > 0) {
                    cartItem.extras.forEach(extra => {
                      itemPrice += extra.price;
                    });
                  }
                  return (
                    <div key={cartKey} className="cart-item-summary">
                      <div className="item-image">
                        <img src={url + '/images/' + item.image} alt={item.name} />
                      </div>
                      <div className="item-details">
                        <h4>{item.name}</h4>
                        {cartItem.extras && cartItem.extras.length > 0 && (
                          <div className="item-extras">
                            <strong>Extras:</strong> {cartItem.extras.map((extra, idx) => (
                              <span key={`${cartKey}-extra-${idx}`}>
                                + {extra.name} (R$ {extra.price.toFixed(2)})
                                {idx < cartItem.extras.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        )}
                        {cartItem.observations && (
                          <div className="item-observations">
                            <strong>Obs:</strong> {cartItem.observations}
                          </div>
                        )}
                        {cartItem.includeDisposables && (
                          <div className="item-disposables">
                            ✓ Inclui descartáveis
                          </div>
                        )}
                        <div className="item-quantity-price">
                          <span className="quantity">Qtd: {cartItem.quantity}</span>
                          <span className="price">R$ {(itemPrice * cartItem.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })}
          </div>
        </div>

        {/* Coupon Section */}
        <div className="coupon-section">
          <h3>Cupom de Desconto</h3>
          {!appliedCoupon ? (
            <div className="coupon-input-container">
              <div className="coupon-input-group">
                <input
                  type="text"
                  value={couponCode}
                  onChange={handleCouponInputChange}
                  placeholder="Digite o código do cupom"
                  className="coupon-input"
                  maxLength={20}
                />
                <button
                  type="button"
                  onClick={validateCoupon}
                  disabled={couponLoading || !couponCode.trim()}
                  className="coupon-apply-btn"
                >
                  {couponLoading ? 'Validando...' : 'Aplicar'}
                </button>
              </div>
              {couponError && (
                <div className="coupon-error">
                  ⚠️ {couponError}
                </div>
              )}
            </div>
          ) : (
            <div className="coupon-applied">
              <div className="coupon-success">
                <div className="coupon-info">
                  <span className="coupon-code-applied">✅ {appliedCoupon.code}</span>
                  <span className="coupon-name">{appliedCoupon.name}</span>
                </div>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="coupon-remove-btn"
                  title="Remover cupom"
                >
                  ✕
                </button>
              </div>
              <div className="coupon-discount-info">
                💰 Desconto: R$ {couponDiscount.toFixed(2)}
              </div>
            </div>
          )}
        </div>

      <div className="cart-total">
          <h2>Total do Carrinho</h2>
          <div>
          <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>R$ {getTotalCartAmount().toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>{deliveryType === 'delivery' ? 'Taxa de Entrega' : 'Taxa de Serviço'}</p>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <p>R$ {getTotalCartAmount() === 0 ? '0.00' : (deliveryType === 'delivery' ? shippingFee : 0).toFixed(2)}</p>
                {deliveryType === 'delivery' && shippingLoading && (
                  <span style={{fontSize: '12px', color: '#666'}}>Calculando...</span>
                )}
              </div>
            </div>
            {deliveryType === 'delivery' && shippingData && (
              <div className="delivery-info" style={{fontSize: '12px', color: '#666', margin: '8px 0'}}>
                <p>📍 Distância: {shippingData.distance?.text || `${shippingData.distanceKm} km`}</p>
                <p>⏱️ Tempo estimado: {shippingData.duration?.text || `${shippingData.durationMinutes} min`}</p>
                {shippingData.calculatedBy === 'google_maps' && (
                  <p>🗺️ Calculado via Google Maps</p>
                )}
              </div>
            )}
            {deliveryType === 'delivery' && shippingError && (
              <div className="delivery-error" style={{fontSize: '12px', color: '#ff6b35', margin: '8px 0'}}>
                <p>⚠️ {shippingError}</p>
              </div>
            )}
            {appliedCoupon && (
              <>
                <hr />
                <div className="cart-total-detail coupon-discount">
                  <p>Desconto ({appliedCoupon.code})</p>
                  <p style={{color: '#28a745'}}>- R$ {couponDiscount.toFixed(2)}</p>
                </div>
              </>
            )}
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>R$ {getTotalCartAmount() === 0 ? '0.00' : (getTotalCartAmount() + (deliveryType === 'delivery' ? deliveryData.fee : 0) - couponDiscount).toFixed(2)}</b>
            </div> 
          </div>
          <button type='submit'>PROSSEGUIR PARA PAGAMENTO</button>
        </div>
      </div>
    </form>
    </>  
  )
}

PlaceOrder.propTypes = {
  setShowLogin: PropTypes.func.isRequired
};

export default PlaceOrder