import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SuperAdminSidebar = ({ isOpen, onClose }) => {
  const sections = [
    {
      title: "Visão Geral",
      items: [
        { to: '/super-admin/dashboard', icon: 'ti-layout-dashboard', label: 'Dashboard' },
        { to: '/super-admin/stores', icon: 'ti-building-store', label: 'Gerenciar Lojas' },
        { to: '/super-admin/system-settings', icon: 'ti-settings', label: 'Config. Sistema' },
      ]
    },
    {
      title: "Integrações",
      items: [
        { to: '/super-admin/api-management', icon: 'ti-plug', label: 'Gerenciar APIs' },
        { to: '/super-admin/asaas', icon: 'ti-wallet', label: 'Dashboard Asaas' },
      ]
    },
    {
      title: "Inteligência",
      items: [
        { to: '/super-admin/analytics', icon: 'ti-chart-line', label: 'Analytics Global' },
      ]
    },
    {
      title: "Usuários & Logs",
      items: [
        { to: '/super-admin/users', icon: 'ti-users', label: 'Gerenciar Usuários' },
        { to: '/super-admin/logs', icon: 'ti-list-details', label: 'Logs do Sistema' },
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
      
      {/* Sidebar Content (Theme: Escuro para SuperAdmin) */}
      <div 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:transform-none overflow-y-auto ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="py-4 px-3 flex flex-col gap-6">
          <div className="px-3">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Administração Global</span>
          </div>

          {sections.map((section, idx) => (
            <div key={idx}>
              <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                    `}
                  >
                    <i className={`ti ${item.icon} text-lg ${isActive ? 'text-white' : 'text-gray-400'}`}></i>
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

export default SuperAdminSidebar;
