import SystemSettings from '../models/systemSettingsModel.js';
import AsaasService from '../services/AsaasService.js';

/**
 * Buscar configurações de APIs
 */
export const getApiSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        
        // Retornar configurações sem expor as chaves completas
        const apiSettings = {
            // Google Maps
            googleMapsApiKey: settings.googleMapsApiKey ? '***' + settings.googleMapsApiKey.slice(-4) : '',
            googleMapsEnabled: settings.googleMapsEnabled || false,
            
            // Asaas
            asaasApiKey: settings.asaasApiKey ? '***' + settings.asaasApiKey.slice(-4) : '',
            asaasEnvironment: settings.asaasEnvironment || 'sandbox',
            asaasEnabled: settings.asaasEnabled || false,
            
            // Lisa AI Assistant
            lisaEnabled: settings.lisaEnabled || false,
            lisaOpenAiApiKey: settings.lisaOpenAiApiKey ? '***' + settings.lisaOpenAiApiKey.slice(-4) : '',
            lisaGroqApiKey: settings.lisaGroqApiKey ? '***' + settings.lisaGroqApiKey.slice(-4) : '',
            lisaChainlitSecret: settings.lisaChainlitSecret ? '***' + settings.lisaChainlitSecret.slice(-4) : '',
            lisaLiteralApiKey: settings.lisaLiteralApiKey ? '***' + settings.lisaLiteralApiKey.slice(-4) : '',
            lisaOllamaUrl: settings.lisaOllamaUrl || 'http://localhost:11434',
            lisaOllamaModel: settings.lisaOllamaModel || 'llama2',
            lisaPort: settings.lisaPort || '8000',
            lisaMaxFileSize: settings.lisaMaxFileSize || 10,
            
            // Configurações de frete
            shippingEnabled: settings.shippingEnabled !== false,
            freeShippingMinValue: settings.freeShippingMinValue || 50,
            baseShippingCost: settings.baseShippingCost || 5,
            costPerKm: settings.costPerKm || 2,
            
            // WhatsApp Business API
            whatsappEnabled: settings.whatsappEnabled || false,
            whatsappAccessToken: settings.whatsappAccessToken ? '***' + settings.whatsappAccessToken.slice(-4) : '',
            whatsappPhoneNumberId: settings.whatsappPhoneNumberId || '',
            whatsappWebhookVerifyToken: settings.whatsappWebhookVerifyToken ? '***' + settings.whatsappWebhookVerifyToken.slice(-4) : '',
            whatsappBusinessAccountId: settings.whatsappBusinessAccountId || ''
        };
        
        res.json({
            success: true,
            settings: apiSettings
        });
    } catch (error) {
        console.error('Erro ao buscar configurações de APIs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Atualizar configurações de APIs
 */
export const updateApiSettings = async (req, res) => {
    try {
        const {
            googleMapsApiKey,
            googleMapsEnabled,
            asaasApiKey,
            asaasEnvironment,
            asaasEnabled,
            lisaEnabled,
            lisaOpenAiApiKey,
            lisaGroqApiKey,
            lisaChainlitSecret,
            lisaLiteralApiKey,
            lisaOllamaUrl,
            lisaOllamaModel,
            lisaPort,
            lisaMaxFileSize,
            shippingEnabled,
            freeShippingMinValue,
            baseShippingCost,
            costPerKm,
            whatsappEnabled,
            whatsappAccessToken,
            whatsappPhoneNumberId,
            whatsappWebhookVerifyToken,
            whatsappBusinessAccountId
        } = req.body;
        
        const settings = await SystemSettings.getInstance();
        
        // Atualizar configurações do Google Maps
        if (googleMapsApiKey && !googleMapsApiKey.startsWith('***')) {
            settings.googleMapsApiKey = googleMapsApiKey;
        }
        settings.googleMapsEnabled = googleMapsEnabled;
        
        // Atualizar configurações do Asaas
        if (asaasApiKey && !asaasApiKey.startsWith('***')) {
            settings.asaasApiKey = asaasApiKey;
        }
        settings.asaasEnvironment = asaasEnvironment;
        settings.asaasEnabled = asaasEnabled;
        
        // Atualizar configurações da Lisa AI Assistant
        settings.lisaEnabled = lisaEnabled;
        if (lisaOpenAiApiKey && !lisaOpenAiApiKey.startsWith('***')) {
            settings.lisaOpenAiApiKey = lisaOpenAiApiKey;
        }
        if (lisaGroqApiKey && !lisaGroqApiKey.startsWith('***')) {
            settings.lisaGroqApiKey = lisaGroqApiKey;
        }
        if (lisaChainlitSecret && !lisaChainlitSecret.startsWith('***')) {
            settings.lisaChainlitSecret = lisaChainlitSecret;
        }
        if (lisaLiteralApiKey && !lisaLiteralApiKey.startsWith('***')) {
            settings.lisaLiteralApiKey = lisaLiteralApiKey;
        }
        settings.lisaOllamaUrl = lisaOllamaUrl || 'http://localhost:11434';
        settings.lisaOllamaModel = lisaOllamaModel || 'llama2';
        settings.lisaPort = lisaPort || '8000';
        settings.lisaMaxFileSize = parseInt(lisaMaxFileSize) || 10;
        
        // Atualizar configurações de frete
        settings.shippingEnabled = shippingEnabled;
        settings.freeShippingMinValue = parseFloat(freeShippingMinValue) || 50;
        settings.baseShippingCost = parseFloat(baseShippingCost) || 5;
        settings.costPerKm = parseFloat(costPerKm) || 2;
        
        // Atualizar configurações do WhatsApp Business API
        settings.whatsappEnabled = whatsappEnabled;
        if (whatsappAccessToken && !whatsappAccessToken.startsWith('***')) {
            settings.whatsappAccessToken = whatsappAccessToken;
        }
        settings.whatsappPhoneNumberId = whatsappPhoneNumberId;
        if (whatsappWebhookVerifyToken && !whatsappWebhookVerifyToken.startsWith('***')) {
            settings.whatsappWebhookVerifyToken = whatsappWebhookVerifyToken;
        }
        settings.whatsappBusinessAccountId = whatsappBusinessAccountId;
        
        await settings.save();
        
        // Se as configurações do Asaas foram alteradas, reinicializar o serviço
        if (asaasEnabled && (asaasApiKey || asaasEnvironment)) {
            try {
                await AsaasService.initialize();
            } catch (error) {
                console.error('Erro ao reinicializar Asaas Service:', error);
            }
        }
        
        res.json({
            success: true,
            message: 'Configurações atualizadas com sucesso'
        });
    } catch (error) {
        console.error('Erro ao atualizar configurações de APIs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Testar API do Google Maps
 */
export const testGoogleMapsApi = async (req, res) => {
    try {
        const { apiKey } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'Chave da API é obrigatória'
            });
        }
        
        // Testar a API com uma requisição simples de geocoding
        const testResponse = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=São Paulo, SP&key=${apiKey}`
        );
        
        const testData = await testResponse.json();
        
        if (testData.status === 'OK') {
            res.json({
                success: true,
                message: 'API do Google Maps funcionando corretamente'
            });
        } else if (testData.status === 'REQUEST_DENIED') {
            res.json({
                success: false,
                message: 'Chave da API inválida ou sem permissões necessárias'
            });
        } else if (testData.status === 'OVER_QUERY_LIMIT') {
            res.json({
                success: false,
                message: 'Limite de consultas excedido'
            });
        } else {
            res.json({
                success: false,
                message: `Erro na API: ${testData.status}`
            });
        }
    } catch (error) {
        console.error('Erro ao testar Google Maps API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao conectar com a API do Google Maps'
        });
    }
};

/**
 * Testar API do Asaas
 */
export const testAsaasApi = async (req, res) => {
    try {
        const { apiKey, environment } = req.body;
        
        if (!apiKey) {
            return res.status(400).json({
                success: false,
                message: 'Chave da API é obrigatória'
            });
        }
        
        // Determinar a URL base baseada no ambiente
        const baseURL = environment === 'production' 
            ? 'https://www.asaas.com/api/v3'
            : 'https://sandbox.asaas.com/api/v3';
        
        // Testar a API fazendo uma requisição para obter informações da conta
        const testResponse = await fetch(`${baseURL}/myAccount`, {
            method: 'GET',
            headers: {
                'access_token': apiKey,
                'Content-Type': 'application/json'
            }
        });
        
        const testData = await testResponse.json();
        
        if (testResponse.ok && testData.object === 'Account') {
            res.json({
                success: true,
                message: `API do Asaas funcionando corretamente (${environment})`
            });
        } else if (testResponse.status === 401) {
            res.json({
                success: false,
                message: 'Chave da API inválida'
            });
        } else if (testResponse.status === 403) {
            res.json({
                success: false,
                message: 'Acesso negado - verifique as permissões da API'
            });
        } else {
            res.json({
                success: false,
                message: `Erro na API: ${testData.errors?.[0]?.description || 'Erro desconhecido'}`
            });
        }
    } catch (error) {
        console.error('Erro ao testar Asaas API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao conectar com a API do Asaas'
        });
    }
};

/**
 * Testar API da Lisa AI Assistant
 */
export const testLisaApi = async (req, res) => {
    try {
        const {
            openAiApiKey,
            groqApiKey,
            chainlitSecret,
            literalApiKey,
            ollamaUrl,
            ollamaModel,
            port
        } = req.body;
        
        if (!openAiApiKey && !groqApiKey) {
            return res.status(400).json({
                success: false,
                message: 'Pelo menos uma chave de API (OpenAI ou Groq) é obrigatória'
            });
        }
        
        let testResults = [];
        
        // Testar OpenAI API se fornecida
        if (openAiApiKey) {
            try {
                const openAiResponse = await fetch('https://api.openai.com/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${openAiApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (openAiResponse.ok) {
                    testResults.push('✅ OpenAI API: Funcionando');
                } else {
                    testResults.push('❌ OpenAI API: Chave inválida');
                }
            } catch (error) {
                testResults.push('❌ OpenAI API: Erro de conexão');
            }
        }
        
        // Testar Groq API se fornecida
        if (groqApiKey) {
            try {
                const groqResponse = await fetch('https://api.groq.com/openai/v1/models', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${groqApiKey}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (groqResponse.ok) {
                    testResults.push('✅ Groq API: Funcionando');
                } else {
                    testResults.push('❌ Groq API: Chave inválida');
                }
            } catch (error) {
                testResults.push('❌ Groq API: Erro de conexão');
            }
        }
        
        // Testar conexão com Ollama se URL fornecida
        if (ollamaUrl) {
            try {
                const ollamaResponse = await fetch(`${ollamaUrl}/api/tags`, {
                    method: 'GET'
                });
                
                if (ollamaResponse.ok) {
                    testResults.push('✅ Ollama: Conectado');
                } else {
                    testResults.push('❌ Ollama: Não conectado');
                }
            } catch (error) {
                testResults.push('❌ Ollama: Erro de conexão');
            }
        }
        
        const allTestsPassed = testResults.every(result => result.includes('✅'));
        
        res.json({
            success: allTestsPassed,
            message: allTestsPassed 
                ? 'Todas as configurações da Lisa estão funcionando corretamente!' 
                : 'Algumas configurações apresentaram problemas',
            details: testResults
        });
        
    } catch (error) {
        console.error('Erro ao testar Lisa API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar configurações da Lisa AI'
        });
    }
};

/**
 * Testar WhatsApp Business API
 */
export const testWhatsAppApi = async (req, res) => {
    try {
        const { accessToken, phoneNumberId, businessAccountId } = req.body;
        
        if (!accessToken || !phoneNumberId) {
            return res.status(400).json({
                success: false,
                message: 'Access Token e Phone Number ID são obrigatórios'
            });
        }
        
        // Testar se o token tem acesso ao phone number
        const phoneResponse = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!phoneResponse.ok) {
            const error = await phoneResponse.json();
            return res.json({
                success: false,
                message: 'Erro ao acessar Phone Number ID',
                details: error.error?.message || 'Token inválido ou sem permissões'
            });
        }
        
        const phoneData = await phoneResponse.json();
        
        // Se Business Account ID foi fornecido, testar acesso
        let businessAccountStatus = 'Não testado';
        if (businessAccountId) {
            try {
                const businessResponse = await fetch(`https://graph.facebook.com/v18.0/${businessAccountId}`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });
                
                if (businessResponse.ok) {
                    businessAccountStatus = '✅ Acesso confirmado';
                } else {
                    businessAccountStatus = '❌ Sem acesso';
                }
            } catch (error) {
                businessAccountStatus = '❌ Erro de conexão';
            }
        }
        
        res.json({
            success: true,
            message: 'WhatsApp Business API configurado corretamente!',
            details: {
                phoneNumber: phoneData.display_phone_number || phoneData.id,
                phoneNumberId: phoneData.id,
                businessAccount: businessAccountStatus
            }
        });
        
    } catch (error) {
        console.error('Erro ao testar WhatsApp API:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao testar WhatsApp Business API'
        });
    }
};

/**
 * Obter status das APIs
 */
export const getApiStatus = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        
        const status = {
            googleMaps: {
                configured: !!settings.googleMapsApiKey,
                enabled: settings.googleMapsEnabled || false
            },
            asaas: {
                configured: !!settings.asaasApiKey,
                enabled: settings.asaasEnabled || false,
                environment: settings.asaasEnvironment || 'sandbox'
            },
            lisa: {
                configured: !!(settings.lisaOpenAiApiKey || settings.lisaGroqApiKey),
                enabled: settings.lisaEnabled || false,
                openAiConfigured: !!settings.lisaOpenAiApiKey,
                groqConfigured: !!settings.lisaGroqApiKey,
                chainlitConfigured: !!settings.lisaChainlitSecret,
                literalConfigured: !!settings.lisaLiteralApiKey
            },
            whatsapp: {
                configured: !!(settings.whatsappAccessToken && settings.whatsappPhoneNumberId),
                enabled: settings.whatsappEnabled || false,
                phoneNumberConfigured: !!settings.whatsappPhoneNumberId,
                accessTokenConfigured: !!settings.whatsappAccessToken,
                webhookConfigured: !!settings.whatsappWebhookVerifyToken
            }
        };
        
        res.json({
            success: true,
            status
        });
    } catch (error) {
        console.error('Erro ao obter status das APIs:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};