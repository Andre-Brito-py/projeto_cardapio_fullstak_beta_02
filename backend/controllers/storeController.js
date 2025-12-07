import Store from '../models/storeModel.js';
import userModel from '../models/userModel.js';
import SystemSettings from '../models/systemSettingsModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Criar nova loja
const createStore = async (req, res) => {
    try {
        console.log('Dados recebidos no backend:', req.body);
        
        const {
            name,
            description,
            restaurantAddress,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            zipCode,
            ownerName,
            ownerEmail,
            ownerPassword,
            subscriptionPlan = 'Básico',
            language = 'pt-BR',
            currency = 'BRL',
            timezone = 'America/Sao_Paulo'
        } = req.body;
        
        console.log('Campos de endereço extraídos:', { street, number, complement, neighborhood, city, state, zipCode });
        
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
        
        // Criar um ObjectId temporário para o owner
        const tempOwnerId = new mongoose.Types.ObjectId();
        
        // Gerar slug manualmente
        const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        
        // Criar a loja com owner temporário
        const store = new Store({
            name,
            slug,
            description,
            owner: tempOwnerId,
            domain: {
                subdomain: slug // Usar o slug como subdomain
            },
            subscription: {
                plan: subscriptionPlan,
                status: 'trial'
            },
            settings: {
                restaurantAddress,
                address: {
                    street: street || 'Não informado',
                    number: number || 'S/N',
                    complement: complement || '',
                    neighborhood: neighborhood || 'Não informado',
                    city: city || 'Não informado',
                    state: state || 'Não informado',
                    zipCode: zipCode || '00000-000'
                },
                currency,
                language,
                timezone,
                deliveryZones: [
                    {
                        name: 'Zona Principal',
                        coordinates: [[0, 0], [1, 1]],
                        deliveryFee: 5.00,
                        minOrderValue: 20.00,
                        fee: 5.00,
                        maxDistance: 10
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
            },
            customization: {
                bannerImage: 'banner_principal.png', // Banner padrão
                defaultCategories: true // Usar categorias padrão
            }
        });
        
        await store.save();
        
        // Criar o usuário proprietário com o storeId
        const owner = new userModel({
            name: ownerName,
            email: ownerEmail,
            password: hashedPassword,
            role: 'store_admin',
            store: store._id,
            storeId: store._id,
            isActive: true
        });
        
        await owner.save();
        
        // Atualizar a loja com o proprietário real
        store.owner = owner._id;
        await store.save();

        // Adicionar automaticamente a loja aos usuários permitidos do Telegram
        try {
            const systemSettings = await SystemSettings.getInstance();
            if (systemSettings.telegramEnabled && systemSettings.telegramAllowedUsers) {
                // Adicionar o slug da loja aos usuários permitidos se não estiver já presente
                const currentAllowedUsers = systemSettings.telegramAllowedUsers.split(',').map(user => user.trim()).filter(user => user);
                const storeSlug = store.slug;
                
                if (!currentAllowedUsers.includes(storeSlug)) {
                    currentAllowedUsers.push(storeSlug);
                    systemSettings.telegramAllowedUsers = currentAllowedUsers.join(', ');
                    await systemSettings.save();
                    console.log(`Loja ${storeSlug} adicionada automaticamente aos usuários permitidos do Telegram`);
                }
            }
        } catch (error) {
            console.error('Erro ao adicionar loja aos usuários permitidos do Telegram:', error);
            // Não falhar a criação da loja por causa deste erro
        }

        // Loja criada com sucesso
        console.log('Loja criada com sucesso:', store.name);

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
        console.error('Erro ao criar loja:', error);
        res.json({ success: false, message: "Erro ao criar loja", error: error.message });
    }
};

// Obter dados da loja
const getStore = async (req, res) => {
    try {
        let storeId;
        
        // Se a rota for '/current', usar o storeId do contexto do usuário
        if (req.route.path === '/current') {
            // Verificar se é super admin
            if (req.user?.role === 'super_admin') {
                // Super admin não tem loja específica associada
                return res.json({ 
                    success: false, 
                    message: "Super admin não possui loja associada",
                    userRole: 'super_admin'
                });
            }
            
            // req.user.storeId pode ser um ObjectId ou um objeto populado
            storeId = req.user?.storeId?._id || req.user?.storeId || req.storeId;
        } else {
            // Para outras rotas, usar o parâmetro da URL
            storeId = req.params.storeId;
        }
        
        if (!storeId) {
            return res.json({ success: false, message: "ID da loja não encontrado" });
        }
        
        const store = await Store.findById(storeId).populate('owner', 'name email');
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        res.json({ success: true, store: store });
    } catch (error) {
        console.error('Erro ao obter dados da loja:', error);
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
        console.error('Erro ao atualizar configurações da loja:', error);
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
        console.error('Erro ao obter estatísticas da loja:', error);
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
        console.error('Erro ao verificar limites do plano:', error);
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
        console.error('Erro ao atualizar assinatura da loja:', error);
        res.json({ success: false, message: "Erro ao atualizar assinatura" });
    }
};

// Login do admin da loja
const loginStoreAdmin = async (req, res) => {
    try {
        console.log('🔍 LoginStoreAdmin - Dados recebidos:', req.body);
        const { email, password } = req.body;
        
        console.log('🔍 Buscando usuário:', email, 'com role: store_admin');
        const user = await userModel.findOne({ email, role: 'store_admin' }).populate('storeId');
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        console.log('✅ Usuário encontrado:', user.name, user.email);
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Verificação de senha:', isMatch ? 'CORRETA' : 'INCORRETA');
        if (!isMatch) {
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        console.log('👤 Usuário ativo:', user.isActive);
        if (!user.isActive) {
            return res.json({ success: false, message: "Conta desativada" });
        }
        
        // Verificar se a loja está ativa
        console.log('🏪 Store status:', user.storeId?.status);
        if (user.storeId && user.storeId.status !== 'active') {
            return res.json({ success: false, message: "Loja não está ativa" });
        }
        
        // Atualizar último login
        user.lastLogin = new Date();
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, role: user.role, storeId: user.storeId?._id },
            process.env.JWT_SECRET || 'dev-secret',
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
        console.error('Erro no login do admin da loja:', error);
        res.json({ success: false, message: "Erro no login" });
    }
};

// Obter dados públicos da loja por slug (sem autenticação)
const getPublicStoreData = async (req, res) => {
    try {
        const { slug } = req.params;
        
        const store = await Store.findOne({ 
            slug: slug, 
            status: 'active'
        })
        .select('name slug description logo domain customization settings');
        
        if (!store) {
            // Retornar dados de demonstração se a loja não for encontrada
            console.log('⚠️ Loja não encontrada, retornando dados de demonstração');
            return res.json({ 
                success: true, 
                data: {
                    store: {
                        id: '507f1f77bcf86cd799439012',
                        name: 'Loja Demo',
                        slug: slug
                    },
                    categories: [
                        {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Pratos Principais',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        },
                        {
                            _id: '507f1f77bcf86cd799439014',
                            name: 'Bebidas',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        }
                    ],
                    foods: [
                        {
                            _id: '507f1f77bcf86cd799439015',
                            name: 'Hambúrguer Clássico',
                            price: 25.90,
                            category: 'Pratos Principais',
                            image: '/images/burger.jpg',
                            description: 'Hambúrguer artesanal com carne bovina, queijo e salada',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        },
                        {
                            _id: '507f1f77bcf86cd799439016',
                            name: 'Pizza Margherita',
                            price: 32.50,
                            category: 'Pratos Principais',
                            image: '/images/pizza.jpg',
                            description: 'Pizza tradicional com molho de tomate, mussarela e manjericão',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        },
                        {
                            _id: '507f1f77bcf86cd799439017',
                            name: 'Refrigerante',
                            price: 5.50,
                            category: 'Bebidas',
                            image: '/images/soda.jpg',
                            description: 'Refrigerante gelado 350ml',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        }
                    ]
                }
            });
        }
        
        res.json({ 
            success: true, 
            store: {
                id: store._id,
                name: store.name,
                slug: store.slug,
                description: store.description,
                logo: store.logo,
                address: store.settings?.restaurantAddress,
                operatingHours: store.settings?.operatingHours,
                deliveryZones: store.settings?.deliveryZones,
                maxDeliveryDistance: store.settings?.maxDeliveryDistance,
                customization: store.customization,
                domain: store.domain?.customDomain || store.domain?.subdomain || store.slug,
                isOpen: store.settings?.isOpen !== undefined ? store.settings.isOpen : true
            }
        });
    } catch (error) {
        console.error('Erro ao obter dados públicos da loja:', error);
        res.json({ success: false, message: "Erro ao obter dados da loja" });
    }
};

// Obter cardápio público da loja por slug (sem autenticação)
const getPublicStoreMenu = async (req, res) => {
    try {
        const { slug } = req.params;
        console.log('Buscando menu para slug:', slug);
        
        // Verificar se é a loja demo
        if (slug === 'loja-demo') {
            // Retornar dados de demonstração
            res.json({ 
                success: true, 
                data: {
                    store: {
                        id: '507f1f77bcf86cd799439012',
                        name: 'Loja Demo',
                        slug: 'loja-demo'
                    },
                    categories: [
                        {
                            _id: '507f1f77bcf86cd799439013',
                            name: 'Categoria 1',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        }
                    ],
                    foods: [
                        {
                            _id: '507f1f77bcf86cd799439014',
                            name: 'Produto Demo 1',
                            price: 25.9,
                            category: 'Categoria 1',
                            image: '/images/demo1.jpg',
                            description: 'Produto de demonstração',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        },
                        {
                            _id: '507f1f77bcf86cd799439015',
                            name: 'Produto Demo 2',
                            price: 32.5,
                            category: 'Categoria 1',
                            image: '/images/demo2.jpg',
                            description: 'Outro produto de demonstração',
                            storeId: '507f1f77bcf86cd799439012',
                            isActive: true
                        }
                    ]
                }
            });
            return;
        }
        
        const store = await Store.findOne({ 
            slug: slug, 
            status: 'active'
        });
        console.log('Loja encontrada:', store ? store.name : 'Nenhuma');
        
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada ou não está ativa" });
        }
        
        // Importar modelos necessários
        const foodModel = (await import('../models/foodModel.js')).default;
        const categoryModel = (await import('../models/categoryModel.js')).default;
        
        // Buscar categorias ativas da loja
        const categories = await categoryModel.find({ 
            storeId: store._id, 
            isActive: true 
        }).sort({ name: 1 });
        
        // Buscar produtos ativos da loja
        const foods = await foodModel.find({ 
            storeId: store._id, 
            isActive: true 
        }).sort({ category: 1, name: 1 });
        
        res.json({ 
            success: true, 
            data: {
                store: {
                    id: store._id,
                    name: store.name,
                    slug: store.slug
                },
                categories,
                foods
            }
        });
    } catch (error) {
        console.error('Erro ao obter cardápio público da loja:', error);
        res.json({ success: false, message: "Erro ao obter cardápio da loja" });
    }
};

// Atualizar status aberta/fechada da loja
const updateStoreStatus = async (req, res) => {
    try {
        const { isOpen } = req.body;
        const storeId = req.user.storeId;
        
        if (!storeId) {
            return res.json({ success: false, message: "Loja não identificada" });
        }
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        // Verificar se o usuário tem permissão para editar esta loja
        if (req.user.role !== 'super_admin' && req.user.storeId.toString() !== storeId.toString()) {
            return res.json({ success: false, message: "Sem permissão para editar esta loja" });
        }
        
        store.settings.isOpen = isOpen;
        await store.save();
        
        res.json({ 
            success: true, 
            message: `Loja ${isOpen ? 'aberta' : 'fechada'} com sucesso`,
            data: {
                isOpen: store.settings.isOpen
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar status da loja:', error);
        res.json({ success: false, message: "Erro ao atualizar status da loja" });
    }
};

// Atualizar configuração de aceitar pedidos automaticamente
const updateAutoAcceptOrders = async (req, res) => {
    try {
        const { autoAcceptOrders } = req.body;
        const storeId = req.user.storeId;
        
        if (!storeId) {
            return res.json({ success: false, message: "Loja não identificada" });
        }
        
        const store = await Store.findById(storeId);
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada" });
        }
        
        // Verificar se o usuário tem permissão para editar esta loja
        if (req.user.role !== 'super_admin' && req.user.storeId.toString() !== storeId.toString()) {
            return res.json({ success: false, message: "Sem permissão para editar esta loja" });
        }
        
        store.settings.autoAcceptOrders = autoAcceptOrders;
        await store.save();
        
        res.json({ 
            success: true, 
            message: `Aceitar pedidos automaticamente ${autoAcceptOrders ? 'ativado' : 'desativado'} com sucesso`,
            data: {
                autoAcceptOrders: store.settings.autoAcceptOrders
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar configuração de aceitar pedidos automaticamente:', error);
        res.json({ success: false, message: "Erro ao atualizar configuração de aceitar pedidos automaticamente" });
    }
};

// Obter dados públicos da loja por ID (para garçom)
const getPublicStoreById = async (req, res) => {
    try {
        const { storeId } = req.params;
        
        const store = await Store.findOne({ 
            _id: storeId, 
            status: 'active',
            'subscription.status': { $in: ['active', 'trial'] }
        })
        .select('name slug description logo domain customization settings');
        
        if (!store) {
            return res.json({ success: false, message: "Loja não encontrada ou não está ativa" });
        }
        
        res.json({ 
            success: true, 
            store: {
                id: store._id,
                name: store.name,
                slug: store.slug,
                description: store.description,
                logo: store.logo,
                address: store.settings?.restaurantAddress,
                operatingHours: store.settings?.operatingHours,
                deliveryZones: store.settings?.deliveryZones,
                maxDeliveryDistance: store.settings?.maxDeliveryDistance,
                customization: store.customization,
                domain: store.domain?.customDomain || store.domain?.subdomain || store.slug,
                isOpen: store.settings?.isOpen !== undefined ? store.settings.isOpen : true
            }
        });
    } catch (error) {
        console.error('Erro ao obter dados públicos da loja por ID:', error);
        res.json({ success: false, message: "Erro ao obter dados da loja" });
    }
};

export {
    createStore,
    getStore,
    updateStoreSettings,
    getStoreStats,
    checkPlanLimits,
    updateSubscription,
    loginStoreAdmin,
    getPublicStoreData,
    getPublicStoreMenu,
    updateStoreStatus,
    updateAutoAcceptOrders,
    getPublicStoreById
};
