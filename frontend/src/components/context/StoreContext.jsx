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
    const [currentStore, setCurrentStore] = useState(null); // Loja atual selecionada
    const [storeMenu, setStoreMenu] = useState({ categories: [], foods: [] }); // Menu da loja atual
    const [allStores, setAllStores] = useState([]); // Lista de todas as lojas disponíveis

    /**
     * Função para adicionar item ao carrinho
     * @param {String} itemId - ID do item
     * @param {Array} extras - Lista de extras selecionados
     * @param {String} observations - Observações do cliente
     * @param {Boolean} includeDisposables - Se deve incluir descartáveis
     */
    const addToCart = async (itemId, extras = [], observations = '', includeDisposables = false) => {
        // Cria uma chave única para o item com seus extras
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${btoa(extrasKey)}` : itemId;
        
        if (!cartItems[cartKey]) {
            setCartItems((prev) => ({ 
                ...prev, 
                [cartKey]: { 
                    quantity: 1, 
                    itemId: itemId, 
                    extras: extras,
                    observations: observations,
                    includeDisposables: includeDisposables
                } 
            }))
        } else {
            setCartItems((prev) => ({ 
                ...prev, 
                [cartKey]: { 
                    ...prev[cartKey], 
                    quantity: prev[cartKey].quantity + 1,
                    observations: observations || prev[cartKey].observations,
                    includeDisposables: includeDisposables !== undefined ? includeDisposables : prev[cartKey].includeDisposables
                } 
            }))
        }
        if(token){
            await axios.post(url+'/api/cart/add',{itemId, extras, observations, includeDisposables},{headers:{token}})
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

    // Função para carregar dados de uma loja específica
    const loadStoreData = async (storeSlug) => {
        try {
            const [storeResponse, menuResponse] = await Promise.all([
                axios.get(`${url}/api/store/public/${storeSlug}`),
                axios.get(`${url}/api/store/public/${storeSlug}/menu`)
            ]);
            
            if (storeResponse.data.success) {
                setCurrentStore(storeResponse.data.store);
            }
            
            if (menuResponse.data.success) {
                setStoreMenu({
                    categories: menuResponse.data.categories || [],
                    foods: menuResponse.data.foods || []
                });
                setFoodList(menuResponse.data.foods || []);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao carregar dados da loja:', error);
            return { success: false, error };
        }
    }

    // Função para carregar lista de todas as lojas
    const loadAllStores = async () => {
        try {
            const response = await axios.get(`${url}/api/system/stores/public`);
            if (response.data.success) {
                setAllStores(response.data.stores);
            }
            return response.data.stores || [];
        } catch (error) {
            console.error('Erro ao carregar lojas:', error);
            return [];
        }
    }

    // Função para limpar dados da loja atual
    const clearStoreData = () => {
        setCurrentStore(null);
        setStoreMenu({ categories: [], foods: [] });
        setFoodList([]);
        setCartItems({}); // Limpar carrinho ao trocar de loja
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
        setToken,
        currentStore,
        setCurrentStore,
        storeMenu,
        setStoreMenu,
        allStores,
        setAllStores,
        loadStoreData,
        loadAllStores,
        clearStoreData
    }

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
