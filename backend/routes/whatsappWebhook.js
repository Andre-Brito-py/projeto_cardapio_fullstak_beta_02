import express from 'express';
import crypto from 'crypto';
import whatsappWebhookController from '../controllers/whatsappWebhookController.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, validateStoreActive } from '../middleware/storeContext.js';
// Rate limiting será implementado futuramente
// import rateLimitMiddleware from '../middleware/rateLimit.js';
import logger from '../utils/logger.js';
import Store from '../models/storeModel.js';

const router = express.Router();

// Middleware para logging de webhooks
const webhookLogger = (req, res, next) => {
    const startTime = Date.now();
    
    // Log da requisição
    logger.info('Webhook WhatsApp recebido:', {
        method: req.method,
        url: req.url,
        headers: {
            'user-agent': req.headers['user-agent'],
            'x-hub-signature-256': req.headers['x-hub-signature-256'],
            'x-store-id': req.headers['x-store-id']
        },
        body: req.method === 'POST' ? req.body : undefined
    });
    
    // Override do res.json para log da resposta
    const originalJson = res.json;
    res.json = function(data) {
        const duration = Date.now() - startTime;
        logger.info('Resposta do webhook:', {
            status: res.statusCode,
            duration: `${duration}ms`,
            response: data
        });
        return originalJson.call(this, data);
    };
    
    next();
};

// Middleware para validar assinatura do WhatsApp (opcional, mas recomendado)
const validateWhatsAppSignature = (req, res, next) => {
    try {
        const signature = req.headers['x-hub-signature-256'];
        
        // Se não há assinatura, pular validação (para desenvolvimento)
        if (!signature) {
            logger.warn('Webhook sem assinatura - modo desenvolvimento');
            return next();
        }
        
        const appSecret = process.env.WHATSAPP_APP_SECRET;
        
        if (!appSecret) {
            logger.warn('WHATSAPP_APP_SECRET não configurado - pulando validação');
            return next();
        }
        
        // Calcular assinatura esperada
        const expectedSignature = crypto
            .createHmac('sha256', appSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');
        
        const receivedSignature = signature.replace('sha256=', '');
        
        if (expectedSignature !== receivedSignature) {
            logger.error('Assinatura do webhook inválida');
            return res.status(401).json({ error: 'Assinatura inválida' });
        }
        
        next();
    } catch (error) {
        logger.error('Erro na validação da assinatura:', error);
        res.status(500).json({ error: 'Erro na validação' });
    }
};

// Middleware para extrair storeId de diferentes fontes
const extractStoreId = async (req, res, next) => {
    let storeId = req.headers['x-store-id'] || 
                  req.body.storeId || 
                  req.query.storeId;
    
    // Se não encontrou storeId, tentar extrair do webhook data
    if (!storeId && req.body.entry) {
        try {
            // Algumas implementações incluem storeId nos metadados
            const entry = req.body.entry[0];
            const changes = entry?.changes?.[0];
            const value = changes?.value;
            
            // Verificar se há storeId nos metadados
            storeId = value?.metadata?.store_id || 
                     value?.metadata?.storeId;
            
            // Como fallback, usar o phone_number_id para mapear a loja
            if (!storeId && value?.metadata?.phone_number_id) {
                const phoneNumberId = value.metadata.phone_number_id;
                storeId = await getStoreIdByPhoneNumber(phoneNumberId);
            }
        } catch (error) {
            logger.error('Erro ao extrair storeId do webhook:', error);
        }
    }
    
    if (storeId) {
        req.storeId = storeId;
        req.headers['x-store-id'] = storeId;
    }
    
    next();
};

// Função auxiliar para mapear phone_number_id para storeId
async function getStoreIdByPhoneNumber(phoneNumberId) {
    try {
        const store = await Store.findOne({
            'whatsappConfig.phoneNumberId': phoneNumberId
        });
        return store?._id?.toString();
    } catch (error) {
        logger.error('Erro ao buscar loja por phone number:', error);
        return null;
    }
}

// === ROTAS PÚBLICAS (sem autenticação) ===

/**
 * GET /webhook - Verificação do webhook
 * Usado pelo WhatsApp para verificar a URL do webhook
 */
router.get('/webhook', 
    webhookLogger,
    whatsappWebhookController.verifyWebhook
);

/**
 * POST /webhook - Receber mensagens
 * Endpoint principal para receber mensagens do WhatsApp
 */
router.post('/webhook',
    webhookLogger,
    extractStoreId,
    validateWhatsAppSignature,
    // Rate limiting será implementado futuramente
    // rateLimitMiddleware({
    //     windowMs: 1 * 60 * 1000, // 1 minuto
    //     max: 100, // máximo 100 requests por minuto por IP
    //     message: 'Muitas requisições do webhook'
    // }),
    whatsappWebhookController.receiveMessage
);

// === ROTAS PROTEGIDAS (com autenticação) ===

/**
 * POST /send - Enviar mensagem proativa
 * Permite enviar mensagens proativas para clientes
 */
router.post('/send',
    authMiddleware,
    identifyStore,
    validateStoreActive,
    // Rate limiting será implementado futuramente
    // rateLimitMiddleware({
    //     windowMs: 1 * 60 * 1000, // 1 minuto
    //     max: 30, // máximo 30 mensagens por minuto
    //     message: 'Limite de envio de mensagens excedido'
    // }),
    whatsappWebhookController.sendProactiveMessage
);

/**
 * GET /status/:storeId - Status da integração
 * Retorna status do serviço de integração para uma loja
 */
router.get('/status/:storeId',
    authMiddleware,
    whatsappWebhookController.getIntegrationStatus
);

/**
 * DELETE /cache/:storeId? - Limpar cache
 * Limpa cache do serviço de integração (útil para desenvolvimento)
 */
router.delete('/cache/:storeId?',
    authMiddleware,
    whatsappWebhookController.clearCache
);

// === ROTAS DE TESTE (apenas em desenvolvimento) ===

if (process.env.NODE_ENV === 'development') {
    /**
     * POST /test - Testar processamento de mensagem
     * Permite testar o processamento sem usar o WhatsApp real
     */
    router.post('/test',
        authMiddleware,
        async (req, res) => {
            try {
                const { storeId, message, from } = req.body;
                
                if (!storeId || !message || !from) {
                    return res.status(400).json({
                        error: 'storeId, message e from são obrigatórios'
                    });
                }
                
                // Simular webhook data
                const testWebhookData = {
                    entry: [{
                        changes: [{
                            value: {
                                messages: [{
                                    from: from,
                                    id: `test_${Date.now()}`,
                                    type: 'text',
                                    text: { body: message },
                                    timestamp: Math.floor(Date.now() / 1000).toString()
                                }]
                            }
                        }]
                    }]
                };
                
                // Processar mensagem
                await whatsappWebhookController.processMessageAsync(testWebhookData, storeId);
                
                res.json({
                    success: true,
                    message: 'Mensagem de teste processada',
                    data: testWebhookData
                });
                
            } catch (error) {
                logger.error('Erro no teste:', error);
                res.status(500).json({ error: 'Erro no teste' });
            }
        }
    );
    
    /**
     * GET /test/config - Verificar configurações
     * Mostra configurações atuais (sem dados sensíveis)
     */
    router.get('/test/config',
        authMiddleware,
        (req, res) => {
            const config = {
                node_env: process.env.NODE_ENV,
                whatsapp_verify_token_set: !!process.env.WHATSAPP_VERIFY_TOKEN,
                whatsapp_app_secret_set: !!process.env.WHATSAPP_APP_SECRET,
                backend_url: process.env.BACKEND_URL || 'http://localhost:3000'
            };
            
            res.json(config);
        }
    );
}

// === MIDDLEWARE DE TRATAMENTO DE ERROS ===

router.use((error, req, res, next) => {
    logger.error('Erro nas rotas do webhook WhatsApp:', error);
    
    // Se já foi enviada uma resposta, não fazer nada
    if (res.headersSent) {
        return next(error);
    }
    
    // Resposta de erro genérica
    res.status(500).json({
        error: 'Erro interno do servidor',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
});

export default router;