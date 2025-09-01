import { useContext, useState, useCallback, memo } from 'react'
import PropTypes from 'prop-types'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from './../context/StoreContext';
import axios from 'axios'

const LoginPopup = memo(({setShowLogin}) => {

    const {url, setToken} = useContext(StoreContext)

    const [currentState, setCurrentState] = useState('Entrar')
    const [data, setData] = useState({
        name:"",
        email:"",
        password:""
    })
    const [loading, setLoading] = useState(false)
    const [errors, setErrors] = useState({})
    const [showPassword, setShowPassword] = useState(false)

    const handleChange = useCallback((event) => {
        const name = event.target.name;
        const value = event.target.value;
        setData(data => ({...data, [name]: value}));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({...prev, [name]: ''}));
        }
    }, [errors]);

    const validateForm = useCallback(() => {
        const newErrors = {}
        
        if (currentState === 'Cadastrar' && !data.name.trim()) {
            newErrors.name = 'Nome é obrigatório'
        }
        
        if (!data.email.trim()) {
            newErrors.email = 'Email é obrigatório'
        } else if (!/\S+@\S+\.\S+/.test(data.email)) {
            newErrors.email = 'Email inválido'
        }
        
        if (!data.password.trim()) {
            newErrors.password = 'Senha é obrigatória'
        } else if (data.password.length < 6) {
            newErrors.password = 'Senha deve ter pelo menos 6 caracteres'
        }
        
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [currentState, data]);

    const onLogin = useCallback(async (event) => {
        event.preventDefault()
        
        if (!validateForm()) {
            return
        }
        
        setLoading(true)
        setErrors({})
        
        try {
            let newUrl = url;
            if(currentState==='Entrar'){
                newUrl+= "/api/user/login"
            }else{
                newUrl += "/api/user/register"
            }

            const response = await axios.post(newUrl, data);

            if(response.data.success){
                setToken(response.data.token);
                localStorage.setItem("token", response.data.token)
                setShowLogin(false);
            }else{
                setErrors({ general: response.data.message || 'Erro ao fazer login' })
            }
        } catch (error) {
            setErrors({ 
                general: error.response?.data?.message || 'Erro de conexão. Tente novamente.' 
            })
        } finally {
            setLoading(false)
        }
    }, [url, currentState, data, validateForm, setToken, setShowLogin])

  return (
    <div className='login-popup'>
        <form onSubmit={onLogin} className="login-popup-container">
            <div className="login-popup-title">
                <h2>{currentState}</h2>
                <img 
                    onClick={()=>setShowLogin(false)} 
                    src={assets.cross_icon} 
                    alt="Fechar"
                    className="close-btn"
                    style={{ cursor: 'pointer' }}
                />
            </div>
            <div className="login-popup-inputs">
                {currentState==='Entrar'?<></>: 
                    <div className="input-group">
                        <input 
                            name='name' 
                            onChange={handleChange} 
                            value={data.name} 
                            type="text" 
                            placeholder='Seu nome' 
                            className={errors.name ? 'error' : ''}
                            disabled={loading}
                        />
                        {errors.name && <span className="error-message">{errors.name}</span>}
                    </div>
                }
               
                <div className="input-group">
                    <input 
                        name='email' 
                        onChange={handleChange} 
                        value={data.email} 
                        type="email" 
                        placeholder='Seu email' 
                        className={errors.email ? 'error' : ''}
                        disabled={loading}
                    />
                    {errors.email && <span className="error-message">{errors.email}</span>}
                </div>
                
                <div className="input-group password-input-group">
                    <input 
                        name='password' 
                        onChange={handleChange} 
                        value={data.password} 
                        type={showPassword ? "text" : "password"} 
                        placeholder='Senha' 
                        className={errors.password ? 'error' : ''}
                        disabled={loading}
                    />
                    <button 
                        type="button" 
                        className="password-toggle-btn"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                        title={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    >
                        {showPassword ? "👁️" : "👁️‍🗨️"}
                    </button>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                </div>
            </div>

            {errors.general && <div className="error-message general-error">{errors.general}</div>}
            
            <button type='submit' disabled={loading} className={loading ? 'loading' : ''}>
                {loading ? 'Carregando...' : (currentState==='Cadastrar'?'Criar conta':'Entrar')}
            </button>
            <div className="login-popup-condition">
                <input type="checkbox" required />
                <p>Ao continuar, concordo com os termos de uso e política de privacidade</p>
            </div>
            {currentState==='Entrar'?
             <p>Criar uma nova conta? <span onClick={()=> setCurrentState('Cadastrar')} className="toggle-link">Clique aqui</span></p>
             :<p>Já tem uma conta? <span onClick={()=> setCurrentState('Entrar')} className="toggle-link">Entre aqui</span></p>}
            
            
        </form>
    </div>
  )
})

LoginPopup.displayName = 'LoginPopup';

LoginPopup.propTypes = {
  setShowLogin: PropTypes.func.isRequired
};

export default LoginPopup