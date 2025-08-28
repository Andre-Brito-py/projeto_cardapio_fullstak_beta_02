// Importações necessárias
import { createContext, useEffect, useState, useMemo, useCallback } from "react";
import axios from 'axios';

// Criação do contexto da loja
const StoreContext = createContext(null);

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
    const addToCart = useCallback(async (itemId, extras = [], observations = '', includeDisposables = false) => {
        // Cria uma chave única para o item com seus extras
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a.name.localeCompare(b.name))) : '';
        const cartKey = extrasKey ? `${itemId}_${btoa(extrasKey)}` : itemId;
        
        // Update cart items using functional update
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
             
             // Salvar no localStorage imediatamente se usuário não estiver autenticado
             if (!token) {
                 localStorage.setItem('cartItems', JSON.stringify(newCartItems));
             }
             
             return newCartItems;
         });
        
        // Enviar para backend se usuário estiver autenticado
        if (token) {
            try {
                const response = await axios.post(url+'/api/cart/add',{itemId, extras, observations, includeDisposables},{headers:{token}});
                if (response.data.success) {
                    // Item adicionado com sucesso no backend
                }
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
            
            // Salvar no localStorage imediatamente se usuário não estiver autenticado
            if (!token) {
                localStorage.setItem('cartItems', JSON.stringify(newCartItems));
            }
            
            return newCartItems;
        });
        
        // Enviar para backend se usuário estiver autenticado
        if (token && itemId) {
            try {
                const response = await axios.post(url+'/api/cart/remove',{itemId, extras},{headers:{token}});
                if (response.data.success) {
                    // Item removido com sucesso
                }
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

    const loadCartData = useCallback(async (token) =>{
        try {
            const response = await axios.post(url+"/api/cart/get",{},{headers:{token}});
            setCartItems(response.data.cartData || {});
        } catch (error) {
            console.error('Erro ao carregar carrinho do backend:', error);
            setCartItems({});
        }
    }, [url]);

    // Função para sincronizar carrinho local com backend após login
    const syncCartWithBackend = useCallback(async (newToken) => {
        try {
            const localCart = localStorage.getItem("cartItems");
            if (localCart && localCart !== 'null' && localCart !== 'undefined') {
                const parsedLocalCart = JSON.parse(localCart);
                
                // Se há itens no carrinho local, sincronizar com backend
                if (Object.keys(parsedLocalCart).length > 0) {
                    // Primeiro, obter carrinho do backend
                    const backendResponse = await axios.post(url+"/api/cart/get",{},{headers:{token: newToken}});
                    let backendCart = backendResponse.data.cartData || {};
                    
                    // Mesclar carrinho local com backend
                    for (const cartKey in parsedLocalCart) {
                        const localItem = parsedLocalCart[cartKey];
                        if (backendCart[cartKey]) {
                            // Item já existe no backend, somar quantidades
                            backendCart[cartKey].quantity += localItem.quantity;
                            // Manter observações mais recentes (local)
                            if (localItem.observations) {
                                backendCart[cartKey].observations = localItem.observations;
                            }
                            if (localItem.includeDisposables !== undefined) {
                                backendCart[cartKey].includeDisposables = localItem.includeDisposables;
                            }
                        } else {
                            // Item não existe no backend, adicionar
                            backendCart[cartKey] = localItem;
                        }
                        
                        // Enviar cada item para o backend
                        for (let i = 0; i < localItem.quantity; i++) {
                            await axios.post(url+'/api/cart/add',{
                                itemId: localItem.itemId,
                                extras: localItem.extras || [],
                                observations: localItem.observations || '',
                                includeDisposables: localItem.includeDisposables || false
                            },{headers:{token: newToken}});
                        }
                    }
                    
                    // Limpar carrinho local após sincronização
                    localStorage.removeItem("cartItems");
                    
                    // Recarregar carrinho do backend para garantir consistência
                    await loadCartData(newToken);
                } else {
                    // Não há itens locais, apenas carregar do backend
                    await loadCartData(newToken);
                }
            } else {
                // Não há carrinho local, apenas carregar do backend
                await loadCartData(newToken);
            }
        } catch (error) {
            console.error('Erro ao sincronizar carrinho:', error);
            // Em caso de erro, carregar apenas do backend
            await loadCartData(newToken);
        }
    }, [url, loadCartData]);

    // Efeito para detectar mudanças no token e sincronizar carrinho
    useEffect(() => {
        if (token) {
            syncCartWithBackend(token);
        }
    }, [token, syncCartWithBackend]);

    useEffect(() => {
        async function loadData() {
            await fetchFoodList();
            const storedToken = localStorage.getItem("token");
            
            if (storedToken) {
                setToken(storedToken);
                // A sincronização será feita pelo useEffect do token
            } else {
                try {
                    const localCart = localStorage.getItem("cartItems");
                    if (localCart && localCart !== 'null' && localCart !== 'undefined') {
                        const parsedCart = JSON.parse(localCart);
                        setCartItems(parsedCart);
                    } else {
                        setCartItems({});
                    }
                } catch (error) {
                    console.error('Erro ao ler localStorage:', error);
                    setCartItems({});
                }
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
        loadStoreData,
        loadAllStores,
        clearStoreData
    }), [food_list, cartItems, addToCart, removeFromCart, getTotalCartAmount, url, token, currentStore, storeMenu, allStores, loadStoreData, loadAllStores, clearStoreData]);

    return (
        <StoreContext.Provider value={contextValue}>
            {props.children}
        </StoreContext.Provider>
    )
}

export default StoreContextProvider;
export { StoreContext };
