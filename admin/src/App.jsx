import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Login from './components/Login/Login'
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Categories from './pages/Categories/Categories';
import Edit from './pages/Edit/Edit';
import Settings from './pages/Settings/Settings';
import Banners from './pages/Banners/Banners';
import BluetoothPrint from './components/BluetoothPrint/BluetoothPrint';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const [token, setToken] = useState('');
  const url = 'http://localhost:4000';

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  if (!token) {
    return (
      <div>
        <ToastContainer/>
        <Login url={url} setToken={setToken} />
      </div>
    );
  }

  return (
    <div>
      <ToastContainer/>
      <Navbar logout={logout}/>
      <hr/>
      <div className="app-content">
        <Sidebar/>
        <Routes>
          <Route path='/add' element={<Add url={url} />} />
          <Route path='/list' element={<List url={url}/>} />
          <Route path='/categories' element={<Categories url={url}/>} />
          <Route path='/orders' element={<Orders url={url} token={token}/>} />
          <Route path='/edit/:id' element={<Edit url={url}/>} />
          <Route path='/settings' element={<Settings url={url}/>} />
          <Route path='/banners' element={<Banners url={url}/>} />
          <Route path='/bluetooth-print' element={<BluetoothPrint url={url} token={token}/>} />
        </Routes>
      </div>
    </div>
  )
}

export default App
