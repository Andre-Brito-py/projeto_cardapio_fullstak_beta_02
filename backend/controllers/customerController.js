import customerModel from '../models/customerModel.js';
import mongoose from 'mongoose';

/**
 * Buscar cliente por telefone e loja
 * @param {Object} req - Objeto de requisição contendo phone e storeId
 * @param {Object} res - Objeto de resposta
 */
const findCustomerByPhone = async (req, res) => {
    try {
        const { phone, storeId } = req.body;

        if (!phone || !storeId) {
            return res.json({
                success: false,
                message: 'Telefone e ID da loja são obrigatórios'
            });
        }

        // Validar se storeId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.json({
                success: false,
                message: 'ID da loja inválido'
            });
        }

        const customer = await customerModel.findByPhoneAndStore(phone, storeId);

        if (customer) {
            res.json({
                success: true,
                customer: {
                    _id: customer._id,
                    name: customer.name,
                    phone: customer.phone,
                    address: customer.address,
                    totalOrders: customer.totalOrders,
                    lastOrderDate: customer.lastOrderDate
                },
                isExistingCustomer: true
            });
        } else {
            res.json({
                success: true,
                customer: null,
                isExistingCustomer: false
            });
        }
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Criar novo cliente
 * @param {Object} req - Objeto de requisição contendo dados do cliente
 * @param {Object} res - Objeto de resposta
 */
const createCustomer = async (req, res) => {
    try {
        const { name, phone, address, storeId } = req.body;

        // Validações
        if (!name || !phone || !address || !storeId) {
            return res.json({
                success: false,
                message: 'Todos os campos são obrigatórios'
            });
        }

        // Validar se storeId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.json({
                success: false,
                message: 'ID da loja inválido'
            });
        }

        // Validar campos do endereço
        const requiredAddressFields = ['street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
        for (const field of requiredAddressFields) {
            if (!address[field]) {
                return res.json({
                    success: false,
                    message: `Campo ${field} do endereço é obrigatório`
                });
            }
        }

        // Verificar se cliente já existe
        const existingCustomer = await customerModel.findByPhoneAndStore(phone, storeId);
        if (existingCustomer) {
            return res.json({
                success: false,
                message: 'Cliente com este telefone já existe nesta loja'
            });
        }

        // Criar hash do telefone
        const phoneHash = customerModel.createPhoneHash(phone, storeId);

        // Criar novo cliente
        const newCustomer = new customerModel({
            name: name.trim(),
            phone: phone.trim(),
            address: {
                street: address.street.trim(),
                number: address.number.trim(),
                complement: address.complement ? address.complement.trim() : '',
                neighborhood: address.neighborhood.trim(),
                city: address.city.trim(),
                state: address.state.trim(),
                zipCode: address.zipCode.trim()
            },
            storeId,
            phoneHash
        });

        const savedCustomer = await newCustomer.save();

        res.json({
            success: true,
            message: 'Cliente criado com sucesso',
            customer: {
                _id: savedCustomer._id,
                name: savedCustomer.name,
                phone: savedCustomer.phone,
                address: savedCustomer.address,
                totalOrders: savedCustomer.totalOrders,
                lastOrderDate: savedCustomer.lastOrderDate
            }
        });
    } catch (error) {
        console.error('Erro ao criar cliente:', error);
        if (error.code === 11000) {
            res.json({
                success: false,
                message: 'Cliente com este telefone já existe nesta loja'
            });
        } else {
            res.json({
                success: false,
                message: 'Erro interno do servidor'
            });
        }
    }
};

/**
 * Atualizar dados do cliente
 * @param {Object} req - Objeto de requisição contendo ID e novos dados
 * @param {Object} res - Objeto de resposta
 */
const updateCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;
        const { name, phone, address } = req.body;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.json({
                success: false,
                message: 'ID do cliente inválido'
            });
        }

        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Atualizar campos se fornecidos
        if (name) customer.name = name.trim();
        if (phone) {
            // Verificar se novo telefone já existe para esta loja
            const existingCustomer = await customerModel.findByPhoneAndStore(phone, customer.storeId);
            if (existingCustomer && existingCustomer._id.toString() !== customerId) {
                return res.json({
                    success: false,
                    message: 'Telefone já está em uso por outro cliente'
                });
            }
            customer.phone = phone.trim();
            customer.phoneHash = customerModel.createPhoneHash(phone, customer.storeId);
        }
        if (address) {
            customer.address = {
                street: address.street ? address.street.trim() : customer.address.street,
                number: address.number ? address.number.trim() : customer.address.number,
                complement: address.complement ? address.complement.trim() : customer.address.complement,
                neighborhood: address.neighborhood ? address.neighborhood.trim() : customer.address.neighborhood,
                city: address.city ? address.city.trim() : customer.address.city,
                state: address.state ? address.state.trim() : customer.address.state,
                zipCode: address.zipCode ? address.zipCode.trim() : customer.address.zipCode
            };
        }

        const updatedCustomer = await customer.save();

        res.json({
            success: true,
            message: 'Cliente atualizado com sucesso',
            customer: {
                _id: updatedCustomer._id,
                name: updatedCustomer.name,
                phone: updatedCustomer.phone,
                address: updatedCustomer.address,
                totalOrders: updatedCustomer.totalOrders,
                lastOrderDate: updatedCustomer.lastOrderDate
            }
        });
    } catch (error) {
        console.error('Erro ao atualizar cliente:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Listar clientes de uma loja
 * @param {Object} req - Objeto de requisição contendo storeId
 * @param {Object} res - Objeto de resposta
 */
const getStoreCustomers = async (req, res) => {
    try {
        const { storeId } = req.params;
        const { page = 1, limit = 20, search = '' } = req.query;

        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.json({
                success: false,
                message: 'ID da loja inválido'
            });
        }

        // Construir filtro de busca
        const filter = { storeId, isActive: true };
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }

        // Calcular paginação
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Buscar clientes
        const customers = await customerModel
            .find(filter)
            .sort({ lastOrderDate: -1, createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .select('-phoneHash');

        // Contar total
        const total = await customerModel.countDocuments(filter);

        res.json({
            success: true,
            customers,
            pagination: {
                current: parseInt(page),
                total: Math.ceil(total / parseInt(limit)),
                count: customers.length,
                totalRecords: total
            }
        });
    } catch (error) {
        console.error('Erro ao listar clientes:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Obter detalhes de um cliente específico
 * @param {Object} req - Objeto de requisição contendo customerId
 * @param {Object} res - Objeto de resposta
 */
const getCustomerById = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.json({
                success: false,
                message: 'ID do cliente inválido'
            });
        }

        const customer = await customerModel
            .findById(customerId)
            .select('-phoneHash');

        if (!customer) {
            return res.json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.json({
            success: true,
            customer
        });
    } catch (error) {
        console.error('Erro ao buscar cliente:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

/**
 * Desativar cliente (soft delete)
 * @param {Object} req - Objeto de requisição contendo customerId
 * @param {Object} res - Objeto de resposta
 */
const deactivateCustomer = async (req, res) => {
    try {
        const { customerId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            return res.json({
                success: false,
                message: 'ID do cliente inválido'
            });
        }

        const customer = await customerModel.findByIdAndUpdate(
            customerId,
            { isActive: false },
            { new: true }
        );

        if (!customer) {
            return res.json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.json({
            success: true,
            message: 'Cliente desativado com sucesso'
        });
    } catch (error) {
        console.error('Erro ao desativar cliente:', error);
        res.json({
            success: false,
            message: 'Erro interno do servidor'
        });
    }
};

// POST /api/register - Cadastra ou retorna cliente existente (Sistema de cadastro automático)
const registerCustomer = async (req, res) => {
    try {
        const { phone, storeId, clientId, lgpdConsent } = req.body;

        // Validação dos dados obrigatórios
        if (!phone || !storeId) {
            return res.status(400).json({
                success: false,
                message: 'Telefone e ID da loja são obrigatórios'
            });
        }

        // Validar se storeId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({
                success: false,
                message: 'ID da loja inválido'
            });
        }

        // Limpar e formatar telefone
        const cleanPhone = phone.replace(/\D/g, '');
        
        // Verificar se cliente já existe
        let customer = await customerModel.findByPhoneAndStore(cleanPhone, storeId);
        
        if (customer) {
            // Cliente existe, retornar dados
            return res.status(200).json({
                success: true,
                message: 'Cliente encontrado',
                data: {
                    clientId: customer.clientId,
                    phone: customer.phone,
                    name: customer.name,
                    addresses: customer.addresses,
                    orderHistory: customer.orderHistory.slice(-10), // Últimos 10 pedidos
                    statistics: customer.statistics,
                    isExisting: true
                }
            });
        }

        // Cliente não existe, criar novo
        const newClientId = clientId || customerModel.generateClientId();
        const phoneHash = customerModel.createPhoneHash(cleanPhone, storeId);

        customer = new customerModel({
            clientId: newClientId,
            phone: cleanPhone,
            storeId,
            phoneHash,
            lgpdConsent: {
                consentGiven: lgpdConsent || false,
                consentDate: lgpdConsent ? new Date() : null,
                dataUsagePurpose: "Histórico de pedidos e facilitar próximas compras"
            }
        });

        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Cliente cadastrado com sucesso',
            data: {
                clientId: customer.clientId,
                phone: customer.phone,
                name: customer.name,
                addresses: customer.addresses,
                orderHistory: customer.orderHistory,
                statistics: customer.statistics,
                isExisting: false
            }
        });

    } catch (error) {
        console.error('Erro ao registrar cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// POST /api/address - Adiciona um endereço ao cliente
const addAddress = async (req, res) => {
    try {
        const { clientId, address } = req.body;

        // Validação dos dados obrigatórios
        if (!clientId || !address) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente e dados do endereço são obrigatórios'
            });
        }

        // Validar campos obrigatórios do endereço
        const requiredFields = ['label', 'street', 'number', 'neighborhood', 'city', 'state', 'zipCode'];
        const missingFields = requiredFields.filter(field => !address[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
            });
        }

        // Buscar cliente
        const customer = await customerModel.findOne({ clientId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Verificar se já existe endereço com o mesmo label
        const existingAddress = customer.addresses.find(addr => 
            addr.label.toLowerCase() === address.label.toLowerCase()
        );

        if (existingAddress) {
            return res.status(400).json({
                success: false,
                message: `Já existe um endereço com o rótulo "${address.label}"`
            });
        }

        // Adicionar endereço
        const newAddress = customer.addAddress(address);
        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Endereço adicionado com sucesso',
            data: {
                address: newAddress,
                totalAddresses: customer.addresses.length
            }
        });

    } catch (error) {
        console.error('Erro ao adicionar endereço:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// GET /api/addresses - Lista endereços do cliente
const getAddresses = async (req, res) => {
    try {
        const { clientId } = req.query;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente é obrigatório'
            });
        }

        const customer = await customerModel.findOne({ clientId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        res.status(200).json({
            success: true,
            data: {
                addresses: customer.addresses,
                defaultAddress: customer.getDefaultAddress()
            }
        });

    } catch (error) {
        console.error('Erro ao buscar endereços:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// POST /api/order - Adiciona pedido ao histórico
const addOrder = async (req, res) => {
    try {
        const { clientId, order } = req.body;

        // Validação dos dados obrigatórios
        if (!clientId || !order) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente e dados do pedido são obrigatórios'
            });
        }

        // Validar campos obrigatórios do pedido
        const requiredFields = ['orderId', 'items', 'totalAmount'];
        const missingFields = requiredFields.filter(field => !order[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Campos obrigatórios faltando: ${missingFields.join(', ')}`
            });
        }

        // Buscar cliente
        const customer = await customerModel.findOne({ clientId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Adicionar pedido ao histórico
        const newOrder = customer.addOrderToHistory(order);
        await customer.save();

        res.status(201).json({
            success: true,
            message: 'Pedido adicionado ao histórico com sucesso',
            data: {
                order: newOrder,
                statistics: customer.statistics
            }
        });

    } catch (error) {
        console.error('Erro ao adicionar pedido:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// GET /api/orders - Lista histórico de pedidos do cliente
const getOrders = async (req, res) => {
    try {
        const { clientId, limit = 10 } = req.query;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente é obrigatório'
            });
        }

        const customer = await customerModel.findOne({ clientId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Ordenar por data mais recente e limitar resultados
        const orders = customer.orderHistory
            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
            .slice(0, parseInt(limit));

        res.status(200).json({
            success: true,
            data: {
                orders,
                statistics: customer.statistics,
                totalOrders: customer.orderHistory.length
            }
        });

    } catch (error) {
        console.error('Erro ao buscar pedidos:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// DELETE /api/customer/:clientId - Exclusão de dados (LGPD)
const deleteCustomerData = async (req, res) => {
    try {
        const { clientId } = req.params;
        const { confirmDelete } = req.body;

        if (!clientId) {
            return res.status(400).json({
                success: false,
                message: 'ID do cliente é obrigatório'
            });
        }

        if (!confirmDelete) {
            return res.status(400).json({
                success: false,
                message: 'Confirmação de exclusão é obrigatória'
            });
        }

        const customer = await customerModel.findOne({ clientId });
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Log da exclusão para auditoria
        console.log(`LGPD: Exclusão de dados solicitada para cliente ${clientId} em ${new Date().toISOString()}`);

        // Remover cliente do banco de dados
        await customerModel.deleteOne({ clientId });

        res.status(200).json({
            success: true,
            message: 'Dados do cliente excluídos com sucesso conforme LGPD'
        });

    } catch (error) {
        console.error('Erro ao excluir dados do cliente:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// GET /api/customers - Lista clientes para admin (com paginação)
const getCustomersForAdmin = async (req, res) => {
    try {
        const { 
            storeId, 
            page = 1, 
            limit = 20, 
            segment, 
            search,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        if (!storeId) {
            return res.status(400).json({
                success: false,
                message: 'ID da loja é obrigatório'
            });
        }

        // Validar se storeId é um ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(storeId)) {
            return res.status(400).json({
                success: false,
                message: 'ID da loja inválido'
            });
        }

        // Construir query de busca
        const query = { storeId };
        
        if (segment && segment !== 'all') {
            query.customerSegment = segment;
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        // Configurar ordenação
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

        // Executar consulta com paginação
        const skip = (parseInt(page) - 1) * parseInt(limit);
        
        const [customers, totalCount] = await Promise.all([
            customerModel.find(query)
                .select('clientId name phone email customerSegment totalOrders statistics.totalSpent statistics.lastOrderDate createdAt isActive')
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit)),
            customerModel.countDocuments(query)
        ]);

        // Calcular estatísticas gerais
        const analytics = await customerModel.getCustomerAnalytics(storeId);

        res.status(200).json({
            success: true,
            data: {
                customers,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(totalCount / parseInt(limit)),
                    totalCount,
                    hasNext: skip + customers.length < totalCount,
                    hasPrev: parseInt(page) > 1
                },
                analytics
            }
        });

    } catch (error) {
        console.error('Erro ao buscar clientes para admin:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

export {
    findCustomerByPhone,
    createCustomer,
    updateCustomer,
    getStoreCustomers,
    getCustomerById,
    deactivateCustomer,
    // Novas funções para cadastro automático
    registerCustomer,
    addAddress,
    getAddresses,
    addOrder,
    getOrders,
    deleteCustomerData,
    getCustomersForAdmin
};