/* eslint-disable react/jsx-key */
import React, { useContext } from 'react'
import './Cart.css'
import { StoreContext } from '../../components/context/StoreContext'
import { useNavigate } from 'react-router-dom';

const Cart = () => {

  const {cartItems, food_list, removeFromCart, getTotalCartAmount, url, token} = useContext(StoreContext);

  const navigate = useNavigate();

  const handleProceedToCheckout = () => {
    if (!token) {
      alert('Por favor, faça login para continuar com o pedido.');
      return;
    }
    if (getTotalCartAmount() === 0) {
      alert('Seu carrinho está vazio. Adicione itens antes de finalizar o pedido.');
      return;
    }
    navigate('/order');
  };
  return (
    <div className='cart'>
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
                            <span key={idx}>+ {extra.name} (R$ {extra.price}){idx < cartItem.extras.length - 1 ? ', ' : ''}</span>
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
          <div>
            <div className="cart-total-detail">
              <p>Subtotal</p>
              <p>R$ {getTotalCartAmount().toFixed(2)}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <p>Taxa de Entrega</p>
              <p>R$ {getTotalCartAmount()===0?0:2}</p>
            </div>
            <hr />
            <div className="cart-total-detail">
              <b>Total</b>
              <b>R$ {getTotalCartAmount()===0?0:(getTotalCartAmount()+2).toFixed(2)}</b>
            </div> 
          </div>
          <button onClick={handleProceedToCheckout}>FINALIZAR PEDIDO</button>
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