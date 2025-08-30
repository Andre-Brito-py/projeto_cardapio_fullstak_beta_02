import React, { memo } from 'react';
import PropTypes from 'prop-types';
import './WaiterFoodItem.css';
import { assets } from '../../assets/assets';

const WaiterFoodItem = memo(({ id, name, price, description, image, addToCart, removeFromCart, cartItems }) => {
  const itemCount = cartItems[id] || 0;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

  const handleAddClick = (e) => {
    e.stopPropagation();
    addToCart(id);
  };

  const handleRemoveClick = (e) => {
    e.stopPropagation();
    removeFromCart(id);
  };

  return (
    <div className='waiter-food-item'>
      <div className="waiter-food-item-img-container">
        <img 
          className='waiter-food-item-image' 
          src={`${backendUrl}/images/${image}`}
          alt={name}
          loading="lazy"
          onError={(e) => {
            e.target.src = assets.default_food_image || '/placeholder-food.jpg';
          }}
        />
        {
          itemCount === 0 ? 
          <img 
            className='waiter-add-btn' 
            onClick={handleAddClick} 
            src={assets.add_icon_white}
            alt="Adicionar ao carrinho"
          /> : 
          <div className="waiter-food-item-counter">
            <img 
              onClick={handleRemoveClick} 
              src={assets.remove_icon_red} 
              alt="Remover item"
              className="waiter-counter-btn"
            />
            <p>{itemCount}</p>
            <img 
              onClick={handleAddClick}  
              src={assets.add_icon_green} 
              alt="Adicionar item"
              className="waiter-counter-btn"
            />
          </div>
        }
      </div>
      <div className="waiter-food-item-info">
        <div className="waiter-food-item-name-rating">
          <p>{name}</p>
        </div>
        <p className="waiter-food-item-desc">{description}</p>
        <p className='waiter-food-item-price'>R$ {typeof price === 'number' ? price.toFixed(2) : price}</p>
      </div>
    </div>
  );
});

WaiterFoodItem.displayName = 'WaiterFoodItem';

WaiterFoodItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  description: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  addToCart: PropTypes.func.isRequired,
  removeFromCart: PropTypes.func.isRequired,
  cartItems: PropTypes.object.isRequired
};

export default WaiterFoodItem;