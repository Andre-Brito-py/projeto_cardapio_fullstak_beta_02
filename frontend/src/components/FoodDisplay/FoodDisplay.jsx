import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import './FoodDisplay.css'
import { StoreContext } from '../context/StoreContext'
import FoodItem from '../FoodItem/FoodItem'

const FoodDisplay = ({category, foods}) => {

    const {food_list} = useContext(StoreContext)
    // Use foods prop if provided, otherwise fallback to food_list from context
    const displayFoods = foods || food_list;
    
  return (
    <div className='food-display' id='food-display'>
        <h2>Pratos principais perto de você</h2>
        <div className="food-display-list">
            {displayFoods.map((item, index) => {
              if(category==='Todos' || category==='All' || category===item.category){
                return <FoodItem key={index} id={item._id} name={item.name} description={item.description} price={item.price} image={item.image} extras={item.extras || []}/>
              }
              return null;
                            })}
        </div>
        {displayFoods.length === 0 && (
            <div className="food-display-empty">
                <p>Nenhum produto encontrado para esta categoria.</p>
            </div>
        )}
    </div>
  )
}

FoodDisplay.propTypes = {
    category: PropTypes.string.isRequired,
    foods: PropTypes.array
};

export default FoodDisplay