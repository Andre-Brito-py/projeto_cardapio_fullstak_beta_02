import React, { useState, useEffect, useContext } from 'react';
import './ProductDetail.css';
import { useParams, useNavigate } from 'react-router-dom';
import { StoreContext } from '../../components/context/StoreContext';
import { assets } from '../../assets/assets';
import axios from 'axios';
import SEO from '../../components/SEO/SEO';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart, url, cartItems } = useContext(StoreContext);
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [selectedExtras, setSelectedExtras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalPrice, setTotalPrice] = useState(0);
    const [error, setError] = useState(null);
    const [observations, setObservations] = useState('');
    const [includeDisposables, setIncludeDisposables] = useState(false);
    


    // Fetch product details
    useEffect(() => {
        const fetchProduct = async () => {
            if (!id) {
                setError('ID do produto não fornecido');
                setLoading(false);
                return;
            }
            
            try {
                const response = await axios.get(`${url}/api/food/list`);
                
                if (response.data.success) {
                    const foundProduct = response.data.data.find(item => {
                        return item._id.toString() === id.toString();
                    });
                    
                    if (foundProduct) {
                        setProduct(foundProduct);
                        // Ensure price is a number
                        const price = parseFloat(foundProduct.price) || 0;
                        setTotalPrice(price);
                        setError(null);
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

    // Calculate total price when quantity or extras change
    useEffect(() => {
        if (product) {
            const basePrice = (parseFloat(product.price) || 0) * quantity;
            const extrasPrice = selectedExtras.reduce((total, extra) => {
                return total + ((parseFloat(extra.price) || 0) * quantity);
            }, 0);
            setTotalPrice(basePrice + extrasPrice);
        }
    }, [product, quantity, selectedExtras]);

    const handleExtraChange = (extra, isChecked) => {
        if (isChecked) {
            setSelectedExtras([...selectedExtras, extra]);
        } else {
            setSelectedExtras(selectedExtras.filter(item => item.name !== extra.name));
        }
    };



    const handleFinishOrder = async () => {
        // Add to cart with the specified quantity, extras, observations and disposables
        for (let i = 0; i < quantity; i++) {
            await addToCart(product._id, selectedExtras, observations, includeDisposables);
        }
        
        // Navigate directly to cart
        navigate('/cart');
    };

    const handleContinueShopping = async () => {
        // Add to cart with the specified quantity, extras, observations and disposables
        for (let i = 0; i < quantity; i++) {
            await addToCart(product._id, selectedExtras, observations, includeDisposables);
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
                        
                        {product.extras && product.extras.length > 0 && (
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