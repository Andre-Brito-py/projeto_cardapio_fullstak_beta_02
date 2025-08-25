import React, { useState, useEffect, useRef } from 'react'
import './ExploreMenu.css'
import axios from 'axios'

const ExploreMenu = ({category, setCategory}) => {
    const [categories, setCategories] = useState([]);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const scrollContainerRef = useRef(null);
    const url = 'http://localhost:4000';

    const fetchCategories = async () => {
        try {
            const response = await axios.get(`${url}/api/category/active`);
            if (response.data.success) {
                setCategories(response.data.data);
            }
        } catch (error) {
            console.log('Erro ao carregar categorias:', error);
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
        fetchCategories();
    }, []);

    useEffect(() => {
        checkScrollButtons();
        const handleScroll = () => checkScrollButtons();
        const container = scrollContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [categories]);

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

export default ExploreMenu