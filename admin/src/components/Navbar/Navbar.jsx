import React from 'react';
import { assets } from './../../assets/assets';
import { useTheme } from '../../contexts/ThemeContext';
import { motion } from 'framer-motion';

const Navbar = ({ logout, isSuperAdmin, onToggleSidebar }) => {
  const { toggleTheme, isDark } = useTheme();

  return (
    <nav className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-50">
      <div className="flex items-center gap-4">
        {/* Botão Mobile Hamburger */}
        <button 
          onClick={onToggleSidebar}
          className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <img className="h-8 w-auto object-contain" src={assets.logo} alt="Logo" />
          <div className="hidden sm:flex items-center">
            <span className="h-4 w-px bg-gray-300 mx-3"></span>
            {isSuperAdmin ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                Super Admin
              </span>
            ) : (
              <span className="text-sm font-semibold text-gray-700 truncate max-w-[150px]">
                {localStorage.getItem('storeName') || 'Minha Loja'}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        >
          {isDark ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notifications (Mock) */}
        <button className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        {/* User Dropdown/Profile */}
        <div className="flex items-center gap-3 ml-2 border-l border-gray-200 pl-4">
          <img 
            src={assets.profile_image} 
            alt="Profile" 
            className="h-8 w-8 rounded-full object-cover ring-2 ring-white" 
          />
          <button 
            onClick={logout}
            className="hidden sm:inline-flex text-sm font-medium text-gray-500 hover:text-red-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
