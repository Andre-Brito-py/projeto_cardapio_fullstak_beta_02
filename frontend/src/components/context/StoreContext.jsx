// Importações necessárias
import { createContext, useEffect, useState } from "react";
import axios from 'axios';

// Criação do contexto da loja
export const StoreContext = createContext(null);

/**
 * Provider do contexto da loja - gerencia estado global da aplicação
 * @param {Object} props - Propriedades do componente
 */
const StoreContextProvider = (props) => {
    // Estados do contexto
    const [cartItems, setCartItems] = useState({}); // Itens do carrinho
    const url = "http://localhost:4000"; // URL da API
    const [token, setToken] = useState(""); // Token de autenticação
    const [food_list, setFoodList] = useState([]); // Lista de comidas disponíveis

    /**
     * Função para adicionar item ao carrinho
     * @param {String} itemId - ID do item
     * @param {Array} extras - Lista de extras selecionados
     */
    const addToCart = async (itemId, extras = []) => {
        // Cria uma chave única para o item com seus extras
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${btoa(extrasKey)}` : itemId;
        
        if (!cartItems[cartKey]) {
            setCartItems((prev) => ({ 
                ...prev, 
                [cartKey]: { 
                    quantity: 1, 
                    itemId: itemId, 
                    extras: extras 
                } 
            }))
        } else {
            setCartItems((prev) => ({ 
                ...prev, 
                [cartKey]: { 
                    ...prev[cartKey], 
                    quantity: prev[cartKey].quantity + 1 
                } 
            }))
        }
        if(token){
            await axios.post(url+'/api/cart/add',{itemId, extras},{headers:{token}})
        }
    }

    const removeFromCart = async (cartKey) => {
        setCartItems((prev) => {
            const newCart = { ...prev };
            if (newCart[cartKey] && newCart[cartKey].quantity > 1) {
                newCart[cartKey] = {
                    ...newCart[cartKey],
                    quantity: newCart[cartKey].quantity - 1
                };
            } else {
                delete newCart[cartKey];
            }
            return newCart;
        });
        if(token){
            const itemData = cartItems[cartKey];
            if (itemData) {
                await axios.post(url+'/api/cart/remove',{itemId: itemData.itemId, extras: itemData.extras},{headers:{token}})
            }
        }
    }

    const getTotalCartAmount = () => {
        let totalAmount = 0;
        for (const cartKey in cartItems) {
            const cartItem = cartItems[cartKey];
            if (cartItem && cartItem.quantity > 0) {
                let itemInfo = food_list.find((product) => product._id === cartItem.itemId);
                if (itemInfo) {
                    let itemPrice = itemInfo.price;
                    // Add extras price
                    if (cartItem.extras && cartItem.extras.length > 0) {
                        cartItem.extras.forEach(extra => {
                            itemPrice += extra.price;
                        });
                    }
                    totalAmount += itemPrice * cartItem.quantity;
                }
            }
        }
        return totalAmount;
    }

    const fetchFoodList = async () =>{
        const response = await axios.get(url+"/api/food/list");
        setFoodList(response.data.data)
    }

    const loadCartData = async (token) =>{
        const response = await axios.post(url+"/api/cart/get",{},{headers:{token}})
        setCartItems(response.data.cartData);
    }

    useEffect(()=>{
        
        async function loadData(){
            await fetchFoodList();
            if(localStorage.getItem("token")){
                setToken(localStorage.getItem("token"));
                await loadCartData(localStorage.getItem("token"))
            }
        }
        loadData();
    },[])

    const contextValue = {
        food_list,
        cartItems,
        setCartItems,
        addToCart,
        removeFromCart,
        getTotalCartAmount,
        url,
        token,
        setToken
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
