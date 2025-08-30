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

export {
    findCustomerByPhone,
    createCustomer,
    updateCustomer,
    getStoreCustomers,
    getCustomerById,
    deactivateCustomer
};