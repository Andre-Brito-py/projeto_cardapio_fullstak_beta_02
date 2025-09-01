import React from 'react';
import './SuperAdminSidebar.css';
import { NavLink } from 'react-router-dom';
import { assets } from '../../assets/assets';

const SuperAdminSidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop para fechar o menu em mobile */}
      {isOpen && <div className='sidebar-backdrop' onClick={onClose}></div>}
      
      <div className={`super-admin-sidebar ${isOpen ? 'open' : ''}`}>
        <div className='super-admin-sidebar-options'>
          <NavLink to='/super-admin/dashboard' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.add_icon} alt='Dashboard' />
            <p>Dashboard</p>
          </NavLink>
          
          <NavLink to='/super-admin/stores' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.order_icon} alt='Lojas' />
            <p>Gerenciar Lojas</p>
          </NavLink>
          
          <NavLink to='/super-admin/system-settings' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.add_icon} alt='Configurações' />
            <p>Configurações do Sistema</p>
          </NavLink>
          
          <NavLink to='/super-admin/api-management' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.add_icon} alt='APIs' />
            <p>Gerenciar APIs</p>
          </NavLink>
          
          <NavLink to='/super-admin/analytics' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.parcel_icon} alt='Analytics' />
            <p>Analytics Global</p>
          </NavLink>
          
          <NavLink to='/super-admin/users' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.profile_image} alt='Usuários' />
            <p>Gerenciar Usuários</p>
          </NavLink>
          
          <NavLink to='/super-admin/asaas' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.parcel_icon} alt='Asaas Dashboard' />
            <p>Dashboard Asaas</p>
          </NavLink>
          
          <NavLink to='/super-admin/logs' className='super-admin-sidebar-option' onClick={onClose}>
            <img src={assets.order_icon} alt='Logs' />
            <p>Logs do Sistema</p>
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;