import React, { useContext, useState} from 'react'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../context/StoreContext';
import { useNavigate } from 'react-router-dom';

const FoodItem = ({id,name,price,description,image,extras}) => {

    const {cartItems,addToCart,removeFromCart,url} = useContext(StoreContext);
    const navigate = useNavigate();
    const [showExtrasModal, setShowExtrasModal] = useState(false);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [totalPrice, setTotalPrice] = useState(price);
    
    // Helper function to get total quantity of this item in cart (all variations)
    const getItemQuantityInCart = () => {
        let totalQuantity = 0;
        Object.keys(cartItems).forEach(cartKey => {
            const cartItem = cartItems[cartKey];
            if (cartItem && cartItem.itemId === id) {
                totalQuantity += cartItem.quantity;
            }
        });
        return totalQuantity;
    };
    
    // Helper function to get the simple cart key (item without extras)
    const getSimpleCartKey = () => {
        return id;
    };
    
    const handleExtraToggle = (extra) => {
        const isSelected = selectedExtras.find(e => e.name === extra.name);
        if (isSelected) {
            setSelectedExtras(prev => prev.filter(e => e.name !== extra.name));
            setTotalPrice(prev => prev - extra.price);
        } else {
            setSelectedExtras(prev => [...prev, extra]);
            setTotalPrice(prev => prev + extra.price);
        }
    };
    
    const handleAddToCart = () => {
        if (extras && extras.length > 0) {
            setShowExtrasModal(true);
        } else {
            addToCart(id);
        }
    };
    
    const confirmAddToCart = () => {
        addToCart(id, selectedExtras);
        setShowExtrasModal(false);
        setSelectedExtras([]);
        setTotalPrice(price);
    };
    
    const cancelModal = () => {
        setShowExtrasModal(false);
        setSelectedExtras([]);
        setTotalPrice(price);
    };
    
    const handleProductClick = () => {
        navigate(`/product/${id}`);
    };

  return (
    <div className='food-item'>
        <div className="food-item-img-container" onClick={handleProductClick} style={{cursor: 'pointer'}}>
            <img className='food-item-image' src={url+'/images/'+image} alt="" />
            {
                getItemQuantityInCart() === 0 ? <img className='add' onClick={handleAddToCart} src={assets.add_icon_white}/>: 
                <div className="food-item-counter">
                    <img onClick={()=>removeFromCart(getSimpleCartKey())} src={assets.remove_icon_red} alt="" />
                    <p>{getItemQuantityInCart()}</p>
                    <img onClick={handleAddToCart}  src={assets.add_icon_green} alt="" />
                </div>
            }
        </div>
        <div className="food-item-info">
            <div className="food-item-name-rating" onClick={handleProductClick} style={{cursor: 'pointer'}}>
                <p>{name}</p>
                <img src={assets.rating_starts} alt="" />
            </div>
            <p className="food-item-desc">{description}</p>
            <p className='food-item-price'>${price}</p>
            {extras && extras.length > 0 && (
                <p className='food-item-extras-available'>✨ Adicionais disponíveis ({extras.length})</p>
            )}
        </div>
        
        {/* Extras Modal */}
        {showExtrasModal && (
            <div className="extras-modal-overlay">
                <div className="extras-modal">
                    <div className="extras-modal-header">
                        <h3>Customize your {name}</h3>
                        <button className="close-modal" onClick={cancelModal}>×</button>
                    </div>
                    
                    <div className="extras-modal-body">
                        <div className="base-item">
                            <span>{name}</span>
                            <span>₹{price}</span>
                        </div>
                        
                        {extras && extras.length > 0 && (
                            <div className="extras-section">
                                <h4>Add Extras:</h4>
                                {extras.map((extra, index) => (
                                    <div key={index} className="extra-option">
                                        <label>
                                            <input 
                                                type="checkbox" 
                                                checked={selectedExtras.find(e => e.name === extra.name) ? true : false}
                                                onChange={() => handleExtraToggle(extra)}
                                            />
                                            <span className="extra-name">{extra.name}</span>
                                            {extra.description && <span className="extra-desc"> - {extra.description}</span>}
                                            <span className="extra-price">+₹{extra.price}</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        <div className="modal-total">
                            <strong>Total: ₹{totalPrice}</strong>
                        </div>
                    </div>
                    
                    <div className="extras-modal-footer">
                        <button className="cancel-btn" onClick={cancelModal}>Cancelar</button>
                        <button className="confirm-btn" onClick={confirmAddToCart}>Adicionar ao Carrinho</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  )
}

export default FoodItem