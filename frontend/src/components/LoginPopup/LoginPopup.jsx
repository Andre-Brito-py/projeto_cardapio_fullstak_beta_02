import React, {  useContext, useState } from 'react'
import './LoginPopup.css'
import { assets } from '../../assets/assets'
import { StoreContext } from './../context/StoreContext';
import axios from 'axios'

const LoginPopup = ({setShowLogin}) => {

    const {url, setToken} = useContext(StoreContext)

    const [currentState, setCurrentState] = useState('Entrar')
    const [data, setData] = useState({
        name:"",
        email:"",
        password:""
    })

    const onChangeHandler = (event) =>{
        const name = event.target.name
        const value = event.target.value 
        setData(data=>({...data,[name]:value}))
    }

   const onLogin = async (event) =>{
        event.preventDefault()
        let newUrl = url;
        if(currentState==='Entrar'){
            newUrl+= "/api/user/login"
        }else{
            newUrl += "/api/user/register"
        }

        const response = await axios.post(newUrl,data);

        if(response.data.success){
            setToken(response.data.token);
            localStorage.setItem("token", response.data.token)
            setShowLogin(false);
        }else{
            alert(response.data.message);
        }
   }

  return (
    <div className='login-popup'>
        <form onSubmit={onLogin} className="login-popup-container">
            <div className="login-popup-title">
                <h2>{currentState}</h2>
                <img onClick={()=>setShowLogin(false)} src={assets.cross_icon} alt="" />
            </div>
            <div className="login-popup-inputs">
                {currentState==='Entrar'?<></>: <input name='name' onChange={onChangeHandler} value={data.name} type="text" placeholder='Seu nome' required />}
               
                <input name='email' onChange={onChangeHandler} value={data.email} type="email" placeholder='Seu email' required />
                <input name='password' onChange={onChangeHandler} value={data.password} type="password" placeholder='Senha' required />
            </div>

            <button type='submit'>{currentState==='Cadastrar'?'Criar conta':'Entrar'}</button>
            <div className="login-popup-condition">
                <input type="checkbox" required />
                <p>Ao continuar, concordo com os termos de uso e política de privacidade</p>
            </div>
            {currentState==='Entrar'?
             <p>Criar uma nova conta? <span onClick={()=> setCurrentState('Cadastrar')}>Clique aqui</span></p>
             :<p>Já tem uma conta? <span onClick={()=> setCurrentState('Entrar')}>Entre aqui</span></p>}
            
            
        </form>
    </div>
  )
}

export default LoginPopup