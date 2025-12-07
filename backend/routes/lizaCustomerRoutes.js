import express from 'express';
import Customer from '../models/customerModel.js';
import authMiddleware from '../middleware/auth.js';
import { identifyStore, requireStoreAdmin } from '../middleware/multiTenancy.js';

const lizaCustomerRouter = express.Router();

// Rota para Liza consultar clientes por telefone
lizaCustomerRouter.get('/phone/:phone', authMiddleware, identifyStore, async (req, res) => {
    try {
        const { phone } = req.params;
        const { storeId } = req;

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: 'Número de telefone é obrigatório'
            });
        }

        // Buscar cliente por telefone e loja
        const customer = await Customer.findByPhoneAndStore(phone, storeId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado',
                data: null
            });
        }

        // Retornar dados básicos do cliente para a Liza
        const customerData = {
            _id: customer._id,
            name: customer.name,
            phone: customer.phone,
            whatsappNumber: customer.whatsappNumber,
            telegramUsername: customer.telegramUsername,
            allowWhatsappContact: customer.allowWhatsappContact,
            allowTelegramContact: customer.allowTelegramContact,
            customerSegment: customer.customerSegment,
            isActive: customer.isActive,
            totalOrders: customer.totalOrders,
            lastOrderDate: customer.lastOrderDate,
            createdAt: customer.createdAt
        };

        res.json({
            success: true,
            message: 'Cliente encontrado',
            data: customerData
        });

    } catch (error) {
        console.error('Erro ao buscar cliente por telefone:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Rota para Liza obter lista de clientes contactáveis
lizaCustomerRouter.get('/contactable', authMiddleware, identifyStore, async (req, res) => {
    try {
        const { storeId } = req;
        const { 
            segment = 'all', 
            contactMethod = 'whatsapp', 
            limit = 50,
            active = true 
        } = req.query;

        // Construir filtros
        const filters = {
            storeId: storeId,
            isActive: active === 'true',
            campaignOptOut: false
        };

        // Filtrar por segmento
        if (segment !== 'all') {
            filters.customerSegment = segment;
        }

        // Filtrar por método de contato (apenas WhatsApp)
        filters.allowWhatsappContact = true;
        filters.whatsappNumber = { $exists: true, $ne: '' };

        // Buscar clientes
        const customers = await Customer.find(filters)
            .select('name phone whatsappNumber customerSegment totalOrders lastOrderDate')
            .limit(parseInt(limit))
            .sort({ lastOrderDate: -1 });

        res.json({
            success: true,
            message: `${customers.length} clientes contactáveis encontrados`,
            data: customers,
            count: customers.length,
            filters: {
                segment,
                contactMethod: 'whatsapp',
                limit: parseInt(limit),
                active
            }
        });

    } catch (error) {
        console.error('Erro ao buscar clientes contactáveis:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Rota para Liza buscar clientes por nome ou telefone
lizaCustomerRouter.get('/search', authMiddleware, identifyStore, async (req, res) => {
    try {
        const { storeId } = req;
        const { query, limit = 10 } = req.query;

        if (!query || query.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Termo de busca deve ter pelo menos 2 caracteres'
            });
        }

        const searchTerm = query.trim();
        
        // Buscar por nome ou telefone
        const customers = await Customer.find({
            storeId: storeId,
            isActive: true,
            $or: [
                { name: { $regex: searchTerm, $options: 'i' } },
                { phone: { $regex: searchTerm } },
                { whatsappNumber: { $regex: searchTerm } }
            ]
        })
        .select('name phone whatsappNumber customerSegment totalOrders lastOrderDate')
        .limit(parseInt(limit))
        .sort({ name: 1 });

        res.json({
            success: true,
            message: `${customers.length} clientes encontrados`,
            data: customers,
            count: customers.length
        });

    } catch (error) {
        console.error('Erro ao buscar clientes:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

// Rota para Liza atualizar preferências de contato do cliente
lizaCustomerRouter.patch('/contact-preferences/:customerId', authMiddleware, identifyStore, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { storeId } = req;
        const { 
            allowWhatsappContact,
            campaignOptOut 
        } = req.body;

        // Verificar se o cliente pertence à loja
        const customer = await Customer.findOne({
            _id: customerId,
            storeId: storeId
        });

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }

        // Atualizar preferências
        const updateData = {};
        if (typeof allowWhatsappContact === 'boolean') {
            updateData.allowWhatsappContact = allowWhatsappContact;
        }
        
        if (typeof campaignOptOut === 'boolean') {
            updateData.campaignOptOut = campaignOptOut;
        }

        updateData.updatedAt = new Date();

        const updatedCustomer = await Customer.findByIdAndUpdate(
            customerId,
            updateData,
            { new: true }
        ).select('name phone allowWhatsappContact campaignOptOut');

        res.json({
            success: true,
            message: 'Preferências de contato atualizadas',
            data: updatedCustomer
        });

    } catch (error) {
        console.error('Erro ao atualizar preferências de contato:', error);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: error.message
        });
    }
});

export default lizaCustomerRouter;
