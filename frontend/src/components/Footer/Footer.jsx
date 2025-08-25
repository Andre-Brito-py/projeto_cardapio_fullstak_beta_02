import React from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'

const Footer = () => {
  return (
    <div className='footer' id='footer'>
        <div className="footer-content">
            <div className="footer-content-left">
                <img src={assets.logo} alt="" />
                <p>Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta. Navegue por uma variedade de restaurantes, faça seu pedido e acompanhe em tempo real. Desfrute de comida quente e fresca sem sair de casa. Rápido, conveniente e fácil de usar.</p>
                <div className="footer-social-icons">
                    <img src={assets.facebook_icon} alt="" />
                    <img src={assets.twitter_icon} alt="" />
                    <img src={assets.linkedin_icon} alt="" />
                </div>
            </div>
            <div className="footer-content-center">
                <h2>EMPRESA</h2>
                <ul>
                    <li>Início</li>
                    <li>Sobre nós</li>
                    <li>Entrega</li>
                    <li>Política de Privacidade</li>
                </ul>
            </div>
            <div className="footer-content-right">
                <h2>ENTRE EM CONTATO</h2>
                <ul>
                    <li>+91 123456789</li>
                    <li>abc@gmail.com</li>
                </ul>
            </div>
           
        </div>
        <hr />
        <p className="footer-copyright">
            Copyright 2024 &copy; Tomato - Todos os Direitos Reservados.
        </p>
    </div>
  )
}

export default Footer