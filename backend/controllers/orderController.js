import orderModel from './../models/orderModel.js';
import userModel from './../models/userModel.js';
import Store from './../models/storeModel.js';
import tableModel from './../models/tableModel.js';
import couponModel from './../models/couponModel.js';
import Stripe from "stripe"

const stripe =  new Stripe(process.env.STRIPE_SECRET_KEY)

// Placing user order for frontend
const placeOrder = async (req, res) =>{

    const frontend_url = 'https://full-stack-food-delivery-web-application-a75a.onrender.com';
    try {
        // Get storeId from request context (added by middleware)
        const storeId = req.store ? req.store._id : req.body.storeId;
        
        if (!storeId) {
            return res.json({success: false, message: "Store ID is required"});
        }

        // Prepare order data
        let finalAmount = req.body.amount;
        let discountAmount = 0;
        let couponData = {};
        
        // Process coupon if provided
        if (req.body.couponCode) {
            const coupon = await couponModel.findOne({ 
                code: req.body.couponCode.toUpperCase(),
                isActive: true 
            });
            
            if (coupon && coupon.isValid()) {
                // Verify coupon can be used
                if (req.body.amount >= coupon.minOrderValue) {
                    // Check user usage limit
                    const userUsageCount = await orderModel.countDocuments({
                        userId: req.body.userId,
                        couponCode: coupon.code,
                        payment: true
                    });
                    
                    if (userUsageCount < coupon.maxUsesPerUser) {
                        // Calculate discount
                        discountAmount = coupon.calculateDiscount(req.body.amount);
                        finalAmount = Math.max(0, req.body.amount - discountAmount);
                        
                        couponData = {
                            couponCode: coupon.code,
                            couponId: coupon._id,
                            discountAmount: discountAmount,
                            originalAmount: req.body.amount
                        };
                    }
                }
            }
        }
        
        const orderData = {
            userId: req.body.userId, // Pode ser null para usuários não autenticados
            storeId: storeId,
            items: req.body.items,
            amount: finalAmount,
            address: req.body.address,
            orderType: req.body.orderType || req.body.deliveryType || 'delivery',
            deliveryType: req.body.deliveryType || 'delivery', // Campo para rastrear tipo de saída
            paymentMethod: req.body.paymentMethod || null, // Método de pagamento escolhido pelo cliente
            customerId: req.body.customerId || null, // Referência ao cliente
            customerInfo: req.body.customerInfo || null, // Informações do cliente para backup
            // Dados de frete do Google Maps
            shipping: req.body.shippingData ? {
                fee: req.body.deliveryFee || 0,
                distance: req.body.shippingData.distanceKm,
                duration: req.body.shippingData.durationMinutes,
                calculatedBy: req.body.shippingData.calculatedBy || 'manual',
                googleMapsData: req.body.shippingData.calculatedBy === 'google_maps' ? {
                    distance: req.body.shippingData.distance,
                    duration: req.body.shippingData.duration,
                    status: req.body.shippingData.status
                } : null
            } : {
                fee: req.body.deliveryFee || 0,
                calculatedBy: 'manual'
            },
            ...couponData
        };
        
        // If tableId is provided, get table information and add to order
        if (req.body.tableId) {
            const table = await tableModel.findById(req.body.tableId);
            if (table && table.storeId.toString() === storeId.toString()) {
                orderData.tableId = table._id;
                orderData.tableNumber = table.tableNumber;
                orderData.tableName = table.displayName;
                orderData.orderType = 'dine_in';
            }
        }
        
        const newOrder = new orderModel(orderData)

        await newOrder.save();
        
        // Não limpar carrinho aqui - será limpo apenas após confirmação do pagamento

        const line_items = req.body.items.map((item)=>{
            // Calcular preço total do item incluindo extras
            let totalPrice = item.price;
            let itemName = item.name;
            
            // Adicionar preço dos extras
            if (item.extras && item.extras.length > 0) {
                const extrasPrice = item.extras.reduce((sum, extra) => sum + extra.price, 0);
                totalPrice += extrasPrice;
                
                // Adicionar extras ao nome do produto
                const extrasNames = item.extras.map(extra => extra.name).join(', ');
                itemName += ` (+ ${extrasNames})`;
            }
            
            // Adicionar observações ao nome se existirem
            if (item.observations && item.observations.trim()) {
                itemName += ` - Obs: ${item.observations.trim()}`;
            }
            
            return {
                price_data: {
                    currency: "INR",
                    product_data: {
                        name: itemName
                    },
                    unit_amount: Math.round(totalPrice * 100)
                },
                quantity: item.quantity
            };
        })

        // A taxa de entrega agora é calculada dinamicamente no frontend
        // e já está incluída no amount total do pedido
        if (req.body.deliveryFee && req.body.deliveryFee > 0) {
            line_items.push({
                price_data :{
                    currency:"INR",
                    product_data:{
                        name:"Delivery Charges"
                    },
                    unit_amount:req.body.deliveryFee*100
                },
                quantity:1
            })
        }

        // Add discount to line items if applicable
        if (discountAmount > 0) {
            line_items.push({
                price_data: {
                    currency: "INR",
                    product_data: {
                        name: `Desconto - ${req.body.couponCode}`
                    },
                    unit_amount: -Math.round(discountAmount * 100)
                },
                quantity: 1
            });
        }
        
        const session = await stripe.checkout.sessions.create({
            line_items:line_items,
            mode:'payment',
            success_url:`${frontend_url}/verify?success=true&orderId=${newOrder._id}`,
            cancel_url:`${frontend_url}/verify?success=false&orderId=${newOrder._id}`
        })

        res.json({success:true, session_url:session.url})
    } catch (error) {
        console.error('Erro ao criar pedido:', error);
        res.json({success:false, message:"Error", details: error.message})
    }
}

const verifyOrder = async (req, res) =>{
    const {orderId, success} = req.body;
    try {
        if(success=='true'){
            // Find the order to get store information
            const order = await orderModel.findById(orderId);
            if (!order) {
                return res.json({success:false, message:"Order not found"});
            }

            // Get store settings to check auto-accept configuration
            const store = await Store.findById(order.storeId);
            
            // Update payment status
            const updateData = { payment: true };
            
            // If auto-accept is enabled, automatically accept the order
            if (store && store.settings && store.settings.autoAcceptOrders) {
                updateData.status = "Confirmed";
            }
            
            await orderModel.findByIdAndUpdate(orderId, updateData);
            
            // Update coupon usage count if coupon was used
            if (order.couponCode) {
                await couponModel.findOneAndUpdate(
                    { code: order.couponCode },
                    { $inc: { usedCount: 1 } }
                );
            }
            
            // Limpar carrinho apenas após confirmação do pagamento
            if (order.userId) {
                await userModel.findByIdAndUpdate(order.userId, {cartData:{}});
            }
            
            res.json({success:true, message:"Paid"})
        }else{
            await orderModel.findByIdAndDelete(orderId);
            res.json({success:false, message:"Not Paid"})
        }
    } catch (error) {
        console.error('Erro ao verificar pedido:', error);
        res.json({success:false, message:"Error"})
    }
}

// user orders for frontend
const userOrders = async (req,res) => {
    try {
        const orders = await orderModel.find({userId:req.body.userId})
        res.json({success:true, data:orders})
    } catch (error) {
        console.error('Erro ao buscar pedidos do usuário:', error);
        res.json({success:false, message:"Error"})
    }
}

// listing orders for admin panel
const listOrders = async (req,res) =>{
   try {
    // Filter orders by store in multi-tenant context
    const storeId = req.store ? req.store._id : null;
    const query = storeId ? { storeId: storeId } : {};
    
    const orders = await orderModel.find(query)
        .populate('tableId', 'tableNumber displayName capacity location')
        .sort({ date: -1 });
    res.json({success:true, data:orders})
   } catch (error) {
        console.error('Erro ao listar pedidos:', error);
        res.json({success:false, message:"Error"})  
   } 
}

// api for updating order status
const updateStatus = async (req, res) =>{
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId,{status:req.body.status})
        res.json({success:true, message:"Status Updated"})
    } catch (error) {
        res.json({success:false, message:"Error"})  
    }
}

export {placeOrder, verifyOrder, userOrders,listOrders, updateStatus}
