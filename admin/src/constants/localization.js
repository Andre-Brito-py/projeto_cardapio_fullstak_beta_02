// Constantes para idiomas e moedas suportados

export const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'pt-PT', name: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'en-US', name: 'English (United States)', flag: '🇺🇸' },
  { code: 'es-ES', name: 'Español (España)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'Français (France)', flag: '🇫🇷' },
  { code: 'it-IT', name: 'Italiano (Italia)', flag: '🇮🇹' },
  { code: 'de-DE', name: 'Deutsch (Deutschland)', flag: '🇩🇪' }
];

export const SUPPORTED_CURRENCIES = [
  { code: 'BRL', name: 'Real Brasileiro', symbol: 'R$', country: 'Brasil' },
  { code: 'USD', name: 'US Dollar', symbol: '$', country: 'United States' },
  { code: 'EUR', name: 'Euro', symbol: '€', country: 'European Union' },
  { code: 'GBP', name: 'British Pound', symbol: '£', country: 'United Kingdom' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', country: 'Canada' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', country: 'Australia' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', country: 'Japan' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', country: 'Switzerland' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', country: 'China' },
  { code: 'MXN', name: 'Mexican Peso', symbol: '$', country: 'Mexico' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$', country: 'Argentina' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$', country: 'Chile' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$', country: 'Colombia' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/', country: 'Peru' }
];

// Função para obter idioma por código
export const getLanguageByCode = (code) => {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
};

// Função para obter moeda por código
export const getCurrencyByCode = (code) => {
  return SUPPORTED_CURRENCIES.find(currency => currency.code === code);
};

// Combinações recomendadas de idioma/moeda por região
export const REGIONAL_DEFAULTS = {
  'pt-BR': { currency: 'BRL', timezone: 'America/Sao_Paulo' },
  'pt-PT': { currency: 'EUR', timezone: 'Europe/Lisbon' },
  'en-US': { currency: 'USD', timezone: 'America/New_York' },
  'es-ES': { currency: 'EUR', timezone: 'Europe/Madrid' },
  'fr-FR': { currency: 'EUR', timezone: 'Europe/Paris' },
  'it-IT': { currency: 'EUR', timezone: 'Europe/Rome' },
  'de-DE': { currency: 'EUR', timezone: 'Europe/Berlin' }
};

// Função para obter configurações padrão por idioma
export const getRegionalDefaults = (languageCode) => {
  return REGIONAL_DEFAULTS[languageCode] || REGIONAL_DEFAULTS['pt-BR'];
};