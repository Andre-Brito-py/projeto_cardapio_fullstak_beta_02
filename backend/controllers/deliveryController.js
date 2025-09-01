import distanceService from '../services/distanceService.js';

// Calcular taxa de entrega baseada no endereço
const calculateDeliveryFee = async (req, res) => {
    try {
        const { address } = req.body;

        // Validar se o endereço foi fornecido
        if (!address) {
            return res.json({
                success: false,
                message: "Endereço é obrigatório"
            });
        }

        // Normalizar endereço
        const normalizedAddress = distanceService.normalizeAddress(address);

        // Validar se o endereço está completo
        if (!distanceService.validateAddress(normalizedAddress)) {
            return res.json({
                success: false,
                message: "Endereço inválido. Verifique se rua, cidade e estado estão corretos e completos."
            });
        }

        // Validar área de entrega (verificar se não é área restrita)
        const areaValidation = await distanceService.validateDeliveryArea(normalizedAddress);
        if (!areaValidation.success) {
            return res.json({
                success: false,
                message: areaValidation.error
            });
        }

        // Calcular distância e taxa de entrega
        const result = await distanceService.calculateDistanceAndFee(normalizedAddress);

        if (!result.success) {
            return res.json({
                success: false,
                message: result.error
            });
        }

        res.json({
            success: true,
            data: {
                distance: result.distance,
                duration: result.duration,
                deliveryFee: result.deliveryFee,
                maxDistance: result.maxDistance,
                warning: areaValidation.warning
            }
        });

    } catch (error) {
        console.error('Erro ao calcular taxa de entrega:', error);
        res.json({
            success: false,
            message: "Erro ao calcular taxa de entrega"
        });
    }
};

// Verificar se um endereço está dentro da área de entrega
const checkDeliveryArea = async (req, res) => {
    try {
        const { address } = req.body;

        if (!address) {
            return res.json({
                success: false,
                message: "Endereço é obrigatório"
            });
        }

        // Normalizar endereço
        const normalizedAddress = distanceService.normalizeAddress(address);

        if (!distanceService.validateAddress(normalizedAddress)) {
            return res.json({
                success: false,
                message: "Endereço inválido. Verifique se rua, cidade e estado estão corretos e completos."
            });
        }

        // Validar área de entrega (verificar se não é área restrita)
        const areaValidation = await distanceService.validateDeliveryArea(normalizedAddress);
        if (!areaValidation.success) {
            return res.json({
                success: false,
                message: areaValidation.error,
                isDeliverable: false,
                isRestricted: areaValidation.isRestricted
            });
        }

        // Calcular apenas a distância
        const distanceResult = await distanceService.calculateDistance(normalizedAddress);
        
        if (!distanceResult.success) {
            return res.json({
                success: false,
                message: distanceResult.error,
                isDeliverable: false
            });
        }

        // Verificar se está dentro da área de entrega
        const feeResult = await distanceService.calculateDeliveryFee(distanceResult.distance.value);
        
        res.json({
            success: true,
            data: {
                distance: distanceResult.distance,
                duration: distanceResult.duration,
                isDeliverable: feeResult.success,
                maxDistance: feeResult.maxDistance,
                isRestricted: false,
                warning: areaValidation.warning
            }
        });

    } catch (error) {
        console.error('Erro ao verificar área de entrega:', error);
        res.json({
            success: false,
            message: "Erro ao verificar área de entrega",
            isDeliverable: false
        });
    }
};

// Obter informações de entrega (distância máxima, zonas, etc.)
const getDeliveryInfo = async (req, res) => {
    try {
        const settingsModel = (await import('../models/settingsModel.js')).default;
        const settings = await settingsModel.findOne();
        
        if (!settings) {
            return res.json({
                success: false,
                message: "Configurações não encontradas"
            });
        }

        res.json({
            success: true,
            data: {
                maxDeliveryDistance: settings.maxDeliveryDistance,
                deliveryZones: settings.deliveryZones || [],
                restaurantAddress: settings.restaurantAddress
            }
        });

    } catch (error) {
        console.error('Erro ao obter informações de entrega:', error);
        res.json({
            success: false,
            message: "Erro ao obter informações de entrega"
        });
    }
};

export { calculateDeliveryFee, checkDeliveryArea, getDeliveryInfo };