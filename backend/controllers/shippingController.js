import shippingService from '../services/shippingService.js';
import Store from '../models/storeModel.js';
import SystemSettings from '../models/systemSettingsModel.js';

// Calcular frete para um endereço
const calculateShipping = async (req, res) => {
    try {
        const { address } = req.body;
        const storeId = req.store ? req.store._id : req.body.storeId;

        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        if (!address) {
            return res.json({
                success: false,
                message: 'Endereço é obrigatório'
            });
        }

        // Validar endereço
        try {
            shippingService.validateAddress(address);
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            });
        }

        // Calcular frete
        const shippingData = await shippingService.calculateShippingFee(storeId, address);

        res.json({
            success: true,
            data: shippingData
        });

    } catch (error) {
        console.error('Erro ao calcular frete:', error);
        res.json({
            success: false,
            message: error.message || 'Erro interno do servidor'
        });
    }
};

// Verificar se o endereço está na área de entrega
const checkDeliveryArea = async (req, res) => {
    try {
        const { address } = req.body;
        const storeId = req.store ? req.store._id : req.body.storeId;

        if (!storeId || !address) {
            return res.json({
                success: false,
                message: 'ID da loja e endereço são obrigatórios'
            });
        }

        // Validar endereço
        try {
            shippingService.validateAddress(address);
        } catch (error) {
            return res.json({
                success: false,
                message: error.message
            });
        }

        // Calcular distância
        const distanceData = await shippingService.calculateDistance(storeId, address);
        
        // Verificar limites da loja
        const store = await Store.findById(storeId);
        const maxDistance = store.settings.maxDeliveryDistance || 10;
        
        const isInDeliveryArea = distanceData.distance <= maxDistance;

        res.json({
            success: true,
            data: {
                isInDeliveryArea,
                distance: distanceData.distance,
                maxDistance,
                distanceText: distanceData.distanceText,
                durationText: distanceData.durationText
            }
        });

    } catch (error) {
        console.error('Erro ao verificar área de entrega:', error);
        res.json({
            success: false,
            message: error.message || 'Erro interno do servidor'
        });
    }
};

// Obter configurações de entrega da loja
const getDeliverySettings = async (req, res) => {
    try {
        const storeId = req.store ? req.store._id : req.params.storeId;

        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        res.json({
            success: true,
            data: {
                maxDeliveryDistance: store.settings.maxDeliveryDistance || 10,
                deliveryZones: store.settings.deliveryZones || [],
                storeAddress: store.settings.address,
                restaurantAddress: store.settings.restaurantAddress
            }
        });

    } catch (error) {
        console.error('Erro ao obter configurações de entrega:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Atualizar configurações de entrega da loja
const updateDeliverySettings = async (req, res) => {
    try {
        const storeId = req.store ? req.store._id : req.params.storeId;
        const { maxDeliveryDistance, deliveryZones } = req.body;

        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        // Verificar permissões
        if (req.user.role !== 'super_admin' && req.user.storeId.toString() !== storeId) {
            return res.json({
                success: false,
                message: 'Sem permissão para editar esta loja'
            });
        }

        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({
                success: false,
                message: 'Loja não encontrada'
            });
        }

        // Atualizar configurações
        if (maxDeliveryDistance !== undefined) {
            store.settings.maxDeliveryDistance = maxDeliveryDistance;
        }

        if (deliveryZones !== undefined) {
            store.settings.deliveryZones = deliveryZones;
        }

        await store.save();

        res.json({
            success: true,
            message: 'Configurações de entrega atualizadas com sucesso'
        });

    } catch (error) {
        console.error('Erro ao atualizar configurações de entrega:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// Verificar status da API do Google Maps
const checkGoogleMapsStatus = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        const hasApiKey = !!settings.googleMapsApiKey;

        if (!hasApiKey) {
            return res.json({
                success: false,
                message: 'Chave da API do Google Maps não configurada',
                data: { configured: false }
            });
        }

        // Testar a API com uma requisição simples
        try {
            const testResponse = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?address=São Paulo, SP&key=${settings.googleMapsApiKey}`
            );
            const testData = await testResponse.json();

            if (testData.status === 'OK') {
                res.json({
                    success: true,
                    message: 'API do Google Maps configurada e funcionando',
                    data: { configured: true, working: true }
                });
            } else {
                res.json({
                    success: false,
                    message: `Erro na API do Google Maps: ${testData.status}`,
                    data: { configured: true, working: false }
                });
            }
        } catch (error) {
            res.json({
                success: false,
                message: 'Erro ao testar API do Google Maps',
                data: { configured: true, working: false }
            });
        }

    } catch (error) {
        console.error('Erro ao verificar status do Google Maps:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

export {
    calculateShipping,
    checkDeliveryArea,
    getDeliverySettings,
    updateDeliverySettings,
    checkGoogleMapsStatus
};