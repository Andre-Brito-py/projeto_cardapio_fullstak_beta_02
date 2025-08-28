import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import SuperAdminSidebar from './components/SuperAdminSidebar/SuperAdminSidebar'
import Login from './components/Login/Login'
import SuperAdminLogin from './components/SuperAdminLogin/SuperAdminLogin'
import { Routes, Route } from 'react-router-dom';
import Add from './pages/Add/Add';
import List from './pages/List/List';
import Orders from './pages/Orders/Orders';
import Categories from './pages/Categories/Categories';
import Edit from './pages/Edit/Edit';
import Settings from './pages/Settings/Settings';
import Banners from './pages/Banners/Banners';
import Tables from './pages/Tables/Tables';
import Coupons from './pages/Coupons/Coupons';
import BluetoothPrint from './components/BluetoothPrint/BluetoothPrint';
import StoreManagement from './pages/SuperAdmin/StoreManagement/StoreManagement';
import SystemSettings from './pages/SuperAdmin/SystemSettings/SystemSettings';
import StoreLinks from './pages/StoreLinks/StoreLinks';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const App = () => {
  const url = 'http://localhost:4000';
  const [token, setToken] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (savedToken) {
      setToken(savedToken);
      setIsSuperAdmin(userRole === 'super_admin');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    setToken('');
    setIsSuperAdmin(false);
    setShowSuperAdminLogin(false);
  };

  if (!token) {
    return (
      <div>
        <ToastContainer/>
        {showSuperAdminLogin ? (
          <div>
            <SuperAdminLogin url={url} setToken={setToken} setSuperAdmin={setIsSuperAdmin} />
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <button 
                onClick={() => setShowSuperAdminLogin(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Voltar para Login Normal
              </button>
            </div>
          </div>
        ) : (
          <div>
            <Login url={url} setToken={setToken} />
            <div style={{textAlign: 'center', marginTop: '20px'}}>
              <button 
                onClick={() => setShowSuperAdminLogin(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#667eea',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Acesso Super Admin
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <ToastContainer/>
      <Navbar 
        logout={logout} 
        isSuperAdmin={isSuperAdmin}
        onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />
      <hr/>
      <div className="app-content">
        {isSuperAdmin ? (
          <SuperAdminSidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        ) : (
          <Sidebar 
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />
        )}
        <Routes>
          {/* Rotas do Super Admin */}
          <Route path='/super-admin/stores' element={<StoreManagement url={url} token={token}/>} />
          <Route path='/super-admin/system-settings' element={<SystemSettings url={url} token={token}/>} />
          <Route path='/store-links' element={<StoreLinks url={url} token={token}/>} />
          
          {/* Rotas normais do admin */}
          <Route path='/add' element={<Add url={url} />} />
          <Route path='/list' element={<List url={url}/>} />
          <Route path='/categories' element={<Categories url={url}/>} />
          <Route path='/orders' element={<Orders url={url} token={token}/>} />
          <Route path='/edit/:id' element={<Edit url={url}/>} />
          <Route path='/settings' element={<Settings url={url}/>} />
          <Route path='/banners' element={<Banners url={url}/>} />
          <Route path='/tables' element={<Tables url={url}/>} />
          <Route path='/coupons' element={<Coupons url={url}/>} />
          <Route path='/bluetooth-print' element={<BluetoothPrint url={url} token={token}/>} />
          
          {/* Rota padrão */}
          <Route path='/' element={isSuperAdmin ? <StoreManagement url={url} token={token}/> : <Add url={url} />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
