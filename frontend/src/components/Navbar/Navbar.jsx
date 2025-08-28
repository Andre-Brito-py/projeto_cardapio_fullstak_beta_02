import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import './Navbar.css'
import { assets } from './../../assets/assets';
import {Link, useNavigate, useLocation} from 'react-router-dom'
import { StoreContext } from './../context/StoreContext';

const Navbar = ({setShowLogin}) => {

  const [menu, setMenu] = useState('home');

  const {getTotalCartAmount, token, setToken, currentStore} = useContext(StoreContext);

  const navigate = useNavigate();
  const location = useLocation();

  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    navigate("/")
  }

  // Função para lidar com o clique na logo
  const handleLogoClick = (e) => {
    e.preventDefault();
    
    // Verificar se estamos em uma página de loja específica
    const storeMatch = location.pathname.match(/^\/loja\/([^/]+)$/);
    
    if (storeMatch) {
      // Se estamos em uma página de loja, rolar para o topo mantendo a mesma loja
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMenu('home');
    } else {
      // Se não estamos em uma página de loja, recarregar para ativar o redirecionamento automático
      window.location.reload();
    }
  }

  // Função para lidar com o clique no botão "início"
  const handleHomeClick = (e) => {
    e.preventDefault();
    
    // Verificar se estamos em uma página de loja específica
    const storeMatch = location.pathname.match(/^\/loja\/([^/]+)$/);
    
    if (storeMatch) {
      // Se estamos em uma página de loja, rolar para o topo mantendo a mesma loja
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setMenu('home');
    } else {
      // Se não estamos em uma página de loja, recarregar para ativar o redirecionamento automático
      window.location.reload();
    }
  }

  return (
    <div className='navbar'>
       <a href="#" onClick={handleLogoClick}> <img src={assets.logo} alt="" className='logo' /></a>
        <ul className="navbar-menu">
            <a href="#" onClick={handleHomeClick} className={menu === 'home'?'active':''}>inicio</a>
            <a href='#explore-menu' onClick={()=> setMenu('menu')} className={menu === 'menu'?'active':''}>cardapio</a>
            <a href='#footer' onClick={()=> setMenu('contact-us')} className={menu === 'contact-us'?'active':''}>contato</a>
        </ul>
        <div className="navbar-right">
            <img src={assets.search_icon} alt="" />
            <div className="navbar-search-icon">
                <Link to='/cart'><img src={assets.basket_icon} alt="" /></Link>
                <div className={getTotalCartAmount()===0?'':'dot'}></div>
            </div>
            {!token?<button onClick={()=> setShowLogin(true)}>entrar</button>
            :<div className='navbar-profile'>
              <img src={assets.profile_icon} alt="" />
              <ul className="nav-profile-dropdown">
                <li onClick={()=> navigate('/myorders')}><img src={assets.bag_icon} alt="" /><p>Pedidos</p></li>
                <hr />  
                <li onClick={logout}><img src={assets.logout_icon} alt="" /><p>Sair</p></li>
              </ul>
            </div>
            }
              </div>
    </div>
  )
}

Navbar.propTypes = {
    setShowLogin: PropTypes.func.isRequired
};

export default Navbar