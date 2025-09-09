import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { LogIn, User, Lock } from 'lucide-react'

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    console.log('Enviando login:', formData)

    try {
      console.log('Fazendo requisição para:', '/api/counter-attendant/login')
      const response = await fetch('/api/counter-attendant/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      console.log('Resposta recebida:', response.status, response.statusText)
      const data = await response.json()
      console.log('Dados da resposta:', data)

      if (response.ok) {
        console.log('Login bem-sucedido, chamando onLogin')
        onLogin(data.token, data.attendant)
      } else {
        console.log('Login falhou:', data.message)
        toast.error(data.message || 'Erro ao fazer login')
      }
    } catch (error) {
      console.error('Erro no login:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f8f9fa'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '400px',
        margin: '20px'
      }}>
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            backgroundColor: '#3498db',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <LogIn size={24} color="white" />
          </div>
          <h1 style={{ margin: 0, color: '#2c3e50' }}>Sistema de Balcão</h1>
          <p style={{ margin: '0.5rem 0 0', color: '#6c757d' }}>Faça login para continuar</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              <User size={16} style={{ marginRight: '0.5rem' }} />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-control"
              placeholder="Digite seu email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={16} style={{ marginRight: '0.5rem' }} />
              Senha
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-control"
              placeholder="Digite sua senha"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              marginTop: '1rem'
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{
          textAlign: 'center',
          marginTop: '1.5rem',
          padding: '1rem',
          backgroundColor: '#f8f9fa',
          borderRadius: '4px',
          fontSize: '0.9rem',
          color: '#6c757d'
        }}>
          <strong>Acesso restrito</strong><br />
          Apenas atendentes autorizados podem acessar este sistema.
        </div>
      </div>
    </div>
  )
}

export default Login