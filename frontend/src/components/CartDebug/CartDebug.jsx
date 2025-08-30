import { useContext, useEffect, useState } from 'react';
import { StoreContext } from '../context/StoreContext';
import './CartDebug.css';

const CartDebug = () => {
    const { cartItems, setCartItems, token } = useContext(StoreContext);
    const [localStorageData, setLocalStorageData] = useState({});
    const [debugInfo, setDebugInfo] = useState([]);

    const addDebugInfo = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setDebugInfo(prev => [...prev, `${timestamp}: ${message}`]);
    };

    useEffect(() => {
        // Monitorar mudanças no localStorage
        const checkLocalStorage = () => {
            try {
                const stored = localStorage.getItem('cartItems');
                if (stored && stored !== 'null' && stored !== 'undefined') {
                    const parsed = JSON.parse(stored);
                    setLocalStorageData(parsed);
                    addDebugInfo(`localStorage atualizado: ${Object.keys(parsed).length} itens`);
                } else {
                    setLocalStorageData({});
                    addDebugInfo('localStorage vazio ou inválido');
                }
            } catch (error) {
                addDebugInfo(`Erro ao ler localStorage: ${error.message}`);
                setLocalStorageData({});
            }
        };

        // Verificar inicialmente
        checkLocalStorage();

        // Verificar a cada segundo
        const interval = setInterval(checkLocalStorage, 1000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        addDebugInfo(`Estado React atualizado: ${Object.keys(cartItems).length} itens`);
    }, [cartItems]);

    const forceSync = () => {
        try {
            const stored = localStorage.getItem('cartItems');
            if (stored && stored !== 'null' && stored !== 'undefined') {
                const parsed = JSON.parse(stored);
                setCartItems(parsed);
                addDebugInfo('Sincronização forçada: localStorage → React');
            } else {
                addDebugInfo('Nenhum dado no localStorage para sincronizar');
            }
        } catch (error) {
            addDebugInfo(`Erro na sincronização forçada: ${error.message}`);
        }
    };

    const clearAll = () => {
        localStorage.removeItem('cartItems');
        setCartItems({});
        addDebugInfo('Carrinho limpo (localStorage e React)');
    };

    const addTestItem = () => {
        const testItem = {
            quantity: 1,
            itemId: 'test-item-' + Date.now(),
            extras: [],
            observations: 'Item de teste',
            includeDisposables: false
        };
        
        const newCart = {
            ...cartItems,
            [testItem.itemId]: testItem
        };
        
        setCartItems(newCart);
        
        if (!token) {
            localStorage.setItem('cartItems', JSON.stringify(newCart));
            addDebugInfo('Item de teste adicionado (localStorage + React)');
        } else {
            addDebugInfo('Item de teste adicionado (apenas React - usuário autenticado)');
        }
    };

    return (
        <div className="cart-debug">
            <h2>🔍 Debug do Carrinho</h2>
            
            <div className="debug-section">
                <h3>Estado Atual</h3>
                <div className="debug-info">
                    <p><strong>Token:</strong> {token ? 'Presente' : 'Ausente'}</p>
                    <p><strong>React State:</strong> {Object.keys(cartItems).length} itens</p>
                    <p><strong>localStorage:</strong> {Object.keys(localStorageData).length} itens</p>
                    <p><strong>Sincronizado:</strong> {Object.keys(cartItems).length === Object.keys(localStorageData).length ? '✅' : '❌'}</p>
                </div>
            </div>

            <div className="debug-section">
                <h3>Ações</h3>
                <div className="debug-actions">
                    <button onClick={forceSync}>🔄 Forçar Sincronização</button>
                    <button onClick={addTestItem}>➕ Adicionar Item Teste</button>
                    <button onClick={clearAll}>🗑️ Limpar Tudo</button>
                </div>
            </div>

            <div className="debug-section">
                <h3>Dados do React State</h3>
                <pre className="debug-data">
                    {JSON.stringify(cartItems, null, 2)}
                </pre>
            </div>

            <div className="debug-section">
                <h3>Dados do localStorage</h3>
                <pre className="debug-data">
                    {JSON.stringify(localStorageData, null, 2)}
                </pre>
            </div>

            <div className="debug-section">
                <h3>Log de Eventos</h3>
                <div className="debug-log">
                    {debugInfo.slice(-10).map((info, index) => (
                        <div key={index} className="debug-log-item">
                            {info}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CartDebug;