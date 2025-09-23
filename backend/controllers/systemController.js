import SystemSettings from '../models/systemSettingsModel.js';
import Store from '../models/storeModel.js';
import userModel from '../models/userModel.js';
import foodModel from '../models/foodModel.js';
import bannerModel from '../models/bannerModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import lisaService from '../services/lisaService.js';

// Obter configurações do sistema
const getSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('Erro ao obter configurações do sistema:', error);
        res.json({ success: false, message: "Erro ao obter configurações do sistema" });
    }
};

// Atualizar configurações do sistema
const updateSystemSettings = async (req, res) => {
    try {
        const settings = await SystemSettings.getInstance();
        
        // Atualizar apenas os campos fornecidos
        Object.keys(req.body).forEach(key => {
            if (req.body[key] !== undefined) {
                settings[key] = req.body[key];
            }
        });
        
        await settings.save();
        res.json({ success: true, message: "Configurações atualizadas com sucesso", data: settings });
    } catch (error) {
        console.error('Erro ao atualizar configurações do sistema:', error);
        res.json({ success: false, message: "Erro ao atualizar configurações" });
    }
};

// Obter estatísticas do sistema
const getSystemStats = async (req, res) => {
    try {
        const totalStores = await Store.countDocuments();
        const activeStores = await Store.countDocuments({ status: 'active' });
        const pendingStores = await Store.countDocuments({ status: 'pending' });
        const suspendedStores = await Store.countDocuments({ status: 'suspended' });
        
        const totalUsers = await userModel.countDocuments();
        const storeAdmins = await userModel.countDocuments({ role: 'store_admin' });
        const customers = await userModel.countDocuments({ role: 'customer' });
        
        // Estatísticas de receita (soma de todas as lojas)
        const stores = await Store.find({}, 'analytics.totalRevenue analytics.currentMonthRevenue');
        const totalRevenue = stores.reduce((sum, store) => sum + (store.analytics.totalRevenue || 0), 0);
        const monthlyRevenue = stores.reduce((sum, store) => sum + (store.analytics.currentMonthRevenue || 0), 0);
        
        // Estatísticas de assinatura
        const subscriptionStats = await Store.aggregate([
            {
                $group: {
                    _id: '$subscription.plan',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            success: true,
            data: {
                stores: {
                    total: totalStores,
                    active: activeStores,
                    pending: pendingStores,
                    suspended: suspendedStores
                },
                users: {
                    total: totalUsers,
                    storeAdmins,
                    customers
                },
                revenue: {
                    total: totalRevenue,
                    monthly: monthlyRevenue
                },
                subscriptions: subscriptionStats
            }
        });
    } catch (error) {
        console.error('Erro ao obter estatísticas do sistema:', error);
        res.json({ success: false, message: "Erro ao obter estatísticas" });
    }
};

// Listar todas as lojas
const getAllStores = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const status = req.query.status;
        const search = req.query.search;
        
        let query = {};
        if (status) query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { slug: { $regex: search, $options: 'i' } }
            ];
        }
        
        const stores = await Store.find(query)
            .populate('owner', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);
            
        const total = await Store.countDocuments(query);
        
        res.json({
            success: true,
            data: {
                stores,
                pagination: {
                    current: page,
                    pages: Math.ceil(total / limit),
                    total
                }
            }
        });
    } catch (error) {
        console.error('Erro ao listar lojas:', error);
        res.json({ success: false, message: "Erro ao listar lojas" });
    }
};

// Aprovar/rejeitar loja
const updateStoreStatus = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { status, reason } = req.body;
        
        // Validar status
        const validStatuses = ['active', 'inactive', 'suspended', 'pending'];
        if (!validStatuses.includes(status)) {
            return res.json({ success: false, message: "Status inválido" });
        }
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        store.status = status;
        if (reason) {
            store.statusReason = reason;
        }
        
        await store.save();
        
        res.json({ 
            success: true, 
            message: "Status da loja atualizado com sucesso",
            data: {
                storeId: store._id,
                status: store.status
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar status da loja:', error);
        res.json({ success: false, message: "Erro ao atualizar status da loja" });
    }
};

// Criar usuário super admin
const createSuperAdmin = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verificar se já existe um super admin
        const existingSuperAdmin = await userModel.findOne({ role: 'super_admin' });
        if (existingSuperAdmin) {
            return res.json({ success: false, message: "Já existe um Super Admin no sistema" });
        }
        
        // Verificar se o email já existe
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({ success: false, message: "Email já está em uso" });
        }
        
        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Criar super admin
        const superAdmin = new userModel({
            name,
            email,
            password: hashedPassword,
            role: 'super_admin',
            permissions: ['*'] // Todas as permissões
        });
        
        await superAdmin.save();
        
        res.json({ success: true, message: "Super Admin criado com sucesso" });
    } catch (error) {
        console.error('Erro ao criar Super Admin:', error);
        res.json({ success: false, message: "Erro ao criar Super Admin" });
    }
};

// Login do super admin
const loginSuperAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const user = await userModel.findOne({ email, role: 'super_admin' });
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
        
        // Atualizar último login
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, role: user.role },
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
                role: user.role
            }
        });
    } catch (error) {
        console.error('Erro no login do super admin:', error);
        res.json({ success: false, message: "Erro no login" });
    }
};

// Listar lojas públicas (sem autenticação)
const getPublicStores = async (req, res) => {
    try {
        const stores = await Store.find({ 
            status: 'active',
            'subscription.status': { $in: ['active', 'trial'] }
        })
        .select('name slug description logo domain customization settings.restaurantAddress')
        .sort({ name: 1 }); // Ordenar por nome alfabeticamente
        
        res.json({ 
            success: true, 
            stores: stores.map(store => ({
                id: store._id,
                name: store.name,
                slug: store.slug,
                description: store.description,
                logo: store.logo,
                address: store.settings?.restaurantAddress,
                customization: {
                    primaryColor: store.customization?.primaryColor,
                    secondaryColor: store.customization?.secondaryColor
                },
                domain: store.domain?.customDomain || store.domain?.subdomain || store.slug
            }))
        });
    } catch (error) {
        console.error('Erro ao listar lojas públicas:', error);
        res.json({ success: false, message: "Erro ao listar lojas públicas" });
    }
};

// Verificar se existe super admin
const checkSuperAdmin = async (req, res) => {
    try {
        const superAdmin = await userModel.findOne({ role: 'super_admin' });
        res.json({ 
            success: true, 
            exists: !!superAdmin,
            data: superAdmin ? {
                id: superAdmin._id,
                name: superAdmin.name,
                email: superAdmin.email,
                role: superAdmin.role,
                isActive: superAdmin.isActive,
                createdAt: superAdmin.createdAt
            } : null
        });
    } catch (error) {
        console.error('Erro ao verificar super admin:', error);
        res.json({ success: false, message: "Erro ao verificar super admin" });
    }
};

// Reset super admin password
const resetSuperAdminPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        
        const superAdmin = await userModel.findOne({ email, role: 'super_admin' });
        if (!superAdmin) {
            return res.json({ success: false, message: "Super Admin não encontrado" });
        }
        
        // Hash da nova senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        superAdmin.password = hashedPassword;
        await superAdmin.save();
        
        res.json({ success: true, message: "Senha do Super Admin resetada com sucesso" });
    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.json({ success: false, message: "Erro ao resetar senha" });
    }
};

// Atualizar dados da loja
const updateStore = async (req, res) => {
    try {
        const { storeId } = req.params;
        const updateData = req.body;

        // Verificar se a loja existe
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Loja não encontrada"
            });
        }

        // Se a senha do proprietário foi fornecida, criptografá-la
        if (updateData.ownerPassword) {
            const salt = await bcrypt.genSalt(10);
            updateData.ownerPassword = await bcrypt.hash(updateData.ownerPassword, salt);
        }

        // Atualizar dados da loja
        const updatedStore = await Store.findByIdAndUpdate(
            storeId,
            {
                $set: {
                    name: updateData.name,
                    description: updateData.description,
                    'settings.restaurantAddress': updateData.restaurantAddress,
                    'subscription.plan': updateData.subscriptionPlan,
                    'settings.language': updateData.language,
                    'settings.currency': updateData.currency,
                    'settings.timezone': updateData.timezone,
                    // Campos do Telegram
                    'telegram.chatId': updateData.telegramChatId,
                    'telegram.phoneNumber': updateData.telegramPhoneNumber,
                    'telegram.isActive': updateData.telegramIsActive,
                    updatedAt: new Date()
                }
            },
            { new: true, runValidators: true }
        );

        // Atualizar dados do proprietário se fornecidos
        if (updateData.ownerName || updateData.ownerEmail || updateData.ownerPassword) {
            const ownerUpdateData = {};
            if (updateData.ownerName) ownerUpdateData.name = updateData.ownerName;
            if (updateData.ownerEmail) ownerUpdateData.email = updateData.ownerEmail;
            if (updateData.ownerPassword) ownerUpdateData.password = updateData.ownerPassword;

            await userModel.findByIdAndUpdate(
                store.owner,
                { $set: ownerUpdateData },
                { new: true, runValidators: true }
            );
        }

        res.json({
            success: true,
            message: "Loja atualizada com sucesso",
            data: updatedStore
        });

    } catch (error) {
        console.error('Erro ao atualizar loja:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao atualizar loja"
        });
    }
};

// Excluir loja e todos os dados relacionados
const deleteStore = async (req, res) => {

    
    try {
        const { storeId } = req.params;

        // Verificar se a loja existe
        const store = await Store.findById(storeId);
        if (!store) {
            return res.status(404).json({
                success: false,
                message: "Loja não encontrada"
            });
        }

        // Validação de segurança: verificar se há pedidos recentes (últimos 30 dias)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Nota: Como o orderModel não tem storeId, esta validação seria implementada
        // quando o modelo de pedidos for atualizado para incluir referência à loja
        
        // Validação: não permitir exclusão se a loja estiver ativa
        if (store.status === 'active') {
            return res.status(400).json({
                success: false,
                message: "Não é possível excluir uma loja ativa. Desative a loja primeiro."
            });
        }

        // Buscar todos os alimentos da loja para excluir banners relacionados
        const storeFood = await foodModel.find({ storeId });
        const foodIds = storeFood.map(food => food._id);

        // Excluir banners que referenciam produtos da loja
        if (foodIds.length > 0) {
            await bannerModel.deleteMany({ productId: { $in: foodIds } });
        }

        // Excluir todos os alimentos da loja
        await foodModel.deleteMany({ storeId });

        // Excluir usuários store_admin da loja
        await userModel.deleteMany({ 
            storeId: storeId,
            role: 'store_admin'
        });

        // Excluir a loja
        await Store.findByIdAndDelete(storeId);

        res.json({
            success: true,
            message: "Loja e todos os dados relacionados foram excluídos com sucesso"
        });

    } catch (error) {
        console.error('Erro ao excluir loja:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao excluir loja e dados relacionados"
        });
    }
};

// Listar todos os usuários
const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({})
            .select('-password')
            .populate('storeId', 'name')
            .sort({ createdAt: -1 });
        
        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Erro ao buscar usuários:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao buscar usuários"
        });
    }
};

// Criar novo usuário
const createUser = async (req, res) => {
    try {
        const { name, email, password, role, isActive, storeId } = req.body;
        
        // Verificar se o email já existe
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "Email já está em uso"
            });
        }
        
        // Validar role
        const validRoles = ['customer', 'admin', 'superadmin'];
        if (!validRoles.includes(role)) {
            return res.json({
                success: false,
                message: "Role inválido"
            });
        }
        
        // Se for admin, verificar se storeId foi fornecido
        if (role === 'admin' && !storeId) {
            return res.json({
                success: false,
                message: "StoreId é obrigatório para administradores"
            });
        }
        
        // Criptografar senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Criar usuário
        const userData = {
            name,
            email,
            password: hashedPassword,
            role,
            isActive: isActive !== undefined ? isActive : true
        };
        
        if (role === 'admin' && storeId) {
            userData.storeId = storeId;
        }
        
        const newUser = new userModel(userData);
        await newUser.save();
        
        // Remover senha da resposta
        const userResponse = newUser.toObject();
        delete userResponse.password;
        
        res.json({
            success: true,
            message: "Usuário criado com sucesso",
            user: userResponse
        });
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao criar usuário"
        });
    }
};

// Atualizar usuário
const updateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email, password, role, isActive, storeId } = req.body;
        
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "Usuário não encontrado"
            });
        }
        
        // Verificar se o email já existe (exceto para o próprio usuário)
        if (email && email !== user.email) {
            const existingUser = await userModel.findOne({ email, _id: { $ne: userId } });
            if (existingUser) {
                return res.json({
                    success: false,
                    message: "Email já está em uso"
                });
            }
        }
        
        // Atualizar campos
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) {
            const validRoles = ['customer', 'admin', 'superadmin'];
            if (!validRoles.includes(role)) {
                return res.json({
                    success: false,
                    message: "Role inválido"
                });
            }
            user.role = role;
        }
        if (isActive !== undefined) user.isActive = isActive;
        
        // Se for admin, definir storeId
        if (role === 'admin' && storeId) {
            user.storeId = storeId;
        } else if (role !== 'admin') {
            user.storeId = undefined;
        }
        
        // Atualizar senha se fornecida
        if (password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
        }
        
        await user.save();
        
        // Remover senha da resposta
        const userResponse = user.toObject();
        delete userResponse.password;
        
        res.json({
            success: true,
            message: "Usuário atualizado com sucesso",
            user: userResponse
        });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao atualizar usuário"
        });
    }
};

// Deletar usuário
const deleteUser = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "Usuário não encontrado"
            });
        }
        
        // Não permitir deletar super admin
        if (user.role === 'superadmin') {
            return res.json({
                success: false,
                message: "Não é possível deletar um Super Admin"
            });
        }
        
        await userModel.findByIdAndDelete(userId);
        
        res.json({
            success: true,
            message: "Usuário deletado com sucesso"
        });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao deletar usuário"
        });
    }
};

// Alterar status do usuário
const updateUserStatus = async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;
        
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "Usuário não encontrado"
            });
        }
        
        user.isActive = isActive;
        await user.save();
        
        res.json({
             success: true,
             message: `Usuário ${isActive ? 'ativado' : 'desativado'} com sucesso`
         });
    } catch (error) {
        console.error('Erro ao alterar status do usuário:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao alterar status do usuário"
        });
    }
};

// Resetar senha do usuário
const resetUserPassword = async (req, res) => {
    try {
        const { userId } = req.params;
        
        const user = await userModel.findById(userId);
        if (!user) {
            return res.json({
                success: false,
                message: "Usuário não encontrado"
            });
        }
        
        // Gerar nova senha aleatória
        const newPassword = Math.random().toString(36).slice(-8);
        
        // Criptografar nova senha
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        
        await user.save();
        
        res.json({
            success: true,
            message: "Senha resetada com sucesso",
            newPassword: newPassword
        });
    } catch (error) {
        console.error('Erro ao resetar senha do usuário:', error);
        res.status(500).json({
            success: false,
            message: "Erro ao resetar senha"
        });
    }
};

// Iniciar Lisa AI Assistant
const startLisa = async (req, res) => {
    try {
        const result = await lisaService.startLisa();
        res.json(result);
    } catch (error) {
        console.error('Erro ao iniciar Lisa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao iniciar Lisa AI Assistant'
        });
    }
};

// Parar Lisa AI Assistant
const stopLisa = async (req, res) => {
    try {
        const result = await lisaService.stopLisa();
        res.json(result);
    } catch (error) {
        console.error('Erro ao parar Lisa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao parar Lisa AI Assistant'
        });
    }
};

// Reiniciar Lisa AI Assistant
const restartLisa = async (req, res) => {
    try {
        const result = await lisaService.restartLisa();
        res.json(result);
    } catch (error) {
        console.error('Erro ao reiniciar Lisa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao reiniciar Lisa AI Assistant'
        });
    }
};

// Obter status da Lisa AI Assistant
const getLisaStatus = async (req, res) => {
    try {
        const status = lisaService.getStatus();
        res.json({
            success: true,
            status
        });
    } catch (error) {
        console.error('Erro ao obter status da Lisa:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter status da Lisa AI Assistant'
        });
    }
};

// Obter atividades recentes do sistema
const getRecentActivity = async (req, res) => {
    try {
        const activities = [];
        
        // Buscar lojas criadas recentemente (últimas 24 horas)
        const recentStores = await Store.find({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 }).limit(5);
        
        recentStores.forEach(store => {
            activities.push({
                type: 'store_created',
                message: `Nova loja "${store.name}" criada`,
                timestamp: store.createdAt,
                icon: 'store'
            });
        });
        
        // Buscar usuários registrados recentemente (últimas 24 horas)
        const recentUsers = await userModel.find({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).sort({ createdAt: -1 }).limit(5);
        
        recentUsers.forEach(user => {
            activities.push({
                type: 'user_registered',
                message: `Novo usuário cadastrado: ${user.email}`,
                timestamp: user.createdAt,
                icon: 'user'
            });
        });
        
        // Buscar mudanças de status de lojas (últimas 24 horas)
        const statusChanges = await Store.find({
            updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            status: { $in: ['suspended', 'active'] }
        }).sort({ updatedAt: -1 }).limit(3);
        
        statusChanges.forEach(store => {
            if (store.status === 'suspended') {
                activities.push({
                    type: 'store_suspended',
                    message: `Loja "${store.name}" suspensa por falta de pagamento`,
                    timestamp: store.updatedAt,
                    icon: 'warning'
                });
            }
        });
        
        // Ordenar por timestamp (mais recente primeiro)
        activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        
        res.json({ success: true, data: activities.slice(0, 10) });
    } catch (error) {
        console.error('Erro ao obter atividades recentes:', error);
        res.json({ success: false, message: "Erro ao obter atividades recentes" });
    }
};

export {
    getSystemSettings,
    updateSystemSettings,
    getSystemStats,
    getAllStores,
    updateStoreStatus,
    updateStore,
    createSuperAdmin,
    loginSuperAdmin,
    getPublicStores,
    checkSuperAdmin,
    resetSuperAdminPassword,
    deleteStore,
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetUserPassword,
    startLisa,
    stopLisa,
    restartLisa,
    getLisaStatus,
    getRecentActivity
};