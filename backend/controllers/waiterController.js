import { generateWaiterToken, generateWaiterLink } from '../middleware/waiterAuth.js';
import storeModel from '../models/storeModel.js';
import orderModel from '../models/orderModel.js';
import { FRONTEND_URL } from '../config/urls.js';

// Gerar link de acesso para garçom
const generateAccessLink = async (req, res) => {
    try {
        const storeId = req.storeId || req.user?.storeId?._id || req.user?.storeId;
        
        if (!storeId) {
            return res.status(400).json({ 
                success: false, 
                message: "ID da loja não encontrado" 
            });
        }

        // Verificar se a loja existe
        const store = await storeModel.findById(storeId);
        if (!store) {
            return res.status(404).json({ 
                success: false, 
                message: "Loja não encontrada" 
            });
        }

        // Gerar token e link
        const token = generateWaiterToken(storeId);
        const baseUrl = req.body.baseUrl || FRONTEND_URL;
        const accessLink = generateWaiterLink(storeId, baseUrl);

        res.json({
            success: true,
            data: {
                token,
                accessLink,
                storeId,
                storeName: store.name,
                expiresIn: '30 dias'
            }
        });
    } catch (error) {
        console.log('Erro ao gerar link de acesso:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erro ao gerar link de acesso" 
        });
    }
};

// Validar token de garçom
const validateWaiterToken = async (req, res) => {
    try {
        const { token } = req.body;
        
        if (!token) {
            return res.status(400).json({ 
                success: false, 
                message: "Token não fornecido" 
            });
        }

        // O middleware waiterAuth já validou o token
        // Se chegou até aqui, o token é válido
        res.json({
            success: true,
            data: {
                valid: true,
                storeId: req.waiter.storeId,
                storeName: req.waiter.storeName
            }
        });
    } catch (error) {
        console.log('Erro ao validar token:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erro ao validar token" 
        });
    }
};

// Fazer pedido como garçom
const placeWaiterOrder = async (req, res) => {
    try {
        const { tableId, items, notes, customerName, customerPhone } = req.body;
        const storeId = req.waiter.storeId;
        
        if (!tableId || !items || items.length === 0) {
            return res.status(400).json({ 
                success: false, 
                message: "Mesa e itens são obrigatórios" 
            });
        }

        // Calcular total
        let amount = 0;
        for (const item of items) {
            amount += item.price * item.quantity;
        }

        // Criar pedido
        const newOrder = new orderModel({
            userId: null, // Pedido feito pelo garçom
            storeId,
            tableId,
            items,
            amount,
            address: { // Endereço padrão para pedidos de mesa
                firstName: customerName || 'Cliente',
                lastName: '',
                email: '',
                street: 'Mesa',
                city: 'Restaurante',
                state: '',
                zipcode: '',
                country: 'Brasil',
                phone: customerPhone || ''
            },
            status: 'Food Processing',
            date: Date.now(),
            payment: false,
            paymentMethod: 'Dinheiro', // Padrão para pedidos de garçom
            notes: notes || '',
            orderType: 'dine_in', // Pedido para consumo no local
            waiterToken: req.waiter.token
        });

        await newOrder.save();

        res.json({
            success: true,
            message: "Pedido realizado com sucesso",
            data: {
                orderId: newOrder._id,
                amount,
                status: newOrder.status
            }
        });
    } catch (error) {
        console.log('Erro ao fazer pedido:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erro ao processar pedido" 
        });
    }
};

// Listar pedidos da mesa (para garçom)
const getTableOrders = async (req, res) => {
    try {
        const { tableId } = req.params;
        const storeId = req.waiter.storeId;
        
        const orders = await orderModel.find({ 
            storeId, 
            tableId,
            status: { $nin: ['Delivered', 'Cancelled'] } // Apenas pedidos ativos
        }).sort({ date: -1 });

        res.json({
            success: true,
            data: orders
        });
    } catch (error) {
        console.log('Erro ao buscar pedidos da mesa:', error);
        res.status(500).json({ 
            success: false, 
            message: "Erro ao buscar pedidos" 
        });
    }
};

export {
    generateAccessLink,
    validateWaiterToken,
    placeWaiterOrder,
    getTableOrders
};