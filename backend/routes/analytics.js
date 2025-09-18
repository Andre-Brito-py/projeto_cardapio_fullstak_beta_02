import express from 'express';
import customerModel from '../models/customerModel.js';
import authMiddleware from '../middleware/auth.js';

const analyticsRouter = express.Router();

// Get customer analytics for dashboard
analyticsRouter.get('/customers/:storeId', authMiddleware, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { dateRange = 30 } = req.query;
        
        // Update customer segments before getting analytics
        await customerModel.updateCustomerSegments(storeId);
        
        const analytics = await customerModel.getCustomerAnalytics(storeId, parseInt(dateRange));
        
        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        console.error('Error getting customer analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter analytics de clientes',
            error: error.message
        });
    }
});

// Get contactable customers for Liza campaigns
analyticsRouter.get('/customers/:storeId/contactable', authMiddleware, async (req, res) => {
    try {
        const { storeId } = req.params;
        const { segment, contactMethod = 'whatsapp' } = req.query;
        
        const customers = await customerModel.getContactableCustomers(storeId, segment, contactMethod);
        
        res.json({
            success: true,
            data: customers,
            count: customers.length
        });
    } catch (error) {
        console.error('Error getting contactable customers:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter clientes para contato',
            error: error.message
        });
    }
});

// Update customer contact preferences
analyticsRouter.put('/customers/:customerId/contact-preferences', authMiddleware, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { 
            whatsappNumber, 
            telegramUsername, 
            allowWhatsappContact, 
            allowTelegramContact, 
            campaignOptOut 
        } = req.body;
        
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }
        
        // Update contact preferences
        if (whatsappNumber !== undefined) customer.whatsappNumber = whatsappNumber;
        if (telegramUsername !== undefined) customer.telegramUsername = telegramUsername;
        if (allowWhatsappContact !== undefined) customer.allowWhatsappContact = allowWhatsappContact;
        if (allowTelegramContact !== undefined) customer.allowTelegramContact = allowTelegramContact;
        if (campaignOptOut !== undefined) customer.campaignOptOut = campaignOptOut;
        
        customer.updatedAt = new Date();
        await customer.save();
        
        res.json({
            success: true,
            message: 'Preferências de contato atualizadas com sucesso',
            data: customer
        });
    } catch (error) {
        console.error('Error updating contact preferences:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao atualizar preferências de contato',
            error: error.message
        });
    }
});

// Mark customer as contacted for campaign tracking
analyticsRouter.post('/customers/:customerId/mark-contacted', authMiddleware, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { campaignType, contactMethod } = req.body;
        
        const customer = await customerModel.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: 'Cliente não encontrado'
            });
        }
        
        customer.lastCampaignContact = new Date();
        await customer.save();
        
        res.json({
            success: true,
            message: 'Cliente marcado como contatado',
            data: {
                customerId,
                campaignType,
                contactMethod,
                contactedAt: customer.lastCampaignContact
            }
        });
    } catch (error) {
        console.error('Error marking customer as contacted:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao marcar cliente como contatado',
            error: error.message
        });
    }
});

// Get customer segments summary
analyticsRouter.get('/customers/:storeId/segments', authMiddleware, async (req, res) => {
    try {
        const { storeId } = req.params;
        
        // Update segments first
        await customerModel.updateCustomerSegments(storeId);
        
        const segments = await customerModel.aggregate([
            { $match: { storeId: new customerModel.base.Types.ObjectId(storeId) } },
            {
                $group: {
                    _id: '$customerSegment',
                    count: { $sum: 1 },
                    totalOrders: { $sum: '$totalOrders' },
                    avgOrders: { $avg: '$totalOrders' },
                    contactableWhatsapp: {
                        $sum: {
                            $cond: [
                                { $and: ['$allowWhatsappContact', { $ne: ['$whatsappNumber', ''] }] },
                                1,
                                0
                            ]
                        }
                    },
                    contactableTelegram: {
                        $sum: {
                            $cond: [
                                { $and: ['$allowTelegramContact', { $ne: ['$telegramUsername', ''] }] },
                                1,
                                0
                            ]
                        }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        res.json({
            success: true,
            data: segments
        });
    } catch (error) {
        console.error('Error getting customer segments:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao obter segmentos de clientes',
            error: error.message
        });
    }
});

export default analyticsRouter;