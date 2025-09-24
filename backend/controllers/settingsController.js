import settingsModel from '../models/settingsModel.js';
import Store from '../models/storeModel.js';

// Get PIX key
const getPixKey = async (req, res) => {
    try {
        const storeId = req.store?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        let settings = await settingsModel.findOne({ storeId });
        
        if (!settings) {
            // Create default settings if none exist for this store
            settings = new settingsModel({
                storeId,
                pixKey: ''
            });
            await settings.save();
        }
        
        res.json({
            success: true,
            pixKey: settings.pixKey
        });
    } catch (error) {
        console.error('Erro ao buscar chave PIX:', error);
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
        const storeId = req.store?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }
        
        let settings = await settingsModel.findOne({ storeId });
        
        if (!settings) {
            // Create new settings if none exist for this store
            settings = new settingsModel({
                storeId,
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
        console.error('Erro ao atualizar chave PIX:', error);
        res.json({
            success: false,
            message: "Erro ao atualizar chave PIX"
        });
    }
};

// Get all settings
const getSettings = async (req, res) => {
    try {
        const storeId = req.store?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        let settings = await settingsModel.findOne({ storeId });
        
        if (!settings) {
            // Create default settings if none exist for this store
            settings = new settingsModel({
                storeId,
                pixKey: ''
            });
            await settings.save();
        }
        
        res.json({
            success: true,
            data: settings
        });
    } catch (error) {
        console.error('Erro ao buscar configurações:', error);
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
        const storeId = req.store?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }
        
        let settings = await settingsModel.findOne({ storeId });
        
        if (!settings) {
            // Create new settings if none exist for this store
            settings = new settingsModel({
                storeId,
                pixKey: '',
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
        console.error('Erro ao atualizar banner:', error);
        res.json({
            success: false,
            message: "Erro ao atualizar banner"
        });
    }
};

// Get banner settings
const getBanner = async (req, res) => {
    try {
        const storeId = req.store?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        let settings = await settingsModel.findOne({ storeId });
        
        if (!settings || !settings.banner) {
            // Return null if no banner is configured for this store
            res.json({
                success: false,
                message: "Nenhum banner principal configurado",
                data: null
            });
        } else {
            res.json({
                success: true,
                data: settings.banner
            });
        }
    } catch (error) {
        console.error('Erro ao buscar configurações do banner:', error);
        res.json({
            success: false,
            message: "Erro ao buscar configurações do banner"
        });
    }
};



// Get accepted payment methods
const getAcceptedPaymentMethods = async (req, res) => {
    try {
        const storeId = req.user.storeId;
        const store = await Store.findById(storeId);
        
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        res.json({
            success: true,
            acceptedPaymentMethods: store.acceptedPaymentMethods || ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao']
        });
    } catch (error) {
        console.error('Erro ao buscar formas de pagamento aceitas:', error);
        res.json({
            success: false,
            message: "Erro ao buscar formas de pagamento aceitas"
        });
    }
};

// Update accepted payment methods (Admin only)
const updateAcceptedPaymentMethods = async (req, res) => {
    try {
        const { acceptedPaymentMethods } = req.body;
        const storeId = req.user.storeId;
        
        if (!acceptedPaymentMethods || !Array.isArray(acceptedPaymentMethods)) {
            return res.json({ success: false, message: "Formas de pagamento inválidas" });
        }
        
        const validMethods = ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao'];
        const invalidMethods = acceptedPaymentMethods.filter(method => !validMethods.includes(method));
        
        if (invalidMethods.length > 0) {
            return res.json({ success: false, message: `Formas de pagamento inválidas: ${invalidMethods.join(', ')}` });
        }
        
        const store = await Store.findByIdAndUpdate(
            storeId,
            { acceptedPaymentMethods: acceptedPaymentMethods },
            { new: true }
        );
        
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        res.json({
            success: true,
            message: "Formas de pagamento atualizadas com sucesso",
            acceptedPaymentMethods: store.acceptedPaymentMethods
        });
    } catch (error) {
        console.error('Erro ao atualizar formas de pagamento:', error);
        res.json({
            success: false,
            message: "Erro ao atualizar formas de pagamento"
        });
    }
};

export { getPixKey, updatePixKey, getSettings, updateBanner, getBanner, getAcceptedPaymentMethods, updateAcceptedPaymentMethods };