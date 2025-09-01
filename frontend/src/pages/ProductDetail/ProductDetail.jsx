import { useState, useEffect, useContext } from 'react';
import './ProductDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../components/context/StoreContext';

import axios from 'axios';
import SEO from '../../components/SEO/SEO';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, url } = useContext(StoreContext);
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [error, setError] = useState(null);
    const [observations, setObservations] = useState('');
    const [includeDisposables, setIncludeDisposables] = useState(false);
    const [addonCategories, setAddonCategories] = useState([]);
    const [addons, setAddons] = useState([]);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [productSuggestions, setProductSuggestions] = useState([]);
    


    // Fetch product details and addon data
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setError('ID do produto não fornecido');
                setLoading(false);
                return;
            }
            
            try {
                const productResponse = await axios.get(`${url}/api/food/list`);
                
                if (productResponse.data.success) {
                    const foundProduct = productResponse.data.data.find(item => {
                        return item._id.toString() === id.toString();
                    });
                    
                    if (foundProduct) {
                        setProduct(foundProduct);
                        // Ensure price is a number
                        const price = parseFloat(foundProduct.price) || 0;
                        setTotalPrice(price);
                        setError(null);
                        
                        // Fetch product suggestions if the product uses new addon system
                        if (!foundProduct.useOldSystem) {
                            try {
                                const suggestionsResponse = await axios.get(`${url}/api/product-suggestions/${id}`);
                                if (suggestionsResponse.data.success) {
                                    setProductSuggestions(suggestionsResponse.data.suggestions);
                                }
                            } catch (error) {
                                // No suggestions found for this product
                            }
                        }
                    } else {
                        setError(`Produto com ID ${id} não encontrado`);
                    }
                } else {
                    setError('Erro ao carregar lista de produtos');
                }
            } catch (error) {
                console.error('Error fetching product:', error);
                setError('Erro de conexão com o servidor');
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id, url]);

    // Calculate total price when quantity, extras, or addons change
    useEffect(() => {
        if (product) {
            const basePrice = (parseFloat(product.price) || 0) * quantity;
            
            let extrasPrice = 0;
            if (product.useOldSystem) {
                // Sistema antigo - usar extras
                extrasPrice = selectedExtras.reduce((total, extra) => {
                    return total + ((parseFloat(extra.price) || 0) * quantity);
                }, 0);
            } else {
                // Novo sistema inline - usar adicionais
                extrasPrice = selectedAddons.reduce((total, addon) => {
                    return total + ((parseFloat(addon.price) || 0) * quantity);
                }, 0);
            }
            
            setTotalPrice(basePrice + extrasPrice);
        }
    }, [product, quantity, selectedExtras, selectedAddons]);

    const handleExtraChange = (extra, isChecked) => {
        if (isChecked) {
            setSelectedExtras([...selectedExtras, extra]);
        } else {
            setSelectedExtras(selectedExtras.filter(item => item.name !== extra.name));
        }
    };

    const handleInlineAddonChange = (categoryName, addon, isChecked) => {
        if (isChecked) {
            setSelectedAddons(prev => [...prev, { ...addon, categoryName }]);
        } else {
            setSelectedAddons(prev => prev.filter(item => 
                !(item.name === addon.name && item.categoryName === categoryName)
            ));
        }
    };

    const getSelectedAddonsForInlineCategory = (categoryName) => {
        return selectedAddons.filter(addon => addon.categoryName === categoryName);
    };

    const isInlineAddonSelected = (categoryName, addon) => {
        return selectedAddons.some(selected => 
            selected.name === addon.name && selected.categoryName === categoryName
        );
    };



    const handleFinishOrder = async () => {
        let allExtras = [];
        
        if (product.useOldSystem) {
            // Sistema antigo - usar apenas extras
            allExtras = selectedExtras;
        } else {
            // Novo sistema inline - usar apenas adicionais
            allExtras = selectedAddons;
        }
        
        // Add to cart with the specified quantity, extras, observations and disposables
        for (let i = 0; i < quantity; i++) {
            await addToCart(product._id, allExtras, observations, includeDisposables);
        }
        
        // Navigate directly to cart
        navigate('/cart');
    };

    const handleContinueShopping = async () => {
        // Combine legacy extras with new addons
        const allExtras = [...selectedExtras, ...selectedAddons];
        
        // Add to cart with the specified quantity, extras, observations and disposables
        for (let i = 0; i < quantity; i++) {
            await addToCart(product._id, allExtras, observations, includeDisposables);
        }
        
        // Navigate back to store page
        navigate('/');
    };

    if (loading) {
        return (
            <div className="product-detail-loading">
                <h2>Carregando...</h2>
                <p>Buscando produto com ID: {id}</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="product-detail-error">
                <h2>Erro</h2>
                <p>{error}</p>
                <button onClick={() => navigate('/')} className="back-btn">
                    Voltar ao Menu
                </button>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="product-detail-error">
                <h2>Produto não encontrado</h2>
                <p>O produto solicitado não foi encontrado.</p>
                <button onClick={() => navigate('/')} className="back-btn">
                    Voltar ao Menu
                </button>
            </div>
        );
    }

    return (
        <div className="product-detail">
            <SEO 
                title={`${product.name} - Food Delivery`}
                description={product.description || `Peça ${product.name} com entrega rápida`}
                keywords={`${product.name}, ${product.category}, food delivery, pedido online`}
            />
            <div className="product-detail-container">
                <button onClick={() => navigate('/')} className="back-button">
                    ← Voltar ao Menu
                </button>
                
                <div className="product-detail-content">
                    <div className="product-image-section">
                        <img 
                            src={`${url}/images/${product.image}`} 
                            alt={product.name}
                            className="product-detail-image"
                        />
                    </div>
                    
                    <div className="product-info-section">
                        <h1 className="product-title">{product.name}</h1>
                        <p className="product-description">{product.description}</p>
                        <p className="product-category">Categoria: {product.category}</p>
                        <p className="product-base-price">Preço base: R$ {(parseFloat(product.price) || 0).toFixed(2)}</p>
                        
                        <div className="quantity-section">
                            <h3>Quantidade:</h3>
                            <div className="quantity-controls">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="quantity-btn"
                                >
                                    -
                                </button>
                                <span className="quantity-display">{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="quantity-btn"
                                >
                                    +
                                </button>
                            </div>
                        </div>
                        
                        {/* Legacy extras system */}
                        {product.useOldSystem && product.extras && product.extras.length > 0 && (
                            <div className="extras-section">
                                <h3>Adicionais:</h3>
                                <div className="extras-list">
                                    {product.extras.map((extra, index) => (
                                        <div key={index} className="extra-item">
                                            <label className="extra-label">
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) => handleExtraChange(extra, e.target.checked)}
                                                    className="extra-checkbox"
                                                />
                                                <span className="extra-name">{extra.name}</span>
                                                <span className="extra-price">+ R$ {(parseFloat(extra.price) || 0).toFixed(2)}</span>
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* New inline addon categories system */}
                        {!product.useOldSystem && product.inlineAddonCategories && product.inlineAddonCategories.length > 0 && (
                            <div className="addon-categories-section">
                                <h3>Personalize seu pedido:</h3>
                                {product.inlineAddonCategories.map((category, categoryIndex) => {
                                    const categoryAddons = product.categoryAddons[category.name] || [];
                                    const selectedCategoryAddons = getSelectedAddonsForInlineCategory(category.name);
                                    
                                    if (categoryAddons.length === 0) return null;
                                    
                                    return (
                                        <div key={categoryIndex} className="addon-category">
                                            <h4 className="category-title">
                                                {category.name}
                                            </h4>
                                            {category.description && (
                                                <p className="category-description">{category.description}</p>
                                            )}
                                            <div className="addons-list">
                                                {categoryAddons.map((addon, addonIndex) => (
                                                    <div key={addonIndex} className="addon-item">
                                                        <label className="addon-label">
                                                            <input
                                                                type="checkbox"
                                                                checked={isInlineAddonSelected(category.name, addon)}
                                                                onChange={(e) => handleInlineAddonChange(category.name, addon, e.target.checked)}
                                                                className="addon-checkbox"
                                                            />
                                                            <div className="addon-content">
                                                                <span className="addon-name">{addon.name}</span>
                                                                {addon.description && (
                                                                    <span className="addon-description">{addon.description}</span>
                                                                )}
                                                            </div>
                                                            <span className="addon-price">+ R$ {(parseFloat(addon.price) || 0).toFixed(2)}</span>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Product suggestions */}
                        {productSuggestions.length > 0 && (
                            <div className="suggestions-section">
                                <h3>Sugestões para você:</h3>
                                <div className="suggestions-list">
                                    {productSuggestions.map(suggestion => (
                                        <div key={suggestion._id} className="suggestion-item" onClick={() => navigate(`/product/${suggestion._id}`)}>
                                            <img 
                                                src={`${url}/images/${suggestion.image}`} 
                                                alt={suggestion.name}
                                                className="suggestion-image"
                                            />
                                            <div className="suggestion-info">
                                                <h4>{suggestion.name}</h4>
                                                <p className="suggestion-price">R$ {(parseFloat(suggestion.price) || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="observations-section">
                            <h3>Observações:</h3>
                            <textarea
                                value={observations}
                                onChange={(e) => setObservations(e.target.value)}
                                placeholder="Adicione observações especiais para este item..."
                                className="observations-textarea"
                                rows="3"
                            />
                        </div>
                        
                        <div className="disposables-section">
                            <h3>Descartáveis:</h3>
                            <label className="disposables-label">
                                <input
                                    type="checkbox"
                                    checked={includeDisposables}
                                    onChange={(e) => setIncludeDisposables(e.target.checked)}
                                    className="disposables-checkbox"
                                />
                                <span>Incluir descartáveis (garfo, faca, guardanapo)</span>
                            </label>
                        </div>
                        
                        <div className="total-price-section">
                            <h2 className="total-price">Total: R$ {(parseFloat(totalPrice) || 0).toFixed(2)}</h2>
                        </div>
                        
                        <div className="action-buttons">
                            <button 
                                onClick={handleFinishOrder}
                                className="finish-order-btn"
                            >
                                Finalizar Pedido
                            </button>
                            <button 
                                onClick={handleContinueShopping}
                                className="continue-shopping-btn"
                            >
                                Continuar Comprando
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;