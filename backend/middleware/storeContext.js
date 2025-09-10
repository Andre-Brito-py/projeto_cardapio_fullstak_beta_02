/**
 * Middleware para gerenciar contexto de múltiplas lojas
 * Identifica a loja baseada em diferentes critérios e injeta o contexto na requisição
 */

import logger from '../utils/logger.js';
import Store from '../models/storeModel.js';

class StoreContextManager {
    constructor() {
        this.storeCache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutos
    }

    /**
     * Middleware principal para identificar contexto da loja
     */
    async identifyStore(req, res, next) {
        try {
            let storeId = null;
            let identificationMethod = 'unknown';

            // Método 1: Header personalizado
            if (req.headers['x-store-id']) {
                storeId = parseInt(req.headers['x-store-id']);
                identificationMethod = 'header';
            }
            // Método 2: Parâmetro na URL
            else if (req.params.storeId) {
                storeId = parseInt(req.params.storeId);
                identificationMethod = 'url_param';
            }
            // Método 3: Query parameter
            else if (req.query.storeId) {
                storeId = parseInt(req.query.storeId);
                identificationMethod = 'query_param';
            }
            // Método 4: Subdomain (ex: loja1.pedai.com)
            else if (req.headers.host) {
                const subdomain = this.extractSubdomain(req.headers.host);
                if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
                    const store = await this.findStoreBySubdomain(subdomain);
                    if (store) {
                        storeId = store.id;
                        identificationMethod = 'subdomain';
                    }
                }
            }
            // Método 5: WhatsApp Phone Number (para webhooks)
            else if (req.body?.entry?.[0]?.changes?.[0]?.value?.metadata?.phone_number_id) {
                const phoneNumberId = req.body.entry[0].changes[0].value.metadata.phone_number_id;
                const store = await this.findStoreByPhoneNumberId(phoneNumberId);
                if (store) {
                    storeId = store.id;
                    identificationMethod = 'whatsapp_phone';
                }
            }
            // Método 6: Token de autenticação
            else if (req.headers.authorization) {
                const token = req.headers.authorization.replace('Bearer ', '');
                const store = await this.findStoreByToken(token);
                if (store) {
                    storeId = store.id;
                    identificationMethod = 'auth_token';
                }
            }

            // Se não conseguiu identificar, usar loja padrão
            if (!storeId) {
                storeId = await this.getDefaultStoreId();
                identificationMethod = 'default';
            }

            // Buscar dados completos da loja
            const storeData = await this.getStoreData(storeId);
            
            if (!storeData) {
                logger.error(`Loja não encontrada: ${storeId}`);
                return res.status(404).json({
                    error: 'Store not found',
                    storeId
                });
            }

            // Injetar contexto na requisição
            req.storeContext = {
                storeId: storeData.id,
                storeName: storeData.name,
                storeSlug: storeData.slug,
                storeConfig: storeData.config || {},
                identificationMethod,
                timestamp: new Date()
            };

            // Log da identificação
            logger.info('Store context identified:', {
                storeId: storeData.id,
                storeName: storeData.name,
                method: identificationMethod,
                userAgent: req.headers['user-agent']?.substring(0, 100)
            });

            next();

        } catch (error) {
            logger.error('Error in store context middleware:', error);
            
            // Em caso de erro, usar loja padrão
            try {
                const defaultStoreId = await this.getDefaultStoreId();
                const defaultStore = await this.getStoreData(defaultStoreId);
                
                req.storeContext = {
                    storeId: defaultStore.id,
                    storeName: defaultStore.name,
                    storeSlug: defaultStore.slug,
                    storeConfig: defaultStore.config || {},
                    identificationMethod: 'fallback',
                    timestamp: new Date(),
                    error: error.message
                };
                
                next();
            } catch (fallbackError) {
                logger.error('Error in fallback store context:', fallbackError);
                return res.status(500).json({
                    error: 'Unable to determine store context',
                    details: fallbackError.message
                });
            }
        }
    }

    /**
     * Extrair subdomain do host
     */
    extractSubdomain(host) {
        const parts = host.split('.');
        if (parts.length > 2) {
            return parts[0];
        }
        return null;
    }

    /**
     * Buscar loja por subdomain
     */
    async findStoreBySubdomain(subdomain) {
        try {
            const cacheKey = `subdomain:${subdomain}`;
            
            if (this.storeCache.has(cacheKey)) {
                const cached = this.storeCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const store = await Store.findOne({ 
                where: { 
                    subdomain: subdomain,
                    active: true 
                } 
            });

            if (store) {
                this.storeCache.set(cacheKey, {
                    data: store,
                    timestamp: Date.now()
                });
            }

            return store;
        } catch (error) {
            logger.error('Error finding store by subdomain:', error);
            return null;
        }
    }

    /**
     * Buscar loja por WhatsApp Phone Number ID
     */
    async findStoreByPhoneNumberId(phoneNumberId) {
        try {
            const cacheKey = `phone:${phoneNumberId}`;
            
            if (this.storeCache.has(cacheKey)) {
                const cached = this.storeCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const store = await Store.findOne({ 
                where: { 
                    whatsapp_phone_number_id: phoneNumberId,
                    active: true 
                } 
            });

            if (store) {
                this.storeCache.set(cacheKey, {
                    data: store,
                    timestamp: Date.now()
                });
            }

            return store;
        } catch (error) {
            logger.error('Error finding store by phone number ID:', error);
            return null;
        }
    }

    /**
     * Buscar loja por token de autenticação
     */
    async findStoreByToken(token) {
        try {
            const cacheKey = `token:${token.substring(0, 10)}`; // Cache parcial por segurança
            
            if (this.storeCache.has(cacheKey)) {
                const cached = this.storeCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const store = await Store.findOne({ 
                where: { 
                    api_token: token,
                    active: true 
                } 
            });

            if (store) {
                this.storeCache.set(cacheKey, {
                    data: store,
                    timestamp: Date.now()
                });
            }

            return store;
        } catch (error) {
            logger.error('Error finding store by token:', error);
            return null;
        }
    }

    /**
     * Obter dados completos da loja
     */
    async getStoreData(storeId) {
        try {
            const cacheKey = `store:${storeId}`;
            
            if (this.storeCache.has(cacheKey)) {
                const cached = this.storeCache.get(cacheKey);
                if (Date.now() - cached.timestamp < this.cacheTimeout) {
                    return cached.data;
                }
            }

            const store = await Store.findById(storeId);

            if (store && store.active) {
                this.storeCache.set(cacheKey, {
                    data: store,
                    timestamp: Date.now()
                });
                return store;
            }

            return null;
        } catch (error) {
            logger.error('Error getting store data:', error);
            return null;
        }
    }

    /**
     * Obter ID da loja padrão
     */
    async getDefaultStoreId() {
        try {
            const defaultStore = await Store.findOne({
                where: { 
                    is_default: true,
                    active: true 
                }
            });

            if (defaultStore) {
                return defaultStore.id;
            }

            // Se não há loja padrão, pegar a primeira ativa
            const firstStore = await Store.findOne({
                where: { active: true },
                order: [['id', 'ASC']]
            });

            return firstStore ? firstStore.id : 1; // Fallback para ID 1
        } catch (error) {
            logger.error('Error getting default store ID:', error);
            return 1; // Fallback hardcoded
        }
    }

    /**
     * Middleware para validar se a loja está ativa
     */
    async validateStoreActive(req, res, next) {
        try {
            if (!req.storeContext) {
                return res.status(400).json({
                    error: 'Store context not found'
                });
            }

            const store = await Store.findById(req.storeContext.storeId);
            
            if (!store || !store.active) {
                logger.warn('Attempt to access inactive store:', {
                    storeId: req.storeContext.storeId,
                    ip: req.ip
                });
                
                return res.status(403).json({
                    error: 'Store is not active',
                    storeId: req.storeContext.storeId
                });
            }

            next();
        } catch (error) {
            logger.error('Error validating store active:', error);
            return res.status(500).json({
                error: 'Error validating store status'
            });
        }
    }

    /**
     * Middleware para log de contexto (debug)
     */
    logStoreContext(req, res, next) {
        if (req.storeContext) {
            logger.debug('Store context:', {
                storeId: req.storeContext.storeId,
                storeName: req.storeContext.storeName,
                method: req.storeContext.identificationMethod,
                path: req.path,
                ip: req.ip
            });
        }
        next();
    }

    /**
     * Limpar cache
     */
    clearCache() {
        this.storeCache.clear();
        logger.info('Store context cache cleared');
    }

    /**
     * Obter estatísticas do cache
     */
    getCacheStats() {
        return {
            size: this.storeCache.size,
            timeout: this.cacheTimeout,
            keys: Array.from(this.storeCache.keys())
        };
    }
}

// Instância singleton
const storeContextManager = new StoreContextManager();

// Exportar middlewares
export const identifyStore = storeContextManager.identifyStore.bind(storeContextManager);
export const validateStoreActive = storeContextManager.validateStoreActive.bind(storeContextManager);
export const logStoreContext = storeContextManager.logStoreContext.bind(storeContextManager);

// Exportar manager para uso direto
export default storeContextManager;

// Utilitários para uso em controllers
export const getStoreContext = (req) => req.storeContext;
export const getStoreId = (req) => req.storeContext?.storeId;
export const getStoreName = (req) => req.storeContext?.storeName;
export const getStoreConfig = (req) => req.storeContext?.storeConfig || {};