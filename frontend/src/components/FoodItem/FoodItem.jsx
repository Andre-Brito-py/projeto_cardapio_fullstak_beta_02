import { useContext, useCallback, memo } from 'react'
import PropTypes from 'prop-types'
import './FoodItem.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../context/StoreContext'
import { useNavigate } from 'react-router-dom';

const FoodItem = memo(({id,name,price,description,image,extras = []}) => {

    const {cartItems,removeFromCart,url} = useContext(StoreContext);
    const navigate = useNavigate();

    
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
    

    
    const handleAddToCart = useCallback((e) => {
        e?.stopPropagation();
        // Navegar diretamente para a página de detalhes do produto
        navigate(`/product/${id}`);
    }, [navigate, id]);
    
    const handleProductClick = useCallback(() => {
        navigate(`/product/${id}`);
    }, [navigate, id]);

  return (
    <div className='food-item'>
        <div className="food-item-img-container" onClick={handleProductClick} style={{cursor: 'pointer'}}>
            <img 
                className='food-item-image' 
                src={url+'/images/'+image} 
                alt={name}
                loading="lazy"
                onError={(e) => {
                    e.target.src = assets.default_food_image || '/placeholder-food.jpg';
                }}
            />
            {
                getItemQuantityInCart() === 0 ? <img 
                    className='add' 
                    onClick={handleAddToCart} 
                    src={assets.add_icon_white}
                    alt="Add to cart"
                />: 
                <div className="food-item-counter">
                    <img 
                        onClick={()=>removeFromCart(getSimpleCartKey())} 
                        src={assets.remove_icon_red} 
                        alt="Remove item"
                        className="counter-btn"
                    />
                    <p>{getItemQuantityInCart()}</p>
                    <img 
                        onClick={handleAddToCart}  
                        src={assets.add_icon_green} 
                        alt="Add item"
                        className="counter-btn"
                    />
                </div>
            }
        </div>
        <div className="food-item-info">
            <div className="food-item-name-rating" onClick={handleProductClick} style={{cursor: 'pointer'}}>
                <p>{name}</p>
            </div>
            <p className="food-item-desc">{description}</p>
            <p className='food-item-price'>R$ {price}</p>
            {extras && extras.length > 0 && (
                <p className='food-item-extras-available'>✨ Adicionais disponíveis ({extras.length})</p>
            )}

        </div>
        

        


    </div>
  )
})

FoodItem.displayName = 'FoodItem';

FoodItem.propTypes = {
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    description: PropTypes.string.isRequired,
    image: PropTypes.string.isRequired,
    extras: PropTypes.arrayOf(
        PropTypes.shape({
            name: PropTypes.string.isRequired,
            price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
            description: PropTypes.string
        })
    )
};



export default FoodItem