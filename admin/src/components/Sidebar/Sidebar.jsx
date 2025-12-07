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
        <div className="sidebar-header">
          <span className="card-title">Menu</span>
        </div>
        <div className="sidebar-options">
          <div className="sidebar-section">
            <span className="sidebar-section-title">Cardápio</span>
            <NavLink to='/add' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-plus'></i>
              <p>Add Items</p>
            </NavLink>
            <NavLink to='/list' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-list'></i>
              <p>List Items</p>
            </NavLink>
            <NavLink to='/categories' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-category'></i>
              <p>Categories</p>
            </NavLink>
            <NavLink to='/product-suggestions' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-bulb'></i>
              <p>Sugestões de Produtos</p>
            </NavLink>
            <NavLink to='/banners' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-photo'></i>
              <p>Banners</p>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-title">Operações</span>
            <NavLink to='/orders' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-receipt-2'></i>
              <p>Orders</p>
            </NavLink>
            <NavLink to='/order-stats' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-chart-bar'></i>
              <p>Estatísticas</p>
            </NavLink>
            <NavLink to='/payment-stats' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-credit-card'></i>
              <p>Pagamentos</p>
            </NavLink>
            <NavLink to='/tables' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-table'></i>
              <p>Mesas</p>
            </NavLink>
            <NavLink to='/coupons' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-ticket'></i>
              <p>Cupons</p>
            </NavLink>
            <NavLink to='/cashback' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-coin'></i>
              <p>Cashback</p>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-title">Clientes</span>
            <NavLink to='/customers' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-users'></i>
              <p>Clientes</p>
            </NavLink>
            <NavLink to='/customer-analytics' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-chart-area'></i>
              <p>Analytics Liza</p>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-title">Equipe</span>
            <NavLink to='/waiter-management' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-user'></i>
              <p>Garçom</p>
            </NavLink>
            <NavLink to='/counter-attendants' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-user'></i>
              <p>Atendentes Balcão</p>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-title">Configurações</span>
            <NavLink to='/settings' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-settings'></i>
              <p>Settings</p>
            </NavLink>
            <NavLink to='/payment-settings' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-credit-card'></i>
              <p>Config. Pagamento</p>
            </NavLink>
            <NavLink to='/store-links' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-link'></i>
              <p>Links da Loja</p>
            </NavLink>
            <NavLink to='/bluetooth-print' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-bluetooth'></i>
              <p>Impressora BT</p>
            </NavLink>
          </div>

          <div className="sidebar-section">
            <span className="sidebar-section-title">Integrações</span>
            <NavLink to='/whatsapp-settings' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-brand-whatsapp'></i>
              <p>WhatsApp Config</p>
            </NavLink>
            <NavLink to='/whatsapp-messages' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-brand-whatsapp'></i>
              <p>WhatsApp Mensagens</p>
            </NavLink>
            <NavLink to='/liza-chat' className="sidebar-option" onClick={onClose}>
              <i className='ti ti-message-circle'></i>
              <p>Chat com Liza</p>
            </NavLink>
          </div>
        </div>
    </div>
    </>
  )
}

export default Sidebar
