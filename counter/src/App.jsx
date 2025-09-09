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
  const [renderKey, setRenderKey] = useState(0)
  


  useEffect(() => {
    if (token) {
      // Verificar se o token não está expirado
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Math.floor(Date.now() / 1000)
        
        if (tokenPayload.exp < currentTime) {
          handleLogout()
          return
        }
      } catch (error) {
        handleLogout()
        return
      }
      
      fetchAttendantProfile()
    }
  }, [token])

  const fetchAttendantProfile = async () => {
    try {
      const response = await fetch('/api/counter-attendant/profile', {
        headers: {
          'token': token,
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.attendant) {
          setAttendant(data.attendant)
        } else {
          handleLogout(false) // Token inválido, não mostrar mensagem
        }
      } else {
        handleLogout(false) // Erro de autenticação, não mostrar mensagem
      }
    } catch (error) {
      console.error('Erro ao buscar perfil:', error)
      handleLogout(false) // Erro de conexão, não mostrar mensagem
    }
  }

  const handleLogin = (newToken, attendantData) => {
    localStorage.setItem('counter-token', newToken)
    setToken(newToken)
    setAttendant(attendantData)
    setRenderKey(prev => prev + 1) // Força re-renderização completa
    toast.success('Login realizado com sucesso!')
  }

  const handleLogout = (showMessage = true) => {
    localStorage.removeItem('counter-token')
    setToken(null)
    setAttendant(null)
    if (showMessage) {
      toast.info('Sessão encerrada')
    }
  }

  if (!token) {
    return <Login key={`login-${renderKey}`} onLogin={handleLogin} />
  }
  return (
    <div key={`app-${renderKey}`} className="app">
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