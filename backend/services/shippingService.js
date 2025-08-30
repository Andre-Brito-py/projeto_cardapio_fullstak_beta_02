import SystemSettings from '../models/systemSettingsModel.js';
import Store from '../models/storeModel.js';

class ShippingService {
    constructor() {
        this.googleMapsApiKey = null;
    }

    // Inicializar o serviço com a chave da API
    async initialize() {
        try {
            const settings = await SystemSettings.getInstance();
            this.googleMapsApiKey = settings.googleMapsApiKey;
            return !!this.googleMapsApiKey;
        } catch (error) {
            console.error('Erro ao inicializar ShippingService:', error);
            return false;
        }
    }

    // Calcular distância usando Google Maps Distance Matrix API
    async calculateDistance(storeId, customerAddress) {
        try {
            // Verificar se a API está configurada
            if (!this.googleMapsApiKey) {
                const initialized = await this.initialize();
                if (!initialized) {
                    throw new Error('Chave da API do Google Maps não configurada');
                }
            }

            // Buscar endereço da loja
            const store = await Store.findById(storeId);
            if (!store || !store.settings.address) {
                throw new Error('Endereço da loja não encontrado');
            }

            // Construir endereços formatados
            const storeAddress = this.formatAddress(store.settings.address);
            const customerAddressFormatted = this.formatAddress(customerAddress);

            // Fazer requisição para Google Maps Distance Matrix API
            const response = await fetch(
                `https://maps.googleapis.com/maps/api/distancematrix/json?` +
                `origins=${encodeURIComponent(storeAddress)}&` +
                `destinations=${encodeURIComponent(customerAddressFormatted)}&` +
                `units=metric&` +
                `mode=driving&` +
                `key=${this.googleMapsApiKey}`
            );

            const data = await response.json();

            if (data.status !== 'OK') {
                throw new Error(`Erro na API do Google Maps: ${data.status}`);
            }

            const element = data.rows[0]?.elements[0];
            if (!element || element.status !== 'OK') {
                throw new Error('Não foi possível calcular a distância');
            }

            return {
                distance: element.distance.value / 1000, // Converter metros para quilômetros
                duration: element.duration.value / 60, // Converter segundos para minutos
                distanceText: element.distance.text,
                durationText: element.duration.text,
                googleMapsData: data
            };

        } catch (error) {
            console.error('Erro ao calcular distância:', error);
            throw error;
        }
    }

    // Calcular frete baseado na distância
    async calculateShippingFee(storeId, customerAddress) {
        try {
            // Calcular distância
            const distanceData = await this.calculateDistance(storeId, customerAddress);
            
            // Buscar configurações da loja
            const store = await Store.findById(storeId);
            if (!store) {
                throw new Error('Loja não encontrada');
            }

            // Verificar se está dentro da área de entrega
            const maxDistance = store.settings.maxDeliveryDistance || 10;
            if (distanceData.distance > maxDistance) {
                throw new Error(`Endereço fora da área de entrega. Distância máxima: ${maxDistance}km`);
            }

            // Calcular taxa baseada nas zonas de entrega
            let shippingFee = 0;
            const deliveryZones = store.settings.deliveryZones || [];
            
            if (deliveryZones.length > 0) {
                // Encontrar a zona apropriada
                const applicableZone = deliveryZones
                    .filter(zone => distanceData.distance <= zone.maxDistance)
                    .sort((a, b) => a.maxDistance - b.maxDistance)[0];
                
                if (applicableZone) {
                    shippingFee = applicableZone.fee;
                } else {
                    // Se não encontrar zona, usar a taxa da zona mais distante
                    const farthestZone = deliveryZones
                        .sort((a, b) => b.maxDistance - a.maxDistance)[0];
                    shippingFee = farthestZone ? farthestZone.fee : 5.00;
                }
            } else {
                // Taxa padrão baseada na distância (R$ 2,00 por km)
                shippingFee = Math.max(2.00, distanceData.distance * 2.00);
            }

            return {
                fee: Number(shippingFee.toFixed(2)),
                distance: distanceData.distance,
                duration: distanceData.duration,
                distanceText: distanceData.distanceText,
                durationText: distanceData.durationText,
                calculatedBy: 'google_maps',
                googleMapsData: distanceData.googleMapsData
            };

        } catch (error) {
            console.error('Erro ao calcular frete:', error);
            throw error;
        }
    }

    // Formatar endereço para a API do Google Maps
    formatAddress(address) {
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.number) parts.push(address.number);
        if (address.neighborhood) parts.push(address.neighborhood);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zipCode) parts.push(address.zipCode);
        
        return parts.join(', ');
    }

    // Validar endereço
    validateAddress(address) {
        const required = ['street', 'number', 'city', 'state', 'zipCode'];
        const missing = required.filter(field => !address[field]);
        
        if (missing.length > 0) {
            throw new Error(`Campos obrigatórios do endereço: ${missing.join(', ')}`);
        }
        
        return true;
    }

    // Calcular frete manual (fallback)
    calculateManualShipping(distance, deliveryZones = []) {
        if (deliveryZones.length > 0) {
            const applicableZone = deliveryZones
                .filter(zone => distance <= zone.maxDistance)
                .sort((a, b) => a.maxDistance - b.maxDistance)[0];
            
            if (applicableZone) {
                return {
                    fee: applicableZone.fee,
                    calculatedBy: 'zone'
                };
            }
        }
        
        // Taxa padrão
        return {
            fee: Math.max(2.00, distance * 2.00),
            calculatedBy: 'manual'
        };
    }
}

export default new ShippingService();