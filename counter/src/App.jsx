import React, { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import Products from './pages/Products'
import Profile from './pages/Profile'
import Navbar from './components/Navbar'
import { toast } from 'react-toastify'

function App() {
  const [token, setToken] = useState(localStorage.getItem('counter-token'))
  const [attendant, setAttendant] = useState(null)

  useEffect(() => {
    console.log('useEffect executado, token atual:', token)
    if (token) {
      // Verificar se o token é válido e obter dados do atendente
      fetchAttendantProfile()
    }
  }, [token])

  const fetchAttendantProfile = async () => {
    try {
      console.log('Fazendo requisição para /api/counter-attendant/profile com token:', token)
      const response = await fetch('/api/counter-attendant/profile', {
        headers: {
          'token': token
        }
      })
      
      console.log('Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Response data:', data)
        
        if (data.success && data.attendant) {
          setAttendant(data.attendant)
        } else {
          console.log('Profile fetch failed - no success or attendant')
          handleLogout()
        }
      } else {
        console.log('Response not ok:', response.status)
        handleLogout()
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      handleLogout()
    }
  }

  const handleLogin = (newToken, attendantData) => {
    localStorage.setItem('counter-token', newToken)
    setToken(newToken)
    setAttendant(attendantData)
    toast.success('Login realizado com sucesso!')
  }

  const handleLogout = () => {
    localStorage.removeItem('counter-token')
    setToken(null)
    setAttendant(null)
    toast.info('Sessão encerrada')
  }

  if (!token) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <div className="app">
      <Navbar attendant={attendant} onLogout={handleLogout} />
      <div className="container">
        <Routes>
          <Route path="/" element={<Dashboard attendant={attendant} />} />
          <Route path="/orders" element={<Orders attendant={attendant} />} />
          <Route path="/products" element={<Products attendant={attendant} />} />
          <Route path="/profile" element={<Profile attendant={attendant} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App