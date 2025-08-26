import { useState, useCallback } from 'react';
import axios from 'axios';

const useDeliveryCalculation = (url) => {
    const [deliveryData, setDeliveryData] = useState({
        fee: 2, // Taxa padrão
        distance: null,
        duration: null,
        isCalculating: false,
        error: null,
        isDeliverable: true,
        warning: null
    });

    const calculateDeliveryFee = useCallback(async (address) => {
        if (!address || !address.street || !address.city || !address.state) {
            setDeliveryData(prev => ({
                ...prev,
                fee: 2, // Taxa padrão se endereço incompleto
                error: null,
                isDeliverable: true,
                warning: null
            }));
            return;
        }

        setDeliveryData(prev => ({
            ...prev,
            isCalculating: true,
            error: null
        }));

        try {
            const response = await axios.post(`${url}/api/delivery/calculate-fee`, {
                address: {
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode || '',
                    country: address.country || 'Brasil'
                }
            });

            if (response.data.success) {
                setDeliveryData({
                    fee: response.data.data.deliveryFee,
                    distance: response.data.data.distance,
                    duration: response.data.data.duration,
                    isCalculating: false,
                    error: null,
                    isDeliverable: true,
                    maxDistance: response.data.data.maxDistance,
                    warning: response.data.data.warning || null
                });
            } else {
                setDeliveryData(prev => ({
                    ...prev,
                    isCalculating: false,
                    error: response.data.message,
                    isDeliverable: response.data.isDeliverable || false,
                    warning: null
                }));
            }
        } catch (error) {
            console.error('Erro ao calcular taxa de entrega:', error);
            setDeliveryData(prev => ({
                ...prev,
                fee: 2, // Taxa padrão em caso de erro
                isCalculating: false,
                error: 'Erro ao calcular taxa de entrega. Usando taxa padrão.',
                isDeliverable: true
            }));
        }
    }, [url]);

    const checkDeliveryArea = useCallback(async (address) => {
        if (!address || !address.street || !address.city || !address.state) {
            return { isDeliverable: true, error: null };
        }

        try {
            const response = await axios.post(`${url}/api/delivery/check-area`, {
                address: {
                    street: address.street,
                    city: address.city,
                    state: address.state,
                    zipCode: address.zipCode || '',
                    country: address.country || 'Brasil'
                }
            });

            if (response.data.success) {
                return {
                    isDeliverable: response.data.data.isDeliverable,
                    distance: response.data.data.distance,
                    duration: response.data.data.duration,
                    maxDistance: response.data.data.maxDistance,
                    isRestricted: response.data.data.isRestricted || false,
                    warning: response.data.data.warning || null,
                    error: null
                };
            } else {
                return {
                    isDeliverable: response.data.isDeliverable || false,
                    isRestricted: response.data.isRestricted || false,
                    error: response.data.message
                };
            }
        } catch (error) {
            console.error('Erro ao verificar área de entrega:', error);
            return {
                isDeliverable: true, // Em caso de erro, permite entrega
                error: 'Erro ao verificar área de entrega'
            };
        }
    }, [url]);

    const resetDeliveryData = useCallback(() => {
        setDeliveryData({
            fee: 2,
            distance: null,
            duration: null,
            isCalculating: false,
            error: null,
            isDeliverable: true,
            warning: null
        });
    }, []);

    return {
        deliveryData,
        calculateDeliveryFee,
        checkDeliveryArea,
        resetDeliveryData
    };
};

export default useDeliveryCalculation;