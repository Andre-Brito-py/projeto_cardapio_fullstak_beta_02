// Importações necessárias
import { createContext, useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from 'prop-types';
import axios from 'axios';

// Criação do contexto da loja
const StoreContext = createContext(null);

/**
 * Provider do contexto da loja - gerencia estado global da aplicação
 * @param {Object} props - Propriedades do componente
 */
const StoreContextProvider = (props) => {
    // Função para inicializar carrinho do localStorage
    const getInitialCart = () => {
        try {
            const localCart = localStorage.getItem("cartItems");
            if (localCart && localCart !== 'null' && localCart !== 'undefined') {
                return JSON.parse(localCart);
            }
        } catch (error) {
            console.error('Erro ao carregar localStorage:', error);
        }
        return {};
    };
    
    // Estados do contexto
    const [cartItems, setCartItems] = useState(() => getInitialCart()); // Itens do carrinho
    const url = "http://localhost:4001"; // URL da API
    const [token, setToken] = useState(""); // Token de autenticação
    const [food_list, setFoodList] = useState([]); // Lista de comidas disponíveis
    const [currentStore, setCurrentStore] = useState(null); // Loja atual selecionada
    const [storeMenu, setStoreMenu] = useState({ categories: [], foods: [] }); // Menu da loja atual
    const [allStores, setAllStores] = useState([]); // Lista de todas as lojas disponíveis
    const [storeId, setStoreId] = useState(null); // ID da loja atual

    /**
     * Função para adicionar item ao carrinho
     * @param {String} itemId - ID do item
     * @param {Array} extras - Lista de extras selecionados
     * @param {String} observations - Observações do cliente
     * @param {Boolean} includeDisposables - Se deve incluir descartáveis
     */
    const addToCart = useCallback(async (itemId, extras = [], observations = '', includeDisposables = false) => {
        // Cria uma chave única para o item com seus extras
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${btoa(extrasKey)}` : itemId;
        
        setCartItems(prevCartItems => {
            let newCartItems;
            if (!prevCartItems[cartKey]) {
                newCartItems = { 
                    ...prevCartItems, 
                    [cartKey]: { 
                        quantity: 1, 
                        itemId: itemId, 
                        extras: extras,
                        observations: observations,
                        includeDisposables: includeDisposables
                    } 
                };
            } else {
                newCartItems = { 
                    ...prevCartItems, 
                    [cartKey]: { 
                        ...prevCartItems[cartKey], 
                        quantity: prevCartItems[cartKey].quantity + 1,
                        observations: observations || prevCartItems[cartKey].observations,
                        includeDisposables: includeDisposables !== undefined ? includeDisposables : prevCartItems[cartKey].includeDisposables
                    } 
                };
            }
            
            // Sempre salvar no localStorage para usuários não autenticados
            if (!token) {
                localStorage.setItem('cartItems', JSON.stringify(newCartItems));
            }
            
            return newCartItems;
        });
        
        // Enviar para backend se usuário estiver autenticado
        if (token) {
            try {
                await axios.post(url+'/api/cart/add',{itemId, extras, observations, includeDisposables},{headers:{token}});
            } catch (error) {
                console.error('Erro ao salvar no backend:', error);
            }
        }
    }, [token, url]);

    const removeFromCart = useCallback(async (cartKey) => {
        // Obter informações do item antes de remover para enviar ao backend
        const cartItem = cartItems[cartKey];
        const itemId = cartItem?.itemId;
        const extras = cartItem?.extras || [];
        
        setCartItems(prevCartItems => {
            const newCartItems = { ...prevCartItems };
            if (newCartItems[cartKey] && newCartItems[cartKey].quantity > 0) {
                newCartItems[cartKey].quantity -= 1;
                if (newCartItems[cartKey].quantity === 0) {
                    delete newCartItems[cartKey];
                }
            }
            
            // Sempre salvar no localStorage para usuários não autenticados
            if (!token) {
                localStorage.setItem('cartItems', JSON.stringify(newCartItems));
            }
            
            return newCartItems;
        });
        
        // Enviar para backend se usuário estiver autenticado
        if (token && itemId) {
            try {
                await axios.post(url+'/api/cart/remove',{itemId, extras},{headers:{token}});
            } catch (error) {
                console.error('Erro ao remover item do carrinho:', error);
            }
        }
    }, [token, url, cartItems]);

    const getTotalCartAmount = useCallback(() => {
        let totalAmount = 0;
        for (const cartKey in cartItems) {
            const cartItem = cartItems[cartKey];
            if (cartItem && cartItem.quantity > 0) {
                const itemInfo = food_list.find((product) => product._id === cartItem.itemId);
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
    }, [cartItems, food_list]);

    const fetchFoodList = useCallback(async () =>{
        const response = await axios.get(url+"/api/food/list");
        setFoodList(response.data.data)
    }, [url]);

    // Função para carregar dados de uma loja específica
    const loadStoreData = useCallback(async (storeSlug) => {
        try {
            const [storeResponse, menuResponse] = await Promise.all([
                axios.get(`${url}/api/store/public/${storeSlug}`),
                axios.get(`${url}/api/store/public/${storeSlug}/menu`)
            ]);
            
            if (storeResponse.data.success) {
                setCurrentStore(storeResponse.data.store);
                setStoreId(storeResponse.data.store._id);
            }
            
            if (menuResponse.data.success) {
                setStoreMenu({
                    categories: menuResponse.data.data.categories || [],
                    foods: menuResponse.data.data.foods || []
                });
                setFoodList(menuResponse.data.data.foods || []);
            }
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao carregar dados da loja:', error);
            return { success: false, error };
        }
    }, [url]);

    // Função para carregar lista de todas as lojas
    const loadAllStores = useCallback(async () => {
        try {
            const response = await axios.get(`${url}/api/system/stores/public`);
            if (response.data.success) {
                setAllStores(response.data.stores);
                return { success: true, stores: response.data.stores };
            } else {
                console.error('Erro na resposta da API:', response.data.message);
                return { success: false, stores: [] };
            }
        } catch (error) {
            console.error('Erro ao carregar lojas:', error);
            return { success: false, stores: [] };
        }
    }, [url]);

    // Função para limpar dados da loja atual
    const clearStoreData = useCallback(() => {
        setCurrentStore(null);
        setStoreMenu({ categories: [], foods: [] });
        setFoodList([]);
        // Não limpar o carrinho ao trocar de loja para manter os itens
    }, []);

    // Efeito para detectar mudanças no token
    useEffect(() => {
        if (token) {
            // Carregar carrinho do backend quando usuário faz login
            const loadCartFromBackend = async () => {
                try {
                    const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
                    setCartItems(response.data.cartData || {});
                } catch (error) {
                    console.error('Erro ao carregar carrinho do backend:', error);
                }
            };
            loadCartFromBackend();
        }
        // Não limpar o carrinho quando não há token - manter localStorage
    }, [token, url]);

    // Efeito para sincronizar com localStorage quando não há token
    useEffect(() => {
        if (!token && Object.keys(cartItems).length > 0) {
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
        }
    }, [cartItems, token]);

    // Efeito para carregamento inicial
    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            
            const storedToken = localStorage.getItem("token");
            if (storedToken) {
                setToken(storedToken);
            }
        }
        loadData();
    }, [fetchFoodList]);

    const contextValue = useMemo(() => ({
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
        storeId,
        setStoreId,
        loadStoreData,
        loadAllStores,
        clearStoreData,
        fetchFoodList
    }), [food_list, cartItems, addToCart, removeFromCart, getTotalCartAmount, url, token, currentStore, storeMenu, allStores, storeId, loadStoreData, loadAllStores, clearStoreData, fetchFoodList]);

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

StoreContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default StoreContextProvider;
export { StoreContext };
