import React, { useState } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar/Navbar';
import { Route, Routes } from 'react-router-dom';
import Home from './pages/Home/Home';
import Cart from './pages/Cart/Cart';
import PlaceOrder from './pages/PlaceOrder/PlaceOrder';
import Footer from './components/Footer/Footer';
import LoginPopup from './components/LoginPopup/LoginPopup';
import Verify from './pages/Verify/Verify';
import MyOrders from './pages/MyOrders/MyOrders';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import StoreHome from './pages/StoreHome/StoreHome';
import StoreList from './components/StoreList/StoreList';

const App = () => {

  const [showLogin, setShowLogin] = useState(false);
  return (
    <HelmetProvider>
      {showLogin ? <LoginPopup setShowLogin={setShowLogin} /> : <></>}
      <div className='app'>
        <Navbar setShowLogin={setShowLogin} />
        <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/lojas' element={<StoreList />} />
          <Route path='/loja/:storeSlug' element={<StoreHome />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/order' element={<PlaceOrder />} />
          <Route path='/verify' element={<Verify />} />
          <Route path='/myorders' element={<MyOrders />} />
          <Route path='/product/:id' element={<ProductDetail />} />
        </Routes>
      </div>
      <Footer />
    </HelmetProvider>
  );
};

export default App;