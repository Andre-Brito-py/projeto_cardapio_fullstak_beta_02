import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StoreContext } from '../context/StoreContext';
import axios from 'axios';
import SEO from '../SEO/SEO';
import './StoreList.css';

const StoreList = () => {
    const { url } = useContext(StoreContext);
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Carregar lista de lojas
    const loadStores = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${url}/api/system/stores/public`);
            if (response.data.success) {
                setStores(response.data.stores);
            }
        } catch (error) {
            console.error('Erro ao carregar lojas:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadStores();
    }, []);

    // Filtrar lojas por termo de busca
    const filteredStores = stores.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (store.description && store.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (store.address && store.address.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) {
        return (
            <div className="store-list-loading">
                <div className="loading-spinner"></div>
                <p>Carregando lojas...</p>
            </div>
        );
    }

    return (
        <div className="store-list-section">
            <SEO 
                title="Lojas Parceiras - Food Delivery"
                description="Explore todas as nossas lojas parceiras e escolha onde fazer seu pedido. Variedade de restaurantes e estabelecimentos com entrega rápida."
                keywords="lojas, restaurantes, food delivery, estabelecimentos, parceiros, delivery"
            />
            <div className="store-list-header">
                <h2>Escolha sua loja</h2>
                <p>Selecione uma das lojas disponíveis para fazer seu pedido</p>
                
                {/* Barra de busca */}
                <div className="search-container">
                    <input
                        type="text"
                        placeholder="Buscar por nome, descrição ou endereço..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    <i className="fas fa-search search-icon"></i>
                </div>
            </div>

            {filteredStores.length === 0 ? (
                <div className="no-stores">
                    <i className="fas fa-store-slash"></i>
                    <h3>Nenhuma loja encontrada</h3>
                    <p>Não há lojas disponíveis no momento ou que correspondam à sua busca.</p>
                </div>
            ) : (
                <div className="stores-grid">
                    {filteredStores.map((store) => (
                        <Link 
                            key={store.id} 
                            to={`/loja/${store.slug}`} 
                            className="store-card"
                            style={{
                                '--store-primary': store.customization?.primaryColor || '#ff6b35',
                                '--store-secondary': store.customization?.secondaryColor || '#2c3e50'
                            }}
                        >
                            <div className="store-card-header">
                                {store.logo ? (
                                    <img 
                                        src={store.logo} 
                                        alt={store.name} 
                                        className="store-card-logo" 
                                    />
                                ) : (
                                    <div className="store-card-logo-placeholder">
                                        <i className="fas fa-store"></i>
                                    </div>
                                )}
                            </div>
                            
                            <div className="store-card-content">
                                <h3 className="store-card-name">{store.name}</h3>
                                
                                {store.description && (
                                    <p className="store-card-description">{store.description}</p>
                                )}
                                
                                {store.address && (
                                    <div className="store-card-address">
                                        <i className="fas fa-map-marker-alt"></i>
                                        <span>{store.address}</span>
                                    </div>
                                )}
                                
                                <div className="store-card-action">
                                    <span className="visit-store-btn">
                                        Visitar Loja
                                        <i className="fas fa-arrow-right"></i>
                                    </span>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StoreList;