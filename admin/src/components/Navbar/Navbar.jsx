import React from 'react'
import './Navbar.css'
import { assets } from './../../assets/assets';

const Navbar = ({ logout, isSuperAdmin }) => {
  return (
    <div className='navbar'>
        <img className='logo' src={assets.logo} alt="" />
        <div className='navbar-center'>
          {isSuperAdmin && (
            <div className='admin-badge'>
              <span>🔧 Super Admin</span>
            </div>
          )}
        </div>
        <div className='navbar-right'>
          <img src={assets.profile_image} alt="" className="profile" />
          <button onClick={logout} className='logout-btn'>Sair</button>
        </div>
    </div>
  )
}

export default Navbar