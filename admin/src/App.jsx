import React, { useState, useEffect } from 'react'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import SuperAdminSidebar from './components/SuperAdminSidebar/SuperAdminSidebar'
import Login from './components/Login/Login'
import SuperAdminLogin from './components/SuperAdminLogin/SuperAdminLogin'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import Analytics from './pages/SuperAdmin/Analytics/Analytics';
import CustomerAnalytics from './pages/Analytics/Analytics';
import UserManagement from './pages/SuperAdmin/UserManagement/UserManagement';
import SuperAdminDashboard from './pages/SuperAdmin/Dashboard/SuperAdminDashboard';
import StoreLinks from './pages/StoreLinks/StoreLinks';
import WaiterManagement from './pages/WaiterManagement/WaiterManagement';
import Customers from './pages/Customers/Customers';

import AsaasDashboard from './pages/AsaasDashboard/AsaasDashboard';
import ApiManagement from './pages/SuperAdmin/ApiManagement/ApiManagement';
import SystemLogs from './pages/SuperAdmin/SystemLogs/SystemLogs';
import StockManagement from './pages/StockManagement/StockManagement';
import WhatsAppSettings from './pages/WhatsAppSettings/WhatsAppSettings';
import WhatsAppMessages from './pages/WhatsAppMessages/WhatsAppMessages';
import OrderStats from './pages/OrderStats/OrderStats';
import PaymentStats from './pages/PaymentStats/PaymentStats';
import CounterAttendants from './pages/CounterAttendants/CounterAttendants';
import PaymentSettings from './pages/Settings/PaymentSettings';
import LizaChat from './pages/LizaChat/LizaChat';
import Cashback from './pages/Cashback/Cashback';
import ProductSuggestions from './pages/ProductSuggestions/ProductSuggestions';

import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { BACKEND_URL } from './config/urls';

const App = () => {
  const url = BACKEND_URL;
  const [token, setToken] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [showSuperAdminLogin, setShowSuperAdminLogin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const RequireSuperAdmin = ({ children }) => {
    const role = localStorage.getItem('userRole');
    const hasSuperToken = !!localStorage.getItem('superAdminToken');
    if (!token || role !== 'super_admin' || !hasSuperToken) {
      return <Navigate to='/' replace />;
    }
    return children;
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('superAdminToken') || localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (savedToken) {
      setToken(savedToken);
      setIsSuperAdmin(userRole === 'super_admin');
    }
  }, []);

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('superAdminToken');
    localStorage.removeItem('userRole');
    setToken('');
    setIsSuperAdmin(false);
    setShowSuperAdminLogin(false);
  };

  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
      return { hasError: true, error };
    }
    componentDidCatch(error, info) {
      console.error('Erro de renderização capturado:', error, info);
    }
    render() {
      if (this.state.hasError) {
        return (
          <div className="container-xl" style={{ padding: '2rem' }}>
            <div className="card">
              <div className="card-body">
                <h3>Ocorreu um erro ao carregar esta página</h3>
                <p>Tente voltar ao painel ou recarregar.</p>
                <div className="d-flex gap-2">
                  <a href={isSuperAdmin ? '/super-admin/dashboard' : '/add'} className="btn btn-primary">Ir para o painel</a>
                  <button className="btn btn-outline" onClick={() => window.location.reload()}>Recarregar</button>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return this.props.children;
    }
  }

  if (!token) {
    return (
      <ThemeProvider>
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div>
        <ToastContainer/>
        <Navbar 
          logout={logout} 
          isSuperAdmin={isSuperAdmin}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />
        <div className="app-content" data-testid="app-content">
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
          <div className="admin-main container-xl" data-testid="admin-main">
          <ErrorBoundary key={location.pathname}>
          <Routes>
          {/* Rotas do Super Admin */}
          <Route path='/super-admin/dashboard' element={<RequireSuperAdmin><SuperAdminDashboard url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/stores' element={<RequireSuperAdmin><StoreManagement url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/system-settings' element={<RequireSuperAdmin><SystemSettings url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/api-management' element={<RequireSuperAdmin><ApiManagement url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/analytics' element={<RequireSuperAdmin><Analytics url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/users' element={<RequireSuperAdmin><UserManagement url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/logs' element={<RequireSuperAdmin><SystemLogs url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/super-admin/asaas' element={<RequireSuperAdmin><AsaasDashboard url={url} token={token}/></RequireSuperAdmin>} />
          <Route path='/store-links' element={<StoreLinks token={token}/>} />
          
          {/* Rotas normais do admin */}
          <Route path='/add' element={<Add url={url} />} />
          <Route path='/list' element={<List url={url}/>} />
          <Route path='/categories' element={<Categories url={url}/>} />
          <Route path='/product-suggestions' element={<ProductSuggestions url={url} token={token}/>} />

          <Route path='/orders' element={<Orders url={url} token={token}/>} />
          <Route path='/order-stats' element={<OrderStats url={url} token={token}/>} />
          <Route path='/payment-stats' element={<PaymentStats url={url} token={token}/>} />
          <Route path='/edit/:id' element={<Edit url={url}/>} />
          <Route path='/settings' element={<Settings url={url}/>} />
          <Route path='/payment-settings' element={<PaymentSettings url={url}/>} />
          <Route path='/banners' element={<Banners url={url}/>} />
          <Route path='/tables' element={<Tables url={url}/>} />
          <Route path='/coupons' element={<Coupons url={url}/>} />
          <Route path='/cashback' element={<Cashback url={url} token={token}/>} />
          <Route path='/customers' element={<Customers url={url} token={token}/>} />
          <Route path='/customer-analytics' element={<CustomerAnalytics url={url} token={token}/>} />
          <Route path='/waiter-management' element={<WaiterManagement url={url}/>} />

          <Route path='/bluetooth-print' element={<BluetoothPrint url={url} token={token}/>} />
          <Route path='/stock-management/:id' element={<StockManagement url={url}/>} />
          <Route path='/whatsapp-settings' element={<WhatsAppSettings url={url}/>} />
          <Route path='/whatsapp-messages' element={<WhatsAppMessages url={url}/>} />
          <Route path='/counter-attendants' element={<CounterAttendants url={url}/>} />
          <Route path='/liza-chat' element={<LizaChat url={url} token={token}/>} />
          
          {/* Rota padrão */}
          <Route path='/' element={isSuperAdmin ? <StoreManagement url={url} token={token}/> : <Add url={url} />} />
          <Route path='*' element={<Navigate to={isSuperAdmin ? '/super-admin/dashboard' : '/add'} replace />} />
          </Routes>
          </ErrorBoundary>
          </div>
      </div>
    </div>
  </ThemeProvider>
  )
}

export default App
