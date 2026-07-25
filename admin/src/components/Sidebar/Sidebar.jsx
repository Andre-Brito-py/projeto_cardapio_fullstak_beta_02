import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = ({ isOpen, onClose }) => {
  const sections = [
    {
      title: "Cardápio",
      items: [
        { to: '/add', icon: 'ti-plus', label: 'Add Items' },
        { to: '/list', icon: 'ti-list', label: 'List Items' },
        { to: '/categories', icon: 'ti-category', label: 'Categories' },
        { to: '/product-suggestions', icon: 'ti-bulb', label: 'Sugestões' },
        { to: '/banners', icon: 'ti-photo', label: 'Banners' },
      ]
    },
    {
      title: "Operações",
      items: [
        { to: '/orders', icon: 'ti-receipt-2', label: 'Orders' },
        { to: '/order-stats', icon: 'ti-chart-bar', label: 'Estatísticas' },
        { to: '/payment-stats', icon: 'ti-credit-card', label: 'Pagamentos' },
        { to: '/tables', icon: 'ti-table', label: 'Mesas' },
        { to: '/coupons', icon: 'ti-ticket', label: 'Cupons' },
        { to: '/cashback', icon: 'ti-coin', label: 'Cashback' },
      ]
    },
    {
      title: "Clientes",
      items: [
        { to: '/customers', icon: 'ti-users', label: 'Clientes' },
        { to: '/customer-analytics', icon: 'ti-chart-area', label: 'Analytics' },
      ]
    },
    {
      title: "Equipe",
      items: [
        { to: '/waiter-management', icon: 'ti-user', label: 'Garçom' },
        { to: '/counter-attendants', icon: 'ti-user', label: 'Balcão' },
      ]
    },
    {
      title: "Configurações",
      items: [
        { to: '/settings', icon: 'ti-settings', label: 'Settings' },
        { to: '/payment-settings', icon: 'ti-credit-card', label: 'Pagamento' },
        { to: '/store-links', icon: 'ti-link', label: 'Links da Loja' },
        { to: '/bluetooth-print', icon: 'ti-bluetooth', label: 'Impressora BT' },
      ]
    },
    {
      title: "Integrações",
      items: [
        { to: '/whatsapp-settings', icon: 'ti-brand-whatsapp', label: 'WhatsApp Config' },
        { to: '/whatsapp-messages', icon: 'ti-brand-whatsapp', label: 'WhatsApp Msgs' },
        { to: '/liza-chat', icon: 'ti-message-circle', label: 'Chat Liza' },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop para mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>
      
      {/* Sidebar Content */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:transform-none overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-4 px-3 flex flex-col gap-6">
          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <NavLink 
                    key={itemIdx}
                    to={item.to} 
                    onClick={onClose}
                    className={({ isActive }) => `
                      flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${isActive 
                        ? 'bg-indigo-50 text-indigo-700' 
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'}
                    `}
                  >
                    <i className={`ti ${item.icon} text-lg ${isActive ? 'text-indigo-600' : 'text-gray-400'}`}></i>
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;
