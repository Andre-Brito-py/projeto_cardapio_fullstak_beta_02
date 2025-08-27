import React from 'react'
import './Home.css'
import Header from '../../components/Header/Header'
import StoreList from '../../components/StoreList/StoreList'
import SEO from '../../components/SEO/SEO'

const Home = () => {

  return (
    <div>
      <SEO 
        title="Food Delivery - Peça comida online dos melhores restaurantes"
        description="Descubra os melhores restaurantes da sua região e peça comida online com entrega rápida. Variedade de pratos, preços justos e qualidade garantida."
        keywords="food delivery, comida online, restaurantes, pedidos, entrega, delivery"
      />
      <Header/>
      <StoreList/>
    </div>
  )
}

export default Home