import React from 'react'
import './Sidebar.css'
import { assets } from '../../assets/assets'
import { NavLink } from 'react-router-dom'

const Sidebar = ({ isOpen, onClose }) => {
  return (
    <>
      {/* Backdrop para fechar o menu em mobile */}
      {isOpen && <div className='sidebar-backdrop' onClick={onClose}></div>}
      
      <div className={`sidebar ${isOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-options">
        <NavLink to='/add' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option" onClick={onClose}>
          <img src={assets.order_icon} alt="" />
          <p>List Items</p>
        </NavLink>
        <NavLink to='/categories' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Categories</p>
        </NavLink>
        <NavLink to='/banners' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Banners</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option" onClick={onClose}>
          <img src={assets.order_icon} alt="" />
          <p>Orders</p>
        </NavLink>
        <NavLink to='/tables' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Mesas</p>
        </NavLink>
        <NavLink to='/coupons' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Cupons</p>
        </NavLink>
        <NavLink to='/customers' className="sidebar-option" onClick={onClose}>
          <img src={assets.order_icon} alt="" />
          <p>Clientes</p>
        </NavLink>
        <NavLink to='/waiter-management' className="sidebar-option" onClick={onClose}>
          <img src={assets.order_icon} alt="" />
          <p>Garçom</p>
        </NavLink>
        <NavLink to='/in-person-sales' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Saídas Presenciais</p>
        </NavLink>
        <NavLink to='/settings' className="sidebar-option" onClick={onClose}>
          <img src={assets.add_icon} alt="" />
          <p>Settings</p>
        </NavLink>
        <NavLink to='/store-links' className="sidebar-option" onClick={onClose}>
           <img src={assets.parcel_icon} alt="" />
           <p>Links da Loja</p>
         </NavLink>
        <NavLink to='/bluetooth-print' className="sidebar-option" onClick={onClose}>
          <img src={assets.order_icon} alt="" />
          <p>Impressora BT</p>
        </NavLink>
      </div>
    </div>
    </>
  )
}

export default Sidebar