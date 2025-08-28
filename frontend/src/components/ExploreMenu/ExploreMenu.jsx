import React, { useState, useEffect, useRef, useContext } from 'react'
import PropTypes from 'prop-types'
import './ExploreMenu.css'
import axios from 'axios'
import { StoreContext } from '../context/StoreContext'

const ExploreMenu = ({category, setCategory}) => {
    const { url } = useContext(StoreContext);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const scrollContainerRef = useRef(null);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axios.get(`${url}/api/category/active`);
            
            if (response.data.success) {
                setCategories(response.data.data);
            } else {
                setError(response.data.message || 'Erro ao carregar categorias.');
            }
        } catch (error) {
            console.error('Erro ao carregar categorias:', error);
            const errorMessage = error.response?.data?.message || 'Erro ao conectar com o servidor. Tente novamente.';
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const checkScrollButtons = () => {
        if (scrollContainerRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
            setCanScrollLeft(scrollLeft > 0);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
        }
    };

    const scrollToLeft = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: -200, behavior: 'smooth' });
        }
    };

    const scrollToRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
        setScrollLeft(scrollContainerRef.current.scrollLeft);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const x = e.pageX - scrollContainerRef.current.offsetLeft;
        const walk = (x - startX) * 2;
        scrollContainerRef.current.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    useEffect(() => {
        if (url) {
            fetchCategories();
        }
    }, [url]);

    useEffect(() => {
        checkScrollButtons();
        const handleScroll = () => checkScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [categories]);

    if (loading) {
        return (
            <div className='explore-menu' id='explore-menu'>
                <h1>Explore Nosso Cardápio</h1>
                <div className="explore-menu-loading">
                    <p>Carregando categorias...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className='explore-menu' id='explore-menu'>
                <h1>Explore Nosso Cardápio</h1>
                <div className="explore-menu-error">
                    <p>{error}</p>
                    <button onClick={fetchCategories} className="retry-btn">
                        Tentar novamente
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className='explore-menu' id='explore-menu'>
            <h1>Explore Nosso Cardápio</h1>
            <p className='explore-menu=text'>Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta. Navegue por uma variedade de restaurantes, faça seu pedido e acompanhe em tempo real. Desfrute de comida quente e fresca sem sair de casa. Rápido, conveniente e fácil de usar</p>
            <div className="explore-menu-container">
                {canScrollLeft && (
                    <button className="scroll-button scroll-left" onClick={scrollToLeft}>
                        &#8249;
                    </button>
                )}
                <div 
                    className="explore-menu-list"
                    ref={scrollContainerRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
                >
                    {categories.map((item, index) => {
                        return (
                            <div 
                                onClick={() => setCategory(prev => prev === item.name ? 'Todos' : item.name)} 
                                key={index} 
                                className="explore-menu-list-item"
                                style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
                            >
                                <img className={category === item.name ? 'active' : ''} src={`${url}/images/${item.image}`} alt={item.name} />
                                <p>{item.name}</p>
                            </div>
                        )
                    })}
                </div>
                {canScrollRight && (
                    <button className="scroll-button scroll-right" onClick={scrollToRight}>
                        &#8250;
                    </button>
                )}
            </div>
            <hr/>
        </div>
    )
}

ExploreMenu.propTypes = {
    category: PropTypes.string.isRequired,
    setCategory: PropTypes.func.isRequired
};

export default ExploreMenu