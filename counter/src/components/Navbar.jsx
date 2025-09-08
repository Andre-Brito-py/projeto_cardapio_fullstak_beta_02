import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingCart, Package, User, LogOut } from 'lucide-react'

const Navbar = ({ attendant, onLogout }) => {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/orders', icon: ShoppingCart, label: 'Pedidos' },
    { path: '/products', icon: Package, label: 'Produtos' },
    { path: '/profile', icon: User, label: 'Perfil' }
  ]

  return (
    <nav style={{
      backgroundColor: '#2c3e50',
      color: 'white',
      padding: '1rem 0',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div className="container" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Sistema de Balcão</h1>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  color: location.pathname === path ? '#3498db' : 'white',
                  backgroundColor: location.pathname === path ? 'rgba(52, 152, 219, 0.1)' : 'transparent',
                  transition: 'all 0.2s'
                }}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {attendant && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: '500' }}>
                {attendant.name}
              </div>
              <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>
                Turno: {attendant.shift}
              </div>
            </div>
          )}
          
          <button
            onClick={onLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar