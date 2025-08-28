// Configuração centralizada de URLs para evitar hardcoding
// Este arquivo deve ser atualizado quando as portas mudarem

const URLS = {
  // URLs de desenvolvimento
  FRONTEND_URL: 'http://localhost:5173',
  ADMIN_URL: 'http://localhost:5174',
  BACKEND_URL: 'http://localhost:4000',
  
  // URLs de produção (para quando a aplicação for para produção)
  PRODUCTION: {
    FRONTEND_URL: import.meta.env?.VITE_FRONTEND_URL || 'https://your-frontend-domain.com',
    ADMIN_URL: import.meta.env?.VITE_ADMIN_URL || 'https://your-admin-domain.com',
    BACKEND_URL: import.meta.env?.VITE_BACKEND_URL || 'https://your-backend-domain.com'
  }
};

// Função para obter a URL correta baseada no ambiente
export const getUrls = () => {
  const isProduction = import.meta.env?.MODE === 'production';
  return isProduction ? URLS.PRODUCTION : URLS;
};

// Exportar URLs individuais para facilitar o uso
export const { FRONTEND_URL, ADMIN_URL, BACKEND_URL } = getUrls();

export default URLS;