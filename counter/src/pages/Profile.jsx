import React, { useState } from 'react'
import { User, Lock, Save, Eye, EyeOff } from 'lucide-react'
import { toast } from 'react-toastify'

const Profile = ({ attendant }) => {
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })
  const [loading, setLoading] = useState(false)

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    })
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    })
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('counter-token')
      const response = await fetch('/api/counter-attendant/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Senha alterada com sucesso!')
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
        setShowPasswordForm(false)
      } else {
        toast.error(data.message || 'Erro ao alterar senha')
      }
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      toast.error('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (!attendant) {
    return <div className="loading">Carregando perfil...</div>
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem' }}>Meu Perfil</h1>

      <div className="grid grid-2" style={{ gap: '2rem' }}>
        {/* Informações Pessoais */}
        <div className="card">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              backgroundColor: '#3498db',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <User size={24} color="white" />
            </div>
            <div>
              <h2 style={{ margin: '0 0 0.25rem' }}>{attendant.name}</h2>
              <p style={{ margin: 0, color: '#6c757d' }}>{attendant.email}</p>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ fontWeight: '600', color: '#2c3e50' }}>Nome Completo</label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '0.25rem'
              }}>
                {attendant.name}
              </div>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#2c3e50' }}>Email</label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '0.25rem'
              }}>
                {attendant.email}
              </div>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#2c3e50' }}>Turno</label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: '#f8f9fa',
                borderRadius: '4px',
                marginTop: '0.25rem'
              }}>
                {attendant.shift}
              </div>
            </div>

            <div>
              <label style={{ fontWeight: '600', color: '#2c3e50' }}>Status</label>
              <div style={{
                padding: '0.75rem',
                backgroundColor: attendant.isActive ? '#d4edda' : '#f8d7da',
                color: attendant.isActive ? '#155724' : '#721c24',
                borderRadius: '4px',
                marginTop: '0.25rem',
                fontWeight: '500'
              }}>
                {attendant.isActive ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div>
          {/* Estatísticas */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Estatísticas</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Total de pedidos processados:</span>
                <strong>{attendant.orderCount || 0}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Data de cadastro:</span>
                <strong>{formatDate(attendant.createdAt)}</strong>
              </div>
              {attendant.lastLogin && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Último acesso:</span>
                  <strong>{formatDate(attendant.lastLogin)}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Permissões */}
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginBottom: '1rem' }}>Permissões</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {attendant.permissions && attendant.permissions.length > 0 ? (
                attendant.permissions.map((permission, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem',
                    backgroundColor: '#e8f5e8',
                    borderRadius: '4px'
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      backgroundColor: '#27ae60',
                      borderRadius: '50%'
                    }}></div>
                    <span style={{ textTransform: 'capitalize' }}>
                      {permission.replace('_', ' ')}
                    </span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#6c757d', fontStyle: 'italic' }}>
                  Nenhuma permissão específica atribuída
                </div>
              )}
            </div>
          </div>

          {/* Alterar Senha */}
          <div className="card">
            <h3 style={{ marginBottom: '1rem' }}>Segurança</h3>
            
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="btn btn-primary"
              >
                <Lock size={16} />
                Alterar Senha
              </button>
            ) : (
              <form onSubmit={handlePasswordSubmit}>
                <div className="form-group">
                  <label className="form-label">Senha Atual</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Digite sua senha atual"
                      required
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6c757d'
                      }}
                    >
                      {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nova Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords.new ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Digite a nova senha"
                      required
                      minLength={6}
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6c757d'
                      }}
                    >
                      {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirmar Nova Senha</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPasswords.confirm ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="form-control"
                      placeholder="Confirme a nova senha"
                      required
                      minLength={6}
                      style={{ paddingRight: '3rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6c757d'
                      }}
                    >
                      {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-success"
                  >
                    <Save size={16} />
                    {loading ? 'Salvando...' : 'Salvar Senha'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false)
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      })
                    }}
                    className="btn btn-secondary"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile