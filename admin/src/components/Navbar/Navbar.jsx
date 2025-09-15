import React from 'react'
import './Navbar.css'
import { assets } from './../../assets/assets';
import { useTheme } from '../../contexts/ThemeContext';

const Navbar = ({ logout, isSuperAdmin, onToggleSidebar }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <div className='navbar'>
        <button className='mobile-menu-toggle' onClick={onToggleSidebar}>
          <span></span>
          <span></span>
          <span></span>
        </button>
        <img className='logo' src={assets.logo} alt="" />
        <div className='navbar-center'>
          {isSuperAdmin && (
            <div className='admin-badge'>
              <span>🔧 Super Admin</span>
            </div>
          )}
        </div>
        <div className='navbar-right'>
          <div className='theme-toggle-container' title={`Alternar para modo ${isDark ? 'claro' : 'escuro'}`}>
            <label className='theme-toggle-switch'>
              <input
                type="checkbox"
                checked={isDark}
                onChange={toggleTheme}
              />
              <span className='theme-slider'></span>
            </label>
          </div>
          <img src={assets.profile_image} alt="" className="profile" />
          <button onClick={logout} className='logout-btn'>Sair</button>
        </div>
    </div>
  )
}

export default Navbar