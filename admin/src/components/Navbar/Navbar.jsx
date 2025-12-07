import React from 'react'
import './Navbar.css'
import { assets } from './../../assets/assets';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = ({ logout, isSuperAdmin, onToggleSidebar }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <nav className="navbar">
      <div className="container-xl d-flex align-items-center gap-3 justify-content-between">
        <button className="btn btn-ghost me-2 navbar-toggler" onClick={onToggleSidebar} aria-label="Abrir menu">
          <i className="ti ti-menu-2"></i>
        </button>
        <button className="btn btn-ghost me-2 navbar-toggler" onClick={() => document.body.classList.toggle('sidebar-narrow')} aria-label="Colapsar sidebar">
          <i className="ti ti-layout-sidebar-left-collapse"></i>
        </button>

        <div className="d-flex align-items-center brand-block">
          <img className='navbar-brand-image' src={assets.logo} alt="Logo" />
          {isSuperAdmin ? (
            <span className='badge bg-orange-lt ms-2'>Super Admin</span>
          ) : (
            <span className='store-name ms-2'>{localStorage.getItem('storeName') || 'Minha Loja'}</span>
          )}
        </div>

        <div className='navbar-search ms-auto'>
          <i className='ti ti-search'></i>
          <input type='text' className='form-control' placeholder='Buscar no painel' aria-label='Buscar no painel' />
        </div>

        <div className='d-flex align-items-center navbar-actions gap-2'>
          <button className='btn btn-icon' aria-label='Notificações'>
            <i className='ti ti-bell'></i>
          </button>
          <button
            className={`theme-toggle ${isDark ? 'is-dark' : 'is-light'}`}
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={`Alternar para modo ${isDark ? 'claro' : 'escuro'}`}
            title={`Alternar para modo ${isDark ? 'claro' : 'escuro'}`}
          >
            <i className="ti ti-moon icon-moon"></i>
            <i className="ti ti-sun icon-sun"></i>
          </button>
          <img src={assets.profile_image} alt="Perfil" className="profile" />
          <button onClick={logout} className='btn btn-outline'>Sair</button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
