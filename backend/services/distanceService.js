import axios from 'axios';
import settingsModel from '../models/settingsModel.js';

class DistanceService {
    constructor() {
        this.baseUrl = 'https://maps.googleapis.com/maps/api/distancematrix/json';
    }

    /**
     * Calcula a distância entre o restaurante e o endereço de entrega
     * @param {Object} deliveryAddress - Endereço de entrega
     * @returns {Promise<Object>} - Resultado com distância e duração
     */
    async calculateDistance(deliveryAddress) {
        try {
            const settings = await settingsModel.findOne();
            
            if (!settings || !settings.googleMapsApiKey) {
                throw new Error('Google Maps API Key não configurada');
            }

            if (!settings.restaurantAddress || !settings.restaurantAddress.street) {
                throw new Error('Endereço do restaurante não configurado');
            }

            // Formatar endereços
            const origin = this.formatAddress(settings.restaurantAddress);
            const destination = this.formatAddress(deliveryAddress);

            // Fazer requisição para Google Maps Distance Matrix API
            const response = await axios.get(this.baseUrl, {
                params: {
                    origins: origin,
                    destinations: destination,
                    units: 'metric',
                    mode: 'driving',
                    language: 'pt-BR',
                    key: settings.googleMapsApiKey
                }
            });

            if (response.data.status !== 'OK') {
                throw new Error(`Erro na API do Google Maps: ${response.data.status}`);
            }

            const element = response.data.rows[0].elements[0];
            
            if (element.status !== 'OK') {
                throw new Error(`Não foi possível calcular a rota: ${element.status}`);
            }

            const distanceInKm = element.distance.value / 1000; // Converter metros para km
            const durationInMinutes = Math.ceil(element.duration.value / 60); // Converter segundos para minutos

            return {
                success: true,
                distance: {
                    value: distanceInKm,
                    text: element.distance.text
                },
                duration: {
                    value: durationInMinutes,
                    text: element.duration.text
                }
            };

        } catch (error) {
            console.error('Erro ao calcular distância:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calcula a taxa de entrega baseada na distância
     * @param {number} distanceInKm - Distância em quilômetros
     * @returns {Promise<Object>} - Taxa de entrega calculada
     */
    async calculateDeliveryFee(distanceInKm) {
        try {
            const settings = await settingsModel.findOne();
            
            if (!settings) {
                throw new Error('Configurações não encontradas');
            }

            // Verificar se a distância está dentro do limite de entrega
            if (distanceInKm > settings.maxDeliveryDistance) {
                return {
                    success: false,
                    error: `Entrega não disponível. Distância máxima: ${settings.maxDeliveryDistance}km`,
                    maxDistance: settings.maxDeliveryDistance
                };
            }

            // Calcular taxa baseada nas zonas de entrega
            let deliveryFee = 0;

            if (settings.deliveryZones && settings.deliveryZones.length > 0) {
                // Ordenar zonas por distância crescente
                const sortedZones = settings.deliveryZones.sort((a, b) => a.maxDistance - b.maxDistance);
                
                // Encontrar a zona apropriada
                for (const zone of sortedZones) {
                    if (distanceInKm <= zone.maxDistance) {
                        deliveryFee = zone.fee;
                        break;
                    }
                }
                
                // Se não encontrou zona apropriada, usar a taxa da última zona
                if (deliveryFee === 0 && sortedZones.length > 0) {
                    deliveryFee = sortedZones[sortedZones.length - 1].fee;
                }
            } else {
                // Se não há zonas configuradas, retornar erro
                return {
                    success: false,
                    error: 'Zonas de entrega não configuradas'
                };
            }

            return {
                success: true,
                fee: deliveryFee,
                distance: distanceInKm,
                maxDistance: settings.maxDeliveryDistance
            };

        } catch (error) {
            console.error('Erro ao calcular taxa de entrega:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Calcula distância e taxa de entrega em uma única operação
     * @param {Object} deliveryAddress - Endereço de entrega
     * @returns {Promise<Object>} - Resultado completo
     */
    async calculateDistanceAndFee(deliveryAddress) {
        try {
            // Calcular distância
            const distanceResult = await this.calculateDistance(deliveryAddress);
            
            if (!distanceResult.success) {
                return distanceResult;
            }

            // Calcular taxa de entrega
            const feeResult = await this.calculateDeliveryFee(distanceResult.distance.value);
            
            if (!feeResult.success) {
                return feeResult;
            }

            return {
                success: true,
                distance: distanceResult.distance,
                duration: distanceResult.duration,
                deliveryFee: feeResult.fee,
                maxDistance: feeResult.maxDistance
            };

        } catch (error) {
            console.error('Erro ao calcular distância e taxa:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Formatar endereço para a API do Google Maps
     * @param {Object} address - Objeto com dados do endereço
     * @returns {string} - Endereço formatado
     */
    formatAddress(address) {
        const parts = [];
        
        if (address.street) parts.push(address.street);
        if (address.city) parts.push(address.city);
        if (address.state) parts.push(address.state);
        if (address.zipCode) parts.push(address.zipCode);
        if (address.country) parts.push(address.country);
        
        return parts.join(', ');
    }

    /**
     * Validar se um endereço está completo
     * @param {Object} address - Endereço para validar
     * @returns {boolean} - True se válido
     */
    validateAddress(address) {
        if (!address || !address.street || !address.city || !address.state) {
            return false;
        }

        // Validar CEP brasileiro se fornecido
        if (address.zipCode && !this.validateBrazilianZipCode(address.zipCode)) {
            return false;
        }

        // Validar se não contém caracteres suspeitos
        const suspiciousPattern = /[<>"'&]/;
        if (suspiciousPattern.test(address.street) || 
            suspiciousPattern.test(address.city) || 
            suspiciousPattern.test(address.state)) {
            return false;
        }

        // Validar comprimento mínimo dos campos
        if (address.street.trim().length < 5 || 
            address.city.trim().length < 2 || 
            address.state.trim().length < 2) {
            return false;
        }

        return true;
    }

    /**
     * Validar CEP brasileiro
     * @param {string} zipCode - CEP para validar
     * @returns {boolean} - True se válido
     */
    validateBrazilianZipCode(zipCode) {
        if (!zipCode) return true; // CEP é opcional
        
        // Remover caracteres não numéricos
        const cleanZipCode = zipCode.replace(/\D/g, '');
        
        // CEP brasileiro deve ter 8 dígitos
        if (cleanZipCode.length !== 8) {
            return false;
        }
        
        // Verificar se não é um CEP inválido conhecido (todos os dígitos iguais)
        if (/^(\d)\1{7}$/.test(cleanZipCode)) {
            return false;
        }
        
        return true;
    }

    /**
     * Verificar se um endereço está dentro de áreas restritas
     * @param {Object} address - Endereço para verificar
     * @returns {Promise<Object>} - Resultado da verificação
     */
    async validateDeliveryArea(address) {
        try {
            const settings = await settingsModel.findOne();
            
            if (!settings) {
                return {
                    success: false,
                    error: 'Configurações não encontradas'
                };
            }

            // Lista de áreas restritas (pode ser configurável no futuro)
            const restrictedAreas = [
                'zona rural',
                'área de risco',
                'favela',
                'invasão'
            ];

            const addressText = this.formatAddress(address).toLowerCase();
            
            // Verificar se o endereço contém termos de áreas restritas
            for (const restrictedArea of restrictedAreas) {
                if (addressText.includes(restrictedArea)) {
                    return {
                        success: false,
                        error: `Entrega não disponível para ${restrictedArea}`,
                        isRestricted: true
                    };
                }
            }

            return {
                success: true,
                isRestricted: false
            };

        } catch (error) {
            console.error('Erro ao validar área de entrega:', error.message);
            return {
                success: true, // Em caso de erro, permite entrega
                isRestricted: false,
                warning: 'Não foi possível validar área restrita'
            };
        }
    }

    /**
     * Normalizar endereço para melhor precisão na API
     * @param {Object} address - Endereço para normalizar
     * @returns {Object} - Endereço normalizado
     */
    normalizeAddress(address) {
        const normalized = { ...address };
        
        // Normalizar estado (converter para sigla se necessário)
        const stateMap = {
            'acre': 'AC', 'alagoas': 'AL', 'amapá': 'AP', 'amazonas': 'AM',
            'bahia': 'BA', 'ceará': 'CE', 'distrito federal': 'DF', 'espírito santo': 'ES',
            'goiás': 'GO', 'maranhão': 'MA', 'mato grosso': 'MT', 'mato grosso do sul': 'MS',
            'minas gerais': 'MG', 'pará': 'PA', 'paraíba': 'PB', 'paraná': 'PR',
            'pernambuco': 'PE', 'piauí': 'PI', 'rio de janeiro': 'RJ', 'rio grande do norte': 'RN',
            'rio grande do sul': 'RS', 'rondônia': 'RO', 'roraima': 'RR', 'santa catarina': 'SC',
            'são paulo': 'SP', 'sergipe': 'SE', 'tocantins': 'TO'
        };
        
        const stateLower = normalized.state.toLowerCase();
        if (stateMap[stateLower]) {
            normalized.state = stateMap[stateLower];
        }
        
        // Normalizar CEP
        if (normalized.zipCode) {
            normalized.zipCode = normalized.zipCode.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2');
        }
        
        // Capitalizar primeira letra de cada palavra
        normalized.city = this.capitalizeWords(normalized.city);
        normalized.street = this.capitalizeWords(normalized.street);
        
        return normalized;
    }

    /**
     * Capitalizar primeira letra de cada palavra
     * @param {string} text - Texto para capitalizar
     * @returns {string} - Texto capitalizado
     */
    capitalizeWords(text) {
        return text.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    }
}

export default new DistanceService();