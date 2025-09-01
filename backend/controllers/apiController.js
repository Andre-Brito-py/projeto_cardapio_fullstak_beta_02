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
            
            // Configurações de frete
            shippingEnabled: settings.shippingEnabled !== false,
            freeShippingMinValue: settings.freeShippingMinValue || 50,
            baseShippingCost: settings.baseShippingCost || 5,
            costPerKm: settings.costPerKm || 2
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
            shippingEnabled,
            freeShippingMinValue,
            baseShippingCost,
            costPerKm
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
        
        // Atualizar configurações de frete
        settings.shippingEnabled = shippingEnabled;
        settings.freeShippingMinValue = parseFloat(freeShippingMinValue) || 50;
        settings.baseShippingCost = parseFloat(baseShippingCost) || 5;
        settings.costPerKm = parseFloat(costPerKm) || 2;
        
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