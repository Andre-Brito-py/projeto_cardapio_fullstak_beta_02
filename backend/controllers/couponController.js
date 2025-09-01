import couponModel from '../models/couponModel.js';
import orderModel from '../models/orderModel.js';
import userModel from '../models/userModel.js';

// Criar novo cupom
const createCoupon = async (req, res) => {
    try {
        const {
            code,
            name,
            description,
            discountType,
            discountValue,
            minOrderValue,
            maxDiscountAmount,
            maxUses,
            maxUsesPerUser,
            validFrom,
            validUntil,
            applicableCategories,
            applicableStores,
            excludedItems,
            firstTimeUserOnly
        } = req.body;

        // Verificar se o código já existe
        const existingCoupon = await couponModel.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            return res.json({ success: false, message: "Código de cupom já existe" });
        }

        // Validações básicas
        if (discountType === 'percentage' && discountValue > 100) {
            return res.json({ success: false, message: "Desconto percentual não pode ser maior que 100%" });
        }

        if (new Date(validFrom) >= new Date(validUntil)) {
            return res.json({ success: false, message: "Data de início deve ser anterior à data de fim" });
        }

        const newCoupon = new couponModel({
            code: code.toUpperCase(),
            name,
            description,
            discountType,
            discountValue,
            minOrderValue: minOrderValue || 0,
            maxDiscountAmount,
            maxUses,
            maxUsesPerUser: maxUsesPerUser || 1,
            validFrom: validFrom || new Date(),
            validUntil,
            applicableCategories: applicableCategories || [],
            applicableStores: applicableStores || [],
            excludedItems: excludedItems || [],
            firstTimeUserOnly: firstTimeUserOnly || false,
            createdBy: req.user ? req.user._id : req.body.createdBy
        });

        await newCoupon.save();
        res.json({ success: true, message: "Cupom criado com sucesso", data: newCoupon });
    } catch (error) {
        console.error('Erro ao criar cupom:', error);
        res.json({ success: false, message: "Erro ao criar cupom" });
    }
};

// Listar todos os cupons
const listCoupons = async (req, res) => {
    try {
        // Filter by store in multi-tenant context if needed
        const storeId = req.store ? req.store._id : null;
        let query = {};
        
        // Se há contexto de loja, filtrar cupons aplicáveis
        if (storeId) {
            query = {
                $or: [
                    { applicableStores: { $size: 0 } }, // Cupons para todas as lojas
                    { applicableStores: storeId } // Cupons específicos para esta loja
                ]
            };
        }

        const coupons = await couponModel.find(query)
            .populate('applicableCategories', 'name')
            .populate('applicableStores', 'name')
            .populate('excludedItems', 'name')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.json({ success: true, data: coupons });
    } catch (error) {
        console.error('Erro ao listar cupons:', error);
        res.json({ success: false, message: "Erro ao listar cupons" });
    }
};

// Obter cupom por ID
const getCoupon = async (req, res) => {
    try {
        const coupon = await couponModel.findById(req.params.id)
            .populate('applicableCategories', 'name')
            .populate('applicableStores', 'name')
            .populate('excludedItems', 'name')
            .populate('createdBy', 'name email');

        if (!coupon) {
            return res.json({ success: false, message: "Cupom não encontrado" });
        }

        res.json({ success: true, data: coupon });
    } catch (error) {
        console.error('Erro ao buscar cupom:', error);
        res.json({ success: false, message: "Erro ao buscar cupom" });
    }
};

// Atualizar cupom
const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = { ...req.body };

        // Se o código foi alterado, verificar se já existe
        if (updateData.code) {
            updateData.code = updateData.code.toUpperCase();
            const existingCoupon = await couponModel.findOne({ 
                code: updateData.code, 
                _id: { $ne: id } 
            });
            if (existingCoupon) {
                return res.json({ success: false, message: "Código de cupom já existe" });
            }
        }

        // Validações
        if (updateData.discountType === 'percentage' && updateData.discountValue > 100) {
            return res.json({ success: false, message: "Desconto percentual não pode ser maior que 100%" });
        }

        if (updateData.validFrom && updateData.validUntil && 
            new Date(updateData.validFrom) >= new Date(updateData.validUntil)) {
            return res.json({ success: false, message: "Data de início deve ser anterior à data de fim" });
        }

        const updatedCoupon = await couponModel.findByIdAndUpdate(
            id, 
            updateData, 
            { new: true, runValidators: true }
        ).populate('applicableCategories', 'name')
         .populate('applicableStores', 'name')
         .populate('excludedItems', 'name');

        if (!updatedCoupon) {
            return res.json({ success: false, message: "Cupom não encontrado" });
        }

        res.json({ success: true, message: "Cupom atualizado com sucesso", data: updatedCoupon });
    } catch (error) {
        console.error('Erro ao atualizar cupom:', error);
        res.json({ success: false, message: "Erro ao atualizar cupom" });
    }
};

// Deletar cupom
const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        
        const deletedCoupon = await couponModel.findByIdAndDelete(id);
        
        if (!deletedCoupon) {
            return res.json({ success: false, message: "Cupom não encontrado" });
        }

        res.json({ success: true, message: "Cupom deletado com sucesso" });
    } catch (error) {
        console.error('Erro ao deletar cupom:', error);
        res.json({ success: false, message: "Erro ao deletar cupom" });
    }
};

// Validar cupom (para uso no frontend)
const validateCoupon = async (req, res) => {
    try {
        const { code, userId, orderAmount, items = [] } = req.body;
        
        if (!code || !orderAmount) {
            return res.json({ success: false, message: "Código do cupom e valor do pedido são obrigatórios" });
        }

        // Buscar cupom
        const coupon = await couponModel.findOne({ 
            code: code.toUpperCase(),
            isActive: true 
        }).populate('applicableCategories excludedItems applicableStores');

        if (!coupon) {
            return res.json({ success: false, message: "Cupom não encontrado ou inativo" });
        }

        // Verificar validade básica
        if (!coupon.isValid()) {
            return res.json({ success: false, message: "Cupom expirado ou esgotado" });
        }

        // Verificar valor mínimo do pedido
        if (orderAmount < coupon.minOrderValue) {
            return res.json({ 
                success: false, 
                message: `Valor mínimo do pedido deve ser R$ ${coupon.minOrderValue.toFixed(2)}` 
            });
        }

        // Verificar se é para novos usuários apenas
        if (userId && coupon.firstTimeUserOnly) {
            const userOrderCount = await orderModel.countDocuments({ 
                userId: userId, 
                payment: true 
            });
            
            if (!coupon.canBeUsedByUser(userId, userOrderCount)) {
                return res.json({ success: false, message: "Este cupom é apenas para novos usuários" });
            }
        }

        // Verificar limite de uso por usuário
        if (userId && coupon.maxUsesPerUser) {
            const userUsageCount = await orderModel.countDocuments({
                userId: userId,
                couponCode: coupon.code,
                payment: true
            });
            
            if (userUsageCount >= coupon.maxUsesPerUser) {
                return res.json({ success: false, message: "Você já atingiu o limite de uso deste cupom" });
            }
        }

        // Calcular desconto
        let applicableAmount = orderAmount;
        
        // Se há categorias específicas, calcular apenas sobre itens aplicáveis
        if (coupon.applicableCategories.length > 0 && items.length > 0) {
            const applicableCategoryIds = coupon.applicableCategories.map(cat => cat._id.toString());
            applicableAmount = items
                .filter(item => applicableCategoryIds.includes(item.categoryId))
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        }

        // Excluir itens específicos
        if (coupon.excludedItems.length > 0 && items.length > 0) {
            const excludedItemIds = coupon.excludedItems.map(item => item._id.toString());
            const excludedAmount = items
                .filter(item => excludedItemIds.includes(item._id))
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            applicableAmount -= excludedAmount;
        }

        const discountAmount = coupon.calculateDiscount(orderAmount, applicableAmount);
        
        res.json({ 
            success: true, 
            message: "Cupom válido",
            data: {
                coupon: {
                    code: coupon.code,
                    name: coupon.name,
                    discountType: coupon.discountType,
                    discountValue: coupon.discountValue
                },
                discountAmount,
                finalAmount: Math.max(0, orderAmount - discountAmount)
            }
        });
    } catch (error) {
        console.error('Erro ao validar cupom:', error);
        res.json({ success: false, message: "Erro ao validar cupom" });
    }
};

// Ativar/Desativar cupom
const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        
        const updatedCoupon = await couponModel.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );
        
        if (!updatedCoupon) {
            return res.json({ success: false, message: "Cupom não encontrado" });
        }
        
        res.json({ 
            success: true, 
            message: `Cupom ${isActive ? 'ativado' : 'desativado'} com sucesso`,
            data: updatedCoupon 
        });
    } catch (error) {
        console.error('Erro ao alterar status do cupom:', error);
        res.json({ success: false, message: "Erro ao alterar status do cupom" });
    }
};

// Obter estatísticas de uso do cupom
const getCouponStats = async (req, res) => {
    try {
        const { id } = req.params;
        
        const coupon = await couponModel.findById(id);
        if (!coupon) {
            return res.json({ success: false, message: "Cupom não encontrado" });
        }
        
        // Buscar pedidos que usaram este cupom
        const orders = await orderModel.find({ 
            couponCode: coupon.code,
            payment: true 
        }).select('amount discountAmount date userId');
        
        const stats = {
            totalUses: orders.length,
            totalDiscountGiven: orders.reduce((sum, order) => sum + (order.discountAmount || 0), 0),
            totalOrderValue: orders.reduce((sum, order) => sum + order.amount, 0),
            uniqueUsers: [...new Set(orders.map(order => order.userId))].length,
            usageByMonth: {}
        };
        
        // Agrupar por mês
        orders.forEach(order => {
            const month = new Date(order.date).toISOString().slice(0, 7); // YYYY-MM
            if (!stats.usageByMonth[month]) {
                stats.usageByMonth[month] = { count: 0, discount: 0, revenue: 0 };
            }
            stats.usageByMonth[month].count++;
            stats.usageByMonth[month].discount += order.discountAmount || 0;
            stats.usageByMonth[month].revenue += order.amount;
        });
        
        res.json({ success: true, data: stats });
    } catch (error) {
        console.error('Erro ao obter estatísticas do cupom:', error);
        res.json({ success: false, message: "Erro ao obter estatísticas do cupom" });
    }
};

export {
    createCoupon,
    listCoupons,
    getCoupon,
    updateCoupon,
    deleteCoupon,
    validateCoupon,
    toggleCouponStatus,
    getCouponStats
};