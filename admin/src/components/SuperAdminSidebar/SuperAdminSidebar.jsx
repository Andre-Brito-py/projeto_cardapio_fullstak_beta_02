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
        <div className='super-admin-sidebar-header'>
          <span className='card-title'>Administração</span>
        </div>
        <div className='super-admin-sidebar-options'>
          <div className='sidebar-section'>
            <span className='sidebar-section-title'>Visão Geral</span>
            <NavLink to='/super-admin/dashboard' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-layout-dashboard'></i>
              <p>Dashboard</p>
            </NavLink>
            <NavLink to='/super-admin/stores' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-building-store'></i>
              <p>Gerenciar Lojas</p>
            </NavLink>
            <NavLink to='/super-admin/system-settings' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-settings'></i>
              <p>Config. Sistema</p>
            </NavLink>
          </div>

          <div className='sidebar-section'>
            <span className='sidebar-section-title'>Integrações</span>
            <NavLink to='/super-admin/api-management' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-plug'></i>
              <p>Gerenciar APIs</p>
            </NavLink>
            <NavLink to='/super-admin/asaas' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-wallet'></i>
              <p>Dashboard Asaas</p>
            </NavLink>
          </div>

          <div className='sidebar-section'>
            <span className='sidebar-section-title'>Inteligência</span>
            <NavLink to='/super-admin/analytics' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-chart-line'></i>
              <p>Analytics Global</p>
            </NavLink>
          </div>

          <div className='sidebar-section'>
            <span className='sidebar-section-title'>Usuários & Logs</span>
            <NavLink to='/super-admin/users' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-users'></i>
              <p>Gerenciar Usuários</p>
            </NavLink>
            <NavLink to='/super-admin/logs' className='super-admin-sidebar-option' onClick={onClose}>
              <i className='ti ti-list-details'></i>
              <p>Logs do Sistema</p>
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminSidebar;
