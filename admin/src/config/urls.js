// Configuração centralizada de URLs para evitar hardcoding
// Este arquivo deve ser atualizado quando as portas mudarem

const URLS = {
  // URLs de desenvolvimento
  FRONTEND_URL: 'http://localhost:5173', // Frontend onde roda a aplicação do cliente e garçom
  ADMIN_URL: 'http://localhost:5174',    // Admin onde roda o painel administrativo
  BACKEND_URL: 'http://localhost:4001',  // Backend API
  
  // URLs de produção (para quando a aplicação for para produção)
  PRODUCTION: {
    FRONTEND_URL: import.meta.env?.VITE_FRONTEND_URL || 'http://localhost:5173',
    ADMIN_URL: import.meta.env?.VITE_ADMIN_URL || 'http://localhost:5174',
    BACKEND_URL: import.meta.env?.VITE_BACKEND_URL || 'http://localhost:4001'
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
