import React, { useContext, useState, useEffect } from 'react'
import './Cart.css'
import { StoreContext } from '../../components/context/StoreContext'
import { useNavigate } from 'react-router-dom';
import useDeliveryCalculation from '../../hooks/useDeliveryCalculation';
import SEO from '../../components/SEO/SEO';

const Cart = () => {

  const {food_list, cartItems, removeFromCart, getTotalCartAmount, url, token, currentStore, fetchFoodList} = useContext(StoreContext);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Garantir que temos a lista completa de produtos para renderizar o carrinho
  useEffect(() => {
    const loadProductsIfNeeded = async () => {
      // Se não temos produtos ou temos poucos produtos, carregar a lista completa
      if (!food_list || food_list.length === 0) {
        setIsLoadingProducts(true);
        try {
          await fetchFoodList();
        } catch (error) {
          console.error('Erro ao carregar produtos para o carrinho:', error);
        } finally {
          setIsLoadingProducts(false);
        }
      }
    };
    
    loadProductsIfNeeded();
  }, [food_list, fetchFoodList]);
 
  const [deliveryType, setDeliveryType] = useState('delivery'); // 'delivery' or 'pickup'
  const [deliveryAddress, setDeliveryAddress] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: ''
  });

  const navigate = useNavigate();
  const { 
    deliveryData,
    calculateDeliveryFee, 
    resetDeliveryData 
  } = useDeliveryCalculation(url);

  const deliveryFee = deliveryData?.fee || 0;
  const distance = deliveryData?.distance;
  const duration = deliveryData?.duration;
  const loading = deliveryData?.isCalculating || false;
  const error = deliveryData?.error;
  const warning = deliveryData?.warning;

  // Calculate delivery fee when address changes
  useEffect(() => {
    if (deliveryType === 'delivery' && deliveryAddress.street && deliveryAddress.city && deliveryAddress.state && deliveryAddress.zipCode) {
      calculateDeliveryFee(deliveryAddress);
    }
  }, [deliveryAddress, deliveryType, calculateDeliveryFee]);



  const handleAddressChange = (field, value) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProceedToCheckout = () => {
    if (!token) {
      alert('Por favor, faça login para continuar com o pedido.');
      return;
    }
    if (getTotalCartAmount() === 0) {
      alert('Seu carrinho está vazio. Adicione itens antes de finalizar o pedido.');
      return;
    }
    if (deliveryType === 'delivery' && (!deliveryAddress.street || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.zipCode)) {
      alert('Por favor, preencha o endereço de entrega completo.');
      return;
    }
    navigate('/order');
  };

  const handleContinueShopping = () => {
    if (currentStore && currentStore.slug) {
      navigate(`/loja/${currentStore.slug}`); // Navega para a página inicial da loja
    } else {
      navigate(-1); // Fallback: volta para a página anterior
    }
  };


  return (
    <div className='cart'>

      <SEO 
        title="Carrinho - Food Delivery"
        description="Revise seus itens no carrinho e finalize seu pedido com entrega rápida."
        keywords="carrinho, pedido, checkout, food delivery"
      />
      <div className="cart-items">
        <div className="cart-items-title">
          <p>Itens</p>
          <p>Título</p>
          <p>Preço</p>
          <p>Quantidade</p>
          <p>Total</p>
          <p>Remover</p>
        </div>
        <br />
        <hr />
        {Object.keys(cartItems).map((cartKey, index) => {
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
                <div key={cartKey}>
                  <div className="cart-items-title cart-items-item">
                    <img src={url + '/images/' + item.image} alt="" />
                    <div>
                      <p>{item.name}</p>
                      {cartItem.extras && cartItem.extras.length > 0 && (
                        <div style={{fontSize: '12px', color: '#666', marginTop: '4px'}}>
                          <strong>Extras:</strong> {cartItem.extras.map((extra, idx) => (
                            <span key={`${cartKey}-extra-${idx}`}>+ {extra.name} (R$ {extra.price}){idx < cartItem.extras.length - 1 ? ', ' : ''}</span>
                          ))}
                        </div>
                      )}
                      {cartItem.observations && (
                        <div style={{fontSize: '12px', color: '#ff6b35', marginTop: '4px', fontStyle: 'italic'}}>
                          <strong>Obs:</strong> {cartItem.observations}
                        </div>
                      )}
                      {cartItem.includeDisposables && (
                        <div style={{fontSize: '12px', color: '#28a745', marginTop: '4px', fontWeight: 'bold'}}>
                          ✓ Inclui descartáveis
                        </div>
                      )}
                    </div>
                    <p>R$ {itemPrice}</p>
                    <p>{cartItem.quantity}</p>
                    <p>R$ {itemPrice * cartItem.quantity}</p>
                    <p onClick={() => removeFromCart(cartKey)} className='cross'>x</p>
                  </div>
                  <hr />
                </div>
              );
            }
          }
          return null;
        })}
      </div>
      <div className="cart-bottom">
        <div className="cart-total">
          <h2>Total do Carrinho</h2>
          
          {/* Delivery Type Selection */}
          <div className="delivery-type-section">
            <h3>Tipo de Pedido:</h3>
            <div className="delivery-options">
              <label className={`delivery-option ${deliveryType === 'delivery' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="deliveryType" 
                  value="delivery" 
                  checked={deliveryType === 'delivery'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                />
                <span className="delivery-icon">🚚</span>
                <span>Entrega</span>
              </label>
              <label className={`delivery-option ${deliveryType === 'pickup' ? 'active' : ''}`}>
                <input 
                  type="radio" 
                  name="deliveryType" 
                  value="pickup" 
                  checked={deliveryType === 'pickup'}
                  onChange={(e) => setDeliveryType(e.target.value)}
                />
                <span className="delivery-icon">🏪</span>
                <span>Retirar no Local</span>
              </label>
            </div>
          </div>

          {/* Delivery Address Section */}
          {deliveryType === 'delivery' && (
            <div className="delivery-address-section" style={{marginBottom: '20px', padding: '15px', border: '1px solid #e2e2e2', borderRadius: '8px', backgroundColor: '#f9f9f9'}}>
              <h3 style={{margin: '0 0 15px 0', color: '#333', fontSize: '1.1rem'}}>Endereço de Entrega:</h3>
              <div style={{display: 'grid', gap: '10px'}}>
                <input
                  type="text"
                  placeholder="Rua e número"
                  value={deliveryAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  style={{padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outline: 'none'}}
                />
                <div style={{display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px'}}>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={deliveryAddress.city}
                    onChange={(e) => handleAddressChange('city', e.target.value)}
                    style={{padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outline: 'none'}}
                  />
                  <input
                    type="text"
                    placeholder="Estado"
                    value={deliveryAddress.state}
                    onChange={(e) => handleAddressChange('state', e.target.value)}
                    style={{padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outline: 'none'}}
                  />
                  <input
                    type="text"
                    placeholder="CEP"
                    value={deliveryAddress.zipCode}
                    onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                    style={{padding: '10px', border: '1px solid #c5c5c5', borderRadius: '4px', outline: 'none'}}
                  />
                </div>
              </div>
            </div>
          )}
          
          <div>
            <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>R$ {getTotalCartAmount().toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>{deliveryType === 'delivery' ? 'Taxa de Entrega' : 'Taxa de Serviço'}</p>
              <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <p>R$ {getTotalCartAmount()===0?0:(deliveryType === 'delivery' ? deliveryFee : 0).toFixed(2)}</p>
                {deliveryType === 'delivery' && loading && (
                  <span style={{fontSize: '12px', color: '#666'}}>Calculando...</span>
                )}
              </div>
            </div>
            {deliveryType === 'delivery' && distance && (
              <div className="delivery-info" style={{fontSize: '12px', color: '#666', margin: '8px 0'}}>
                <p>📍 Distância: {distance.text}</p>
                <p>⏱️ Tempo estimado: {duration.text}</p>
              </div>
            )}
            {deliveryType === 'delivery' && error && (
              <div className="delivery-error" style={{fontSize: '12px', color: '#ff6b35', margin: '8px 0'}}>
                <p>⚠️ {error}</p>
              </div>
            )}
            {deliveryType === 'delivery' && warning && (
              <div className="delivery-warning" style={{fontSize: '12px', color: '#ff9500', margin: '8px 0'}}>
                <p>⚠️ {warning}</p>
              </div>
            )}
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>R$ {getTotalCartAmount()===0?0:(getTotalCartAmount()+(deliveryType === 'delivery' ? deliveryFee : 0)).toFixed(2)}</b>
            </div> 
          </div>
          <div className="cart-buttons">
            <button className="continue-shopping-btn" onClick={handleContinueShopping}>
              <span className="btn-icon">🛒</span>
              CONTINUAR COMPRANDO
            </button>
            <button className="checkout-btn" onClick={handleProceedToCheckout}>
              <span className="btn-icon">✓</span>
              FINALIZAR PEDIDO
            </button>
          </div>
        </div>
        <div className="cart-promocode">
          <div>
            <p>Se você tem um código promocional, digite aqui</p>
            <div className='cart-promocode-input'>
              <input type="text" placeholder='Código Promocional'/>
              <button>Aplicar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cart