import { useState, useEffect, useContext } from 'react'
import './Header.css'
import { StoreContext } from '../context/StoreContext'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const Header = () => {
  const { url, storeId } = useContext(StoreContext);
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [intervalId, setIntervalId] = useState(null);

  const fetchBanners = async () => {
    try {
      // Se há um storeId definido, busca banners específicos da loja
      if (storeId) {
        console.log('Buscando banners para storeId:', storeId);
        const headers = {
          'X-Store-ID': storeId
        };
        
        const response = await axios.get(`${url}/api/banner/list`, { headers });
        if (response.data.success && response.data.data.length > 0) {
          console.log('Banners encontrados:', response.data.data.length);
          setBanners(response.data.data);
          return;
        }
      }
      
      // Se não há storeId ou não há banners cadastrados, busca o banner principal das configurações
      console.log('Buscando banner principal das configurações...');
      await fetchMainBanner();
    } catch (error) {
      console.error('Erro ao buscar banners:', error);
      // Em caso de erro, tenta buscar banner principal
      await fetchMainBanner();
    }
  };

  const fetchMainBanner = async () => {
    try {
      const headers = {};
      if (storeId) {
        headers['X-Store-ID'] = storeId;
      }
      
      const response = await axios.get(`${url}/api/settings/banner`, { headers });
      if (response.data.success && response.data.data) {
        setBanners([response.data.data]);
      }
    } catch (error) {
      console.error('Erro ao buscar banner principal:', error);
      // Em caso de erro, não exibe nenhum banner
    }
  };



  // Função para iniciar/reiniciar o timer
  const startTimer = () => {
    if (intervalId) {
      clearInterval(intervalId);
    }
    
    if (banners.length > 1) {
      const newIntervalId = setInterval(() => {
        setCurrentBannerIndex((prevIndex) => 
          prevIndex === banners.length - 1 ? 0 : prevIndex + 1
        );
      }, 7000);
      setIntervalId(newIntervalId);
    }
  };

  // Auto-rotação dos banners a cada 7 segundos
  useEffect(() => {
    startTimer();
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [banners.length]);

  // Navegação manual com reinício do timer
  const goToPrevious = () => {
    setCurrentBannerIndex(
      currentBannerIndex === 0 ? banners.length - 1 : currentBannerIndex - 1
    );
    startTimer(); // Reinicia o timer
  };

  const goToNext = () => {
    setCurrentBannerIndex(
      currentBannerIndex === banners.length - 1 ? 0 : currentBannerIndex + 1
    );
    startTimer(); // Reinicia o timer
  };

  // Navegação por indicador com reinício do timer
  const goToSlide = (index) => {
    setCurrentBannerIndex(index);
    startTimer(); // Reinicia o timer
  };

  const handleViewProduct = (productId) => {
    if (productId && productId !== 'undefined' && productId !== '') {
      navigate(`/product/${productId}`);
    } else {
      const menuElement = document.getElementById('explore-menu');
      if (menuElement) {
        menuElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    if (url) {
      fetchBanners();
    }
  }, [url, fetchBanners]);



  // Se não há banners, não renderiza nada até carregar
  if (banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentBannerIndex];
  const backgroundImage = currentBanner.image.startsWith('/') 
    ? currentBanner.image 
    : `${url}/images/${currentBanner.image}`; // A imagem já vem codificada do backend

  return (
    <div className='header' style={{ backgroundImage: `url(${backgroundImage})` }}>
        <div className="header-contents">
            <h2 key={`title-${currentBannerIndex}`} className="animated-title">
              {currentBanner.title.split('').map((char, index) => (
                <span 
                  key={index} 
                  className="letter" 
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </h2>
            <p key={`desc-${currentBannerIndex}`} className="animated-description">
              {currentBanner.description.split('').map((char, index) => (
                <span 
                  key={index} 
                  className="letter-desc" 
                  style={{ animationDelay: `${0.5 + index * 0.01}s` }}
                >
                  {char === ' ' ? '\u00A0' : char}
                </span>
              ))}
            </p>
            <button 
              key={`btn-${currentBannerIndex}`}
              className="animated-button"
              onClick={() => handleViewProduct(currentBanner.productId)}
            >
              Peça Já!
            </button>
        </div>
        
        {banners.length > 1 && (
          <>
            <button className="banner-nav banner-nav-left" onClick={goToPrevious}>
              &#8249;
            </button>
            <button className="banner-nav banner-nav-right" onClick={goToNext}>
              &#8250;
            </button>
            
            <div className="banner-indicators">
              {banners.map((_, index) => (
                <span 
                  key={index}
                  className={`indicator ${index === currentBannerIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                ></span>
              ))}
            </div>
          </>
        )}
    </div>
  )
}

export default Header