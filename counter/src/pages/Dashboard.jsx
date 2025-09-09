import React, { useState, useEffect } from 'react'
import { ShoppingCart, DollarSign, Clock, TrendingUp } from 'lucide-react'

const Dashboard = ({ attendant }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  


  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/counter-orders/stats/attendant', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, subtitle }) => (
    <div className="card" style={{
      textAlign: 'center',
      border: `2px solid ${color}`,
      borderRadius: '8px'
    }}>
      <div style={{
        width: '50px',
        height: '50px',
        backgroundColor: color,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 1rem'
      }}>
        <Icon size={24} color="white" />
      </div>
      <h3 style={{ margin: '0 0 0.5rem', fontSize: '2rem', color }}>{value}</h3>
      <p style={{ margin: '0 0 0.25rem', fontWeight: '600', color: '#2c3e50' }}>{title}</p>
      {subtitle && <p style={{ margin: 0, fontSize: '0.9rem', color: '#6c757d' }}>{subtitle}</p>}
    </div>
  )

  if (loading) {
    return (
      <div className="loading">
        <div>Carregando estatísticas...</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem'
      }}>
        <div>
          <h1 style={{ margin: '0 0 0.5rem' }}>Dashboard</h1>
          <p style={{ margin: 0, color: '#6c757d' }}>
            Bem-vindo(a), {attendant?.name}! Aqui estão suas estatísticas de hoje.
          </p>
        </div>
        <div style={{
          padding: '0.5rem 1rem',
          backgroundColor: '#e8f5e8',
          color: '#2d5a2d',
          borderRadius: '20px',
          fontSize: '0.9rem',
          fontWeight: '500'
        }}>
          Turno: {attendant?.shift}
        </div>
      </div>

      {stats ? (
        <>
          <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
            <StatCard
              icon={ShoppingCart}
              title="Pedidos Hoje"
              value={stats.todayOrders || 0}
              color="#3498db"
              subtitle="Pedidos processados"
            />
            <StatCard
              icon={DollarSign}
              title="Vendas Hoje"
              value={`R$ ${(stats.todaySales || 0).toFixed(2)}`}
              color="#27ae60"
              subtitle="Valor total vendido"
            />
            <StatCard
              icon={TrendingUp}
              title="Total de Pedidos"
              value={stats.totalOrders || 0}
              color="#e74c3c"
              subtitle="Desde o cadastro"
            />
            <StatCard
              icon={Clock}
              title="Último Pedido"
              value={stats.lastOrderTime || 'Nenhum'}
              color="#f39c12"
              subtitle="Horário do último pedido"
            />
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Resumo do Turno</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Pedidos processados:</span>
                  <strong>{stats.todayOrders || 0}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Valor médio por pedido:</span>
                  <strong>R$ {stats.todayOrders > 0 ? ((stats.todaySales || 0) / stats.todayOrders).toFixed(2) : '0.00'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status:</span>
                  <span style={{
                    padding: '0.25rem 0.5rem',
                    backgroundColor: attendant?.isActive ? '#d4edda' : '#f8d7da',
                    color: attendant?.isActive ? '#155724' : '#721c24',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {attendant?.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
              </div>
            </div>

            <div className="card">
              <h3 style={{ marginBottom: '1rem' }}>Permissões</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {attendant?.permissions ? (
                  Object.entries(attendant.permissions).map(([key, value]) => (
                    <div key={key} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: value ? '#27ae60' : '#e74c3c',
                        borderRadius: '50%'
                      }}></div>
                      <span style={{ 
                        textTransform: 'capitalize',
                        color: value ? '#2c3e50' : '#6c757d'
                      }}>
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        {value ? '' : ' (Negado)'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                    Nenhuma permissão específica
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center">
          <p>Não foi possível carregar as estatísticas.</p>
        </div>
      )}
    </div>
  )
}

export default Dashboard