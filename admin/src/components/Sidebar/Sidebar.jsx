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
          <img src={assets.addIcon} alt="" />
          <p>Add Items</p>
        </NavLink>
        <NavLink to='/list' className="sidebar-option" onClick={onClose}>
          <img src={assets.listIcon} alt="" />
          <p>List Items</p>
        </NavLink>
        <NavLink to='/categories' className="sidebar-option" onClick={onClose}>
          <img src={assets.categoryIcon} alt="" />
          <p>Categories</p>
        </NavLink>

        <NavLink to='/banners' className="sidebar-option" onClick={onClose}>
          <img src={assets.bannersIcon} alt="" />
          <p>Banners</p>
        </NavLink>
        <NavLink to='/orders' className="sidebar-option" onClick={onClose}>
          <img src={assets.ordersIcon} alt="" />
          <p>Orders</p>
        </NavLink>
        <NavLink to='/order-stats' className="sidebar-option" onClick={onClose}>
          <img src={assets.analyticsIcon} alt="" />
          <p>Estatísticas</p>
        </NavLink>
        <NavLink to='/payment-stats' className="sidebar-option" onClick={onClose}>
          <img src={assets.paymentIcon} alt="" />
          <p>Pagamentos</p>
        </NavLink>
        <NavLink to='/tables' className="sidebar-option" onClick={onClose}>
          <img src={assets.tablesIcon} alt="" />
          <p>Mesas</p>
        </NavLink>
        <NavLink to='/coupons' className="sidebar-option" onClick={onClose}>
          <img src={assets.couponsIcon} alt="" />
          <p>Cupons</p>
        </NavLink>
        <NavLink to='/cashback' className="sidebar-option" onClick={onClose}>
          <img src={assets.paymentIcon} alt="" />
          <p>Cashback</p>
        </NavLink>
        <NavLink to='/customers' className="sidebar-option" onClick={onClose}>
          <img src={assets.usersIcon} alt="" />
          <p>Clientes</p>
        </NavLink>
        <NavLink to='/customer-analytics' className="sidebar-option" onClick={onClose}>
          <img src={assets.analyticsIcon} alt="" />
          <p>Analytics Liza</p>
        </NavLink>
        <NavLink to='/waiter-management' className="sidebar-option" onClick={onClose}>
          <img src={assets.usersIcon} alt="" />
          <p>Garçom</p>
        </NavLink>
        <NavLink to='/counter-attendants' className="sidebar-option" onClick={onClose}>
          <img src={assets.usersIcon} alt="" />
          <p>Atendentes Balcão</p>
        </NavLink>

        <NavLink to='/settings' className="sidebar-option" onClick={onClose}>
          <img src={assets.settingsIcon} alt="" />
          <p>Settings</p>
        </NavLink>
        <NavLink to='/payment-settings' className="sidebar-option" onClick={onClose}>
          <img src={assets.paymentIcon} alt="" />
          <p>Config. Pagamento</p>
        </NavLink>
        <NavLink to='/store-links' className="sidebar-option" onClick={onClose}>
           <img src={assets.parcel_icon} alt="" />
           <p>Links da Loja</p>
         </NavLink>
        <NavLink to='/bluetooth-print' className="sidebar-option" onClick={onClose}>
          <img src={assets.settingsIcon} alt="" />
          <p>Impressora BT</p>
        </NavLink>
        <NavLink to='/whatsapp-settings' className="sidebar-option" onClick={onClose}>
          <img src={assets.whatsappIcon} alt="" />
          <p>WhatsApp Config</p>
        </NavLink>
        <NavLink to='/whatsapp-messages' className="sidebar-option" onClick={onClose}>
          <img src={assets.whatsappIcon} alt="" />
          <p>WhatsApp Mensagens</p>
        </NavLink>
        <NavLink to='/telegram-contacts' className="sidebar-option" onClick={onClose}>
          <img src={assets.usersIcon} alt="" />
          <p>Contatos Telegram</p>
        </NavLink>
        <NavLink to='/telegram-campaigns' className="sidebar-option" onClick={onClose}>
          <img src={assets.analyticsIcon} alt="" />
          <p>Campanhas Telegram</p>
        </NavLink>
        <NavLink to='/telegram-stats' className="sidebar-option" onClick={onClose}>
          <img src={assets.analyticsIcon} alt="" />
          <p>Stats Telegram</p>
        </NavLink>
        <NavLink to='/telegram-messages' className="sidebar-option" onClick={onClose}>
          <img src={assets.whatsappIcon} alt="" />
          <p>Mensagens Telegram</p>
        </NavLink>
        <NavLink to='/liza-chat' className="sidebar-option" onClick={onClose}>
          <img src={assets.liza_chat_icon} alt="" />
          <p>Chat com Liza</p>
        </NavLink>
      </div>
    </div>
    </>
  )
}

export default Sidebar