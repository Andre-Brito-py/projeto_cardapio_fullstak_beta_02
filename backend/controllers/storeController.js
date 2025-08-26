import Store from '../models/storeModel.js';
import userModel from '../models/userModel.js';
import SystemSettings from '../models/systemSettingsModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Criar nova loja
const createStore = async (req, res) => {
    try {
        const {
            name,
            description,
            restaurantAddress,
            ownerName,
            ownerEmail,
            ownerPassword,
            subscriptionPlan = 'Básico'
        } = req.body;
        
        // Verificar se o email do proprietário já existe
        const existingUser = await userModel.findOne({ email: ownerEmail });
        if (existingUser) {
            return res.json({ success: false, message: "Email já está em uso" });
        }
        
        // Verificar se o nome da loja já existe
        const existingStore = await Store.findOne({ name });
        if (existingStore) {
            return res.json({ success: false, message: "Nome da loja já está em uso" });
        }
        
        // Hash da senha do proprietário
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(ownerPassword, salt);
        
        // Criar usuário proprietário
        const owner = new userModel({
            name: ownerName,
            email: ownerEmail,
            password: hashedPassword,
            role: 'store_admin'
        });
        
        await owner.save();
        
        // Criar loja
        const store = new Store({
            name,
            description,
            owner: owner._id,
            subscription: {
                plan: subscriptionPlan,
                status: 'trial'
            },
            settings: {
                restaurantAddress,
                deliveryZones: [
                    {
                        name: 'Zona 1',
                        maxDistance: 3,
                        fee: 5.00
                    },
                    {
                        name: 'Zona 2',
                        maxDistance: 6,
                        fee: 8.00
                    },
                    {
                        name: 'Zona 3',
                        maxDistance: 10,
                        fee: 12.00
                    }
                ],
                operatingHours: {
                    monday: { open: '08:00', close: '22:00', closed: false },
                    tuesday: { open: '08:00', close: '22:00', closed: false },
                    wednesday: { open: '08:00', close: '22:00', closed: false },
                    thursday: { open: '08:00', close: '22:00', closed: false },
                    friday: { open: '08:00', close: '22:00', closed: false },
                    saturday: { open: '08:00', close: '22:00', closed: false },
                    sunday: { open: '08:00', close: '22:00', closed: false }
                }
            }
        });
        
        await store.save();
        
        // Atualizar o usuário com o storeId
        owner.storeId = store._id;
        await owner.save();
        
        res.json({
            success: true,
            message: "Loja criada com sucesso",
            data: {
                store: {
                    id: store._id,
                    name: store.name,
                    slug: store.slug,
                    status: store.status
                },
                owner: {
                    id: owner._id,
                    name: owner.name,
                    email: owner.email
                }
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao criar loja" });
    }
};

// Obter dados da loja
const getStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const store = await Store.findById(storeId).populate('owner', 'name email');
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        res.json({ success: true, data: store });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao obter dados da loja" });
    }
};

// Atualizar configurações da loja
const updateStoreSettings = async (req, res) => {
    try {
        const { storeId } = req.params;
        const updates = req.body;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        // Verificar se o usuário tem permissão para editar esta loja
        if (req.user.role !== 'super_admin' && req.user.storeId.toString() !== storeId) {
            return res.json({ success: false, message: "Sem permissão para editar esta loja" });
        }
        
        // Atualizar configurações
        if (updates.settings) {
            Object.keys(updates.settings).forEach(key => {
                if (updates.settings[key] !== undefined) {
                    store.settings[key] = updates.settings[key];
                }
            });
        }
        
        // Atualizar customização
        if (updates.customization) {
            Object.keys(updates.customization).forEach(key => {
                if (updates.customization[key] !== undefined) {
                    store.customization[key] = updates.customization[key];
                }
            });
        }
        
        // Atualizar outros campos permitidos
        const allowedFields = ['name', 'description', 'logo'];
        allowedFields.forEach(field => {
            if (updates[field] !== undefined) {
                store[field] = updates[field];
            }
        });
        
        await store.save();
        
        res.json({ success: true, message: "Configurações atualizadas com sucesso", data: store });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao atualizar configurações" });
    }
};

// Obter estatísticas da loja
const getStoreStats = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        // Verificar permissão
        if (req.user.role !== 'super_admin' && req.user.storeId.toString() !== storeId) {
            return res.json({ success: false, message: "Sem permissão para ver estatísticas desta loja" });
        }
        
        // Aqui você pode adicionar mais estatísticas específicas da loja
        // Por exemplo, produtos mais vendidos, pedidos por período, etc.
        
        res.json({
            success: true,
            data: {
                analytics: store.analytics,
                subscription: store.subscription,
                status: store.status
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao obter estatísticas" });
    }
};

// Verificar limites do plano
const checkPlanLimits = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { type } = req.query; // 'orders' ou 'products'
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        const limits = await store.checkPlanLimits(type);
        
        res.json({ success: true, data: limits });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao verificar limites" });
    }
};

// Atualizar assinatura da loja
const updateSubscription = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { plan, status, endDate, autoRenew } = req.body;
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        // Apenas super admin pode alterar assinaturas
        if (req.user.role !== 'super_admin') {
            return res.json({ success: false, message: "Sem permissão para alterar assinatura" });
        }
        
        if (plan) store.subscription.plan = plan;
        if (status) store.subscription.status = status;
        if (endDate) store.subscription.endDate = new Date(endDate);
        if (autoRenew !== undefined) store.subscription.autoRenew = autoRenew;
        
        await store.save();
        
        res.json({ success: true, message: "Assinatura atualizada com sucesso" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro ao atualizar assinatura" });
    }
};

// Login do admin da loja
const loginStoreAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await userModel.findOne({ email, role: 'store_admin' }).populate('storeId');
        if (!user) {
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        if (!user.isActive) {
            return res.json({ success: false, message: "Conta desativada" });
        }
        
        // Verificar se a loja está ativa
        if (user.storeId && user.storeId.status !== 'active') {
            return res.json({ success: false, message: "Loja não está ativa" });
        }
        
        // Atualizar último login
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, role: user.role, storeId: user.storeId?._id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                storeId: user.storeId?._id,
                storeName: user.storeId?.name
            }
        });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Erro no login" });
    }
};

export {
    createStore,
    getStore,
    updateStoreSettings,
    getStoreStats,
    checkPlanLimits,
    updateSubscription,
    loginStoreAdmin
};