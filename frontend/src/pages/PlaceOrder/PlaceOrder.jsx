import React, { useContext, useEffect, useState } from 'react'
import './PlaceOrder.css'
import { StoreContext } from '../../components/context/StoreContext'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import SEO from '../../components/SEO/SEO';
import useDeliveryCalculation from '../../hooks/useDeliveryCalculation';

const PlaceOrder = () => {
  const {getTotalCartAmount, token, food_list, cartItems, url} = useContext(StoreContext);
  const { deliveryData, calculateDeliveryFee } = useDeliveryCalculation(url);

  const [data, setData] = useState({
    firstName:"",
    lastName:"",
    email:"",
    street:"",
    city:"",
    state:"",
    zipcode:"",
    country:"",
    phone:""
  });

  const [paymentMethod, setPaymentMethod] = useState('cartao');
  const [cardType, setCardType] = useState('credito');
  const [pixKey, setPixKey] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);
  const [deliveryType, setDeliveryType] = useState('delivery');

  const onChangeHandler = (event) =>{
    const name = event.target.name;
    const value = event.target.value;
    setData(data =>({...data,[name]:value}))
  }

  const fetchPixKey = async () => {
    try {
      const response = await axios.get(`${url}/api/settings/pix-key`);
      if (response.data.success) {
        setPixKey(response.data.pixKey || 'Chave PIX não configurada');
      }
    } catch (error) {
      console.error('Erro ao buscar chave PIX:', error);
      setPixKey('Erro ao carregar chave PIX');
    }
  };

  const copyPixKey = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar chave PIX:', error);
    }
  };

  const placeOrder = async (event) =>{
    event.preventDefault();
    let orderItems = [];
    food_list.map((item, index)=>{
      if(cartItems[item._id]>0){
        let itemInfo = item;
        itemInfo["quantity"] = cartItems[item._id];
        orderItems.push(itemInfo);
      }
    })
    const deliveryFee = deliveryType === 'delivery' ? deliveryData.fee : 0;
    let orderData = {
      address:data,
      items:orderItems,
      amount:getTotalCartAmount()+deliveryFee,
      deliveryType: deliveryType,
      deliveryFee: deliveryFee
    }

    let response = await axios.post(url+'/api/order/place', orderData,{headers:{token}})
    if(response.data.success){
      const {session_url} = response.data;
      window.location.replace(session_url);
    }
    else{
      alert('Error')
    }
  }

  const navigate = useNavigate();

  useEffect(()=>{
    if(!token){
      navigate('/cart')
    }else if(getTotalCartAmount()===0){
      navigate('/cart')
    }
  },[token])

  useEffect(() => {
    if (paymentMethod === 'pix') {
      fetchPixKey();
    }
  }, [paymentMethod]);

  // Calcular taxa de entrega quando endereço mudar
  useEffect(() => {
    if (deliveryType === 'delivery' && data.street && data.city && data.state) {
      const address = {
        street: data.street,
        city: data.city,
        state: data.state,
        zipCode: data.zipcode,
        country: data.country || 'Brasil'
      };
      calculateDeliveryFee(address);
    }
  }, [data.street, data.city, data.state, data.zipcode, data.country, deliveryType, calculateDeliveryFee]);

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
        <div className="multi-fields">
          <input required name='firstName' onChange={onChangeHandler} value={data.firstName} type="text" placeholder='Nome'/>
          <input required name='lastName' onChange={onChangeHandler} value={data.lastName} type="text" placeholder='Sobrenome'/>
        </div>
        <input required name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Endereço de email'/>
        <input required name='street' onChange={onChangeHandler} value={data.street} type="text" placeholder='Rua'/>
        <div className="multi-fields">
          <input required name='city' onChange={onChangeHandler} value={data.city}  type="text" placeholder='Cidade'/>
          <input required name='state' onChange={onChangeHandler} value={data.state} type="text" placeholder='Estado'/>
        </div>
        <div className="multi-fields">
          <input required name='zipcode' onChange={onChangeHandler} value={data.zipcode} type="text" placeholder='CEP'/>
          <input required name='country' onChange={onChangeHandler} value={data.country} type="text" placeholder='País'/>
        </div>
        <input required name='phone' onChange={onChangeHandler} value={data.phone} type="text" placeholder='Telefone' />
        
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
                <p>R$ {getTotalCartAmount()===0?0:(deliveryType === 'delivery' ? deliveryData.fee : 0).toFixed(2)}</p>
                {deliveryType === 'delivery' && deliveryData.isCalculating && (
                  <span style={{fontSize: '12px', color: '#666'}}>Calculando...</span>
                )}
              </div>
            </div>
            {deliveryType === 'delivery' && deliveryData.distance && (
              <div className="delivery-info" style={{fontSize: '12px', color: '#666', margin: '8px 0'}}>
                <p>📍 Distância: {deliveryData.distance.text}</p>
                <p>⏱️ Tempo estimado: {deliveryData.duration.text}</p>
              </div>
            )}
            {deliveryType === 'delivery' && deliveryData.error && (
              <div className="delivery-error" style={{fontSize: '12px', color: '#ff6b35', margin: '8px 0'}}>
                <p>⚠️ {deliveryData.error}</p>
              </div>
            )}
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>R$ {getTotalCartAmount()===0?0:(getTotalCartAmount()+(deliveryType === 'delivery' ? deliveryData.fee : 0)).toFixed(2)}</b>
            </div> 
          </div>
          <button type='submit'>PROSSEGUIR PARA PAGAMENTO</button>
        </div>
      </div>
    </form>
    </>  
  )
}

export default PlaceOrder