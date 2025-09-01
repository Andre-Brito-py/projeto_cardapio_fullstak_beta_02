// Configuração centralizada de URLs para o backend
// Este arquivo garante que os links sejam gerados corretamente sempre que o projeto for iniciado

const URLS = {
  // URLs de desenvolvimento
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5174', // Frontend onde roda a aplicação do cliente e garçom
  ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173',       // Admin onde roda o painel administrativo
  BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:4000',   // Backend API
  
  // URLs de produção (configuradas via variáveis de ambiente)
  PRODUCTION: {
    FRONTEND_URL: process.env.FRONTEND_URL || 'https://your-frontend-domain.com',
    ADMIN_URL: process.env.ADMIN_URL || 'https://your-admin-domain.com',
    BACKEND_URL: process.env.BACKEND_URL || 'https://your-backend-domain.com'
  }
};

// Função para obter a URL correta baseada no ambiente
export const getUrls = () => {
  const isProduction = process.env.NODE_ENV === 'production';
  return isProduction ? URLS.PRODUCTION : URLS;
};

// Exportar URLs individuais para facilitar o uso
export const { FRONTEND_URL, ADMIN_URL, BACKEND_URL } = getUrls();

// Função específica para gerar links de loja (sempre aponta para o frontend)
export const getStoreLink = (slug) => {
  return `${FRONTEND_URL}/loja/${slug}`;
};

// Função específica para gerar links de garçom (sempre aponta para o frontend)
export const getWaiterLink = (storeId, token, baseUrl = null) => {
  const finalBaseUrl = baseUrl || FRONTEND_URL;
  return `${finalBaseUrl}/waiter-order/${storeId}?token=${token}`;
};

// Função específica para gerar links de QR Code de mesa (sempre aponta para o frontend)
export const getTableQRLink = (storeId, tableId) => {
  return `${FRONTEND_URL}/menu/${storeId}?table=${tableId}`;
};

export default URLS;