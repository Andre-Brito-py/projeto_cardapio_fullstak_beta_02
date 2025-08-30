import { createContext, useEffect, useState, useMemo, useCallback } from "react";
import PropTypes from 'prop-types';
import axios from "axios";

export const StoreContext = createContext(null);

const StoreContextProvider = (props) => {
    const url = "http://localhost:4000";
    const [cartItems, setCartItems] = useState({});
    const [token, setToken] = useState("");
    const [food_list, setFoodList] = useState([]);
    const [currentStore, setCurrentStore] = useState(null);
    const [storeMenu, setStoreMenu] = useState({ categories: [], foods: [] });
    const [allStores, setAllStores] = useState([]);

    // DEBUG: Log para monitorar mudanças no carrinho
    useEffect(() => {
        console.log('🛒 [DEBUG] CartItems mudou:', {
            itemCount: Object.keys(cartItems).length,
            items: cartItems,
            timestamp: new Date().toISOString()
        });
    }, [cartItems]);

    // DEBUG: Log para monitorar mudanças no token
    useEffect(() => {
        console.log('🔑 [DEBUG] Token mudou:', {
            hasToken: !!token,
            tokenLength: token?.length || 0,
            timestamp: new Date().toISOString()
        });
    }, [token]);

    const addToCart = useCallback(async (itemId, extras = [], observations = '', includeDisposables = false) => {
        console.log('➕ [DEBUG] AddToCart chamado:', {
            itemId,
            extras,
            observations,
            includeDisposables,
            hasToken: !!token,
            timestamp: new Date().toISOString()
        });

        // Criar chave única para o item baseada no itemId e extras
        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a._id.localeCompare(b._id))) : '';
        const cartKey = `${itemId}${extrasKey}`;
        
        console.log('🔑 [DEBUG] CartKey gerada:', cartKey);

        // Atualizar estado local primeiro
        setCartItems((prev) => {
            const newCartItems = { ...prev };
            
            if (!newCartItems[cartKey]) {
                newCartItems[cartKey] = {
                    quantity: 1,
                    itemId,
                    extras: extras || [],
                    observations: observations || '',
                    includeDisposables: includeDisposables || false
                };
            } else {
                newCartItems[cartKey].quantity += 1;
                newCartItems[cartKey].observations = observations || newCartItems[cartKey].observations;
                newCartItems[cartKey].includeDisposables = includeDisposables !== undefined ? includeDisposables : newCartItems[cartKey].includeDisposables;
            }
            
            console.log('📦 [DEBUG] Novo estado do carrinho (local):', newCartItems);
            return newCartItems;
        });

        // Se usuário autenticado, enviar para backend
        if (token) {
            console.log('🌐 [DEBUG] Enviando para backend (usuário autenticado)');
            try {
                const response = await axios.post(url + '/api/cart/add', {
                    itemId,
                    extras: extras || [],
                    observations: observations || '',
                    includeDisposables: includeDisposables || false
                }, { headers: { token } });
                
                console.log('✅ [DEBUG] Resposta do backend (add):', response.data);
            } catch (error) {
                console.error('❌ [DEBUG] Erro ao adicionar no backend:', error);
            }
        } else {
            console.log('💾 [DEBUG] Salvando no localStorage (usuário não autenticado)');
            // Salvar no localStorage para usuários não autenticados
            setCartItems((currentCart) => {
                localStorage.setItem("cartItems", JSON.stringify(currentCart));
                console.log('💾 [DEBUG] Salvo no localStorage:', currentCart);
                return currentCart;
            });
        }
    }, [token, url]);

    const removeFromCart = useCallback(async (itemId, extras = []) => {
        console.log('➖ [DEBUG] RemoveFromCart chamado:', {
            itemId,
            extras,
            hasToken: !!token,
            timestamp: new Date().toISOString()
        });

        const extrasKey = extras.length > 0 ? JSON.stringify(extras.sort((a, b) => a._id.localeCompare(b._id))) : '';
        const cartKey = `${itemId}${extrasKey}`;
        
        console.log('🔑 [DEBUG] CartKey para remoção:', cartKey);

        setCartItems((prev) => {
            const newCartItems = { ...prev };
            
            if (newCartItems[cartKey] && newCartItems[cartKey].quantity > 0) {
                newCartItems[cartKey].quantity -= 1;
                
                if (newCartItems[cartKey].quantity === 0) {
                    delete newCartItems[cartKey];
                }
            }
            
            console.log('📦 [DEBUG] Novo estado após remoção (local):', newCartItems);
            return newCartItems;
        });

        if (token) {
            console.log('🌐 [DEBUG] Removendo do backend (usuário autenticado)');
            try {
                const response = await axios.post(url + '/api/cart/remove', {
                    itemId,
                    extras: extras || []
                }, { headers: { token } });
                
                console.log('✅ [DEBUG] Resposta do backend (remove):', response.data);
            } catch (error) {
                console.error('❌ [DEBUG] Erro ao remover do backend:', error);
            }
        } else {
            console.log('💾 [DEBUG] Atualizando localStorage após remoção');
            setCartItems((currentCart) => {
                localStorage.setItem("cartItems", JSON.stringify(currentCart));
                console.log('💾 [DEBUG] localStorage atualizado:', currentCart);
                return currentCart;
            });
        }
    }, [token, url]);

    const getTotalCartAmount = useMemo(() => {
        let totalAmount = 0;
        for (const item in cartItems) {
            if (cartItems[item].quantity > 0) {
                let itemInfo = food_list.find((product) => product._id === cartItems[item].itemId);
                if (itemInfo) {
                    let itemPrice = itemInfo.price;
                    const cartItem = cartItems[item];
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

    const fetchFoodList = useCallback(async () => {
        console.log('🍕 [DEBUG] Carregando lista de produtos...');
        try {
            const response = await axios.get(url + "/api/food/list");
            setFoodList(response.data.data);
            console.log('✅ [DEBUG] Lista de produtos carregada:', response.data.data?.length || 0, 'itens');
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao carregar produtos:', error);
        }
    }, [url]);

    const loadStoreData = useCallback(async (storeSlug) => {
        console.log('🏪 [DEBUG] Carregando dados da loja:', storeSlug);
        try {
            const [storeResponse, menuResponse] = await Promise.all([
                axios.get(`${url}/api/store/public/${storeSlug}`),
                axios.get(`${url}/api/store/public/${storeSlug}/menu`)
            ]);
            
            if (storeResponse.data.success) {
                setCurrentStore(storeResponse.data.store);
                console.log('✅ [DEBUG] Dados da loja carregados:', storeResponse.data.store?.name);
            }
            
            if (menuResponse.data.success) {
                setStoreMenu({
                    categories: menuResponse.data.data.categories || [],
                    foods: menuResponse.data.data.foods || []
                });
                setFoodList(menuResponse.data.data.foods || []);
                console.log('✅ [DEBUG] Menu da loja carregado:', menuResponse.data.data.foods?.length || 0, 'itens');
            }
            
            return { success: true };
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao carregar dados da loja:', error);
            return { success: false, error };
        }
    }, [url]);

    const loadAllStores = useCallback(async () => {
        console.log('🏪 [DEBUG] Carregando todas as lojas...');
        try {
            const response = await axios.get(`${url}/api/system/stores/public`);
            if (response.data.success) {
                setAllStores(response.data.stores);
                console.log('✅ [DEBUG] Lojas carregadas:', response.data.stores?.length || 0);
            }
            return response.data.stores || [];
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao carregar lojas:', error);
            return [];
        }
    }, [url]);

    const clearStoreData = useCallback(() => {
        console.log('🧹 [DEBUG] Limpando dados da loja atual');
        setCurrentStore(null);
        setStoreMenu({ categories: [], foods: [] });
        setFoodList([]);
    }, []);

    const loadCartData = useCallback(async (token) => {
        console.log('🛒 [DEBUG] Carregando carrinho do backend...');
        try {
            const response = await axios.post(url + "/api/cart/get", {}, { headers: { token } });
            console.log('✅ [DEBUG] Carrinho carregado do backend:', response.data.cartData);
            setCartItems(response.data.cartData || {});
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao carregar carrinho do backend:', error);
            setCartItems({});
        }
    }, [url]);

    const syncCartWithBackend = useCallback(async (newToken) => {
        console.log('🔄 [DEBUG] Iniciando sincronização do carrinho com backend...');
        try {
            const localCart = localStorage.getItem("cartItems");
            console.log('💾 [DEBUG] Carrinho local encontrado:', localCart);
            
            if (localCart && localCart !== 'null' && localCart !== 'undefined') {
                const parsedLocalCart = JSON.parse(localCart);
                console.log('📦 [DEBUG] Carrinho local parseado:', parsedLocalCart);
                
                if (Object.keys(parsedLocalCart).length > 0) {
                    console.log('🔄 [DEBUG] Sincronizando itens locais com backend...');
                    
                    // Primeiro, obter carrinho do backend
                    const backendResponse = await axios.post(url + "/api/cart/get", {}, { headers: { token: newToken } });
                    let backendCart = backendResponse.data.cartData || {};
                    console.log('🌐 [DEBUG] Carrinho atual no backend:', backendCart);
                    
                    // Mesclar carrinho local com backend
                    for (const cartKey in parsedLocalCart) {
                        const localItem = parsedLocalCart[cartKey];
                        console.log('➕ [DEBUG] Processando item local:', cartKey, localItem);
                        
                        if (backendCart[cartKey]) {
                            console.log('🔄 [DEBUG] Item já existe no backend, somando quantidades');
                            backendCart[cartKey].quantity += localItem.quantity;
                            if (localItem.observations) {
                                backendCart[cartKey].observations = localItem.observations;
                            }
                            if (localItem.includeDisposables !== undefined) {
                                backendCart[cartKey].includeDisposables = localItem.includeDisposables;
                            }
                        } else {
                            console.log('➕ [DEBUG] Novo item, adicionando ao backend');
                            backendCart[cartKey] = localItem;
                        }
                        
                        // Enviar cada item para o backend
                        for (let i = 0; i < localItem.quantity; i++) {
                            console.log(`🌐 [DEBUG] Enviando item ${i + 1}/${localItem.quantity} para backend`);
                            await axios.post(url + '/api/cart/add', {
                                itemId: localItem.itemId,
                                extras: localItem.extras || [],
                                observations: localItem.observations || '',
                                includeDisposables: localItem.includeDisposables || false
                            }, { headers: { token: newToken } });
                        }
                    }
                    
                    console.log('🧹 [DEBUG] Limpando carrinho local após sincronização');
                    localStorage.removeItem("cartItems");
                    
                    console.log('🔄 [DEBUG] Recarregando carrinho do backend para garantir consistência');
                    await loadCartData(newToken);
                } else {
                    console.log('📭 [DEBUG] Carrinho local vazio, carregando apenas do backend');
                    await loadCartData(newToken);
                }
            } else {
                console.log('📭 [DEBUG] Nenhum carrinho local, carregando apenas do backend');
                await loadCartData(newToken);
            }
        } catch (error) {
            console.error('❌ [DEBUG] Erro ao sincronizar carrinho:', error);
            console.log('🔄 [DEBUG] Fallback: carregando apenas do backend');
            await loadCartData(newToken);
        }
    }, [url, loadCartData]);

    // Efeito para detectar mudanças no token e sincronizar carrinho
    useEffect(() => {
        console.log('🔑 [DEBUG] useEffect do token disparado:', { hasToken: !!token });
        if (token) {
            console.log('🔄 [DEBUG] Token detectado, iniciando sincronização...');
            syncCartWithBackend(token);
        }
    }, [token, syncCartWithBackend]);

    useEffect(() => {
        console.log('🚀 [DEBUG] Inicializando StoreContext...');
        async function loadData() {
            await fetchFoodList();
            const storedToken = localStorage.getItem("token");
            console.log('🔑 [DEBUG] Token armazenado encontrado:', !!storedToken);
            
            if (storedToken) {
                console.log('🔑 [DEBUG] Definindo token do localStorage');
                setToken(storedToken);
            } else {
                console.log('💾 [DEBUG] Sem token, carregando carrinho do localStorage');
                try {
                    const localCart = localStorage.getItem("cartItems");
                    console.log('💾 [DEBUG] Carrinho local bruto:', localCart);
                    
                    if (localCart && localCart !== 'null' && localCart !== 'undefined') {
                        const parsedCart = JSON.parse(localCart);
                        console.log('📦 [DEBUG] Carrinho local parseado:', parsedCart);
                        setCartItems(parsedCart);
                    } else {
                        console.log('📭 [DEBUG] Carrinho local vazio, inicializando vazio');
                        setCartItems({});
                    }
                } catch (error) {
                    console.error('❌ [DEBUG] Erro ao ler localStorage:', error);
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

StoreContextProvider.propTypes = {
    children: PropTypes.node.isRequired
};

export default StoreContextProvider;