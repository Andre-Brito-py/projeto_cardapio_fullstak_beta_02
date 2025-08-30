import { useContext, useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { StoreContext } from '../../components/context/StoreContext';
import FoodDisplay from '../../components/FoodDisplay/FoodDisplay';
import ExploreMenu from '../../components/ExploreMenu/ExploreMenu';
import Header from '../../components/Header/Header';

import ShareStore from '../../components/ShareStore/ShareStore';
import SEO from '../../components/SEO/SEO';
import './StoreHome.css';

const StoreHome = () => {
    const { storeSlug } = useParams();
    const { currentStore, storeMenu, loadStoreData, clearStoreData } = useContext(StoreContext);
    const [category, setCategory] = useState(""); // Deixar vazio para permitir que ExploreMenu defina automaticamente
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Carregar dados da loja
    const handleLoadStoreData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await loadStoreData(storeSlug);
            
            if (!result.success) {
                setError('Loja não encontrada ou erro ao carregar dados');
            }
            
        } catch (error) {
            console.error('Erro ao carregar dados da loja:', error);
            setError('Erro ao carregar dados da loja');
        } finally {
            setLoading(false);
        }
    }, [loadStoreData, storeSlug]);



    useEffect(() => {
        if (storeSlug) {
            handleLoadStoreData();
        }
        
        // Limpar dados ao desmontar o componente
        return () => {
            clearStoreData();
        };
    }, [storeSlug, handleLoadStoreData, clearStoreData]);

    // Aplicar customização da loja
    useEffect(() => {
        if (currentStore?.customization) {
            const root = document.documentElement;
            if (currentStore.customization.primaryColor) {
                root.style.setProperty('--primary-color', currentStore.customization.primaryColor);
            }
            if (currentStore.customization.secondaryColor) {
                root.style.setProperty('--secondary-color', currentStore.customization.secondaryColor);
            }
        }
        
        // Cleanup: restaurar cores padrão quando sair
        return () => {
            const root = document.documentElement;
            root.style.removeProperty('--primary-color');
            root.style.removeProperty('--secondary-color');
        };
    }, [currentStore]);

    if (loading) {
        return (
            <div className="store-loading">
                <div className="loading-spinner"></div>
                <p>Carregando loja...</p>
            </div>
        );
    }

    if (error || !currentStore) {
        return (
            <div className="store-error">
                <h2>Loja não encontrada</h2>
                <p>{error || 'A loja que você está procurando não existe ou não está disponível.'}</p>
                <a href="/" className="btn-home">Voltar ao início</a>
            </div>
        );
    }

    return (
        <div className="store-home">
            <SEO 
                storeName={currentStore.name}
                storeDescription={currentStore.description || `Peça comida online da ${currentStore.name}. Entrega rápida e qualidade garantida.`}
                storeImage={currentStore.logo}
                url={window.location.href}
                keywords={`${currentStore.name}, delivery, comida online, restaurante, pedidos`}
            />
            
            {/* Cabeçalho da loja */}
            <div className="store-header">
                <div className="store-info">
                    {currentStore.logo && (
                        <img src={currentStore.logo} alt={currentStore.name} className="store-logo" />
                    )}
                    <div className="store-details">
                        <div className="store-info-content">
                            <h1>{currentStore.name}</h1>
                            {currentStore.description && (
                                <p className="store-description">{currentStore.description}</p>
                            )}
                            {currentStore.address && (
                                <p className="store-address">
                                    <i className="fas fa-map-marker-alt"></i>
                                    {currentStore.address}
                                </p>
                            )}
                            {/* Status da loja */}
                            <div className={`store-status ${currentStore.isOpen ? 'open' : 'closed'}`}>
                                <i className={`fas ${currentStore.isOpen ? 'fa-circle' : 'fa-circle'}`}></i>
                                <span>{currentStore.isOpen ? 'Aberta' : 'Fechada'}</span>
                            </div>
                        </div>
                        <div className="store-actions">
                            <ShareStore storeData={currentStore} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Verificar se a loja está fechada */}
            {!currentStore.isOpen ? (
                <div className="store-closed-message">
                    <div className="closed-content">
                        <i className="fas fa-moon"></i>
                        <h2>Loja Temporariamente Fechada</h2>
                        <p>Desculpe, a <strong>{currentStore.name}</strong> está fechada no momento.</p>
                        <p>Por favor, volte em outro momento para fazer seu pedido.</p>
                        <div className="closed-actions">
                            <p className="closed-note">Aguarde a reabertura da loja para fazer seu pedido.</p>
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Banner personalizado */}
                    <Header storeData={currentStore} />
                    
                    {/* Menu de exploração */}
                    <ExploreMenu 
                        category={category} 
                        setCategory={setCategory}
                        categories={storeMenu.categories.length > 0 ? storeMenu.categories : null}
                    />
                    
                    {/* Exibição de produtos */}
                    <FoodDisplay 
                        category={category}
                        foods={storeMenu.foods}
                        storeId={currentStore.id}
                    />
                    

                </>
            )}
        </div>
    );
};

export default StoreHome;