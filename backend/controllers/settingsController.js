import settingsModel from '../models/settingsModel.js';

// Get PIX key
const getPixKey = async (req, res) => {
    try {
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = new settingsModel({
                pixKey: ''
            });
            await settings.save();
        }
        
        res.json({
            success: true,
            pixKey: settings.pixKey
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao buscar chave PIX"
        });
    }
};

// Update PIX key (Admin only)
const updatePixKey = async (req, res) => {
    try {
        const { pixKey } = req.body;
        
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create new settings if none exist
            settings = new settingsModel({
                pixKey: pixKey
            });
        } else {
            // Update existing settings
            settings.pixKey = pixKey;
            settings.updatedAt = new Date();
        }
        
        await settings.save();
        
        res.json({
            success: true,
            message: "Chave PIX atualizada com sucesso",
            pixKey: settings.pixKey
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao atualizar chave PIX"
        });
    }
};

// Get all settings
const getSettings = async (req, res) => {
    try {
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create default settings if none exist
            settings = new settingsModel({
                pixKey: ''
            });
            await settings.save();
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao buscar configurações"
        });
    }
};



// Update banner settings (Admin only)
const updateBanner = async (req, res) => {
    try {
        const { title, description, image } = req.body;
        
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create new settings if none exist
            settings = new settingsModel({
                pixKey: '',
                deliveryFee: 2,
                banner: {
                    title: title || "Peça sua comida favorita aqui",
                    description: description || "Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta.",
                    image: image || "/header_img.png"
                }
            });
        } else {
            // Update existing settings
            if (!settings.banner) {
                settings.banner = {};
            }
            if (title !== undefined) settings.banner.title = title;
            if (description !== undefined) settings.banner.description = description;
            if (image !== undefined) settings.banner.image = image;
            settings.updatedAt = new Date();
        }
        
        await settings.save();
        
        res.json({
            success: true,
            message: "Banner atualizado com sucesso",
            banner: settings.banner
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao atualizar banner"
        });
    }
};

// Get banner settings
const getBanner = async (req, res) => {
    try {
        let settings = await settingsModel.findOne();
        
        if (!settings || !settings.banner) {
            // Return default banner if none exist
            const defaultBanner = {
                title: "Peça sua comida favorita aqui",
                description: "Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta. Navegue por uma variedade de restaurantes, faça seu pedido e acompanhe em tempo real. Desfrute de comida quente e fresca sem sair de casa. Rápido, conveniente e fácil de usar.",
                image: "/header_img.png"
            };
            
            res.json({
                success: true,
                data: defaultBanner
            });
        } else {
            res.json({
                success: true,
                data: settings.banner
            });
        }
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao buscar configurações do banner"
        });
    }
};

// Update Google Maps settings (Admin only)
const updateGoogleMapsSettings = async (req, res) => {
    try {
        const { googleMapsApiKey, restaurantAddress, maxDeliveryDistance, deliveryZones } = req.body;
        
        let settings = await settingsModel.findOne();
        
        if (!settings) {
            // Create new settings if none exist
            settings = new settingsModel({
                pixKey: '',
                googleMapsApiKey: googleMapsApiKey || '',
                restaurantAddress: restaurantAddress || {
                    street: '',
                    city: '',
                    state: '',
                    zipCode: '',
                    country: 'Brasil'
                },
                maxDeliveryDistance: maxDeliveryDistance || 10,
                deliveryZones: deliveryZones || [
                    { maxDistance: 5, fee: 2 },
                    { maxDistance: 10, fee: 4 }
                ]
            });
        } else {
            // Update existing settings
            if (googleMapsApiKey !== undefined) settings.googleMapsApiKey = googleMapsApiKey;
            if (restaurantAddress !== undefined) settings.restaurantAddress = restaurantAddress;
            if (maxDeliveryDistance !== undefined) settings.maxDeliveryDistance = maxDeliveryDistance;
            if (deliveryZones !== undefined) settings.deliveryZones = deliveryZones;
            settings.updatedAt = new Date();
        }
        
        await settings.save();
        
        res.json({
            success: true,
            message: "Configurações do Google Maps atualizadas com sucesso",
            data: {
                googleMapsApiKey: settings.googleMapsApiKey,
                restaurantAddress: settings.restaurantAddress,
                maxDeliveryDistance: settings.maxDeliveryDistance,
                deliveryZones: settings.deliveryZones
            }
        });
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "Erro ao atualizar configurações do Google Maps"
        });
    }
};

export { getPixKey, updatePixKey, getSettings, updateBanner, getBanner, updateGoogleMapsSettings };