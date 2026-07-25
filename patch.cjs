const fs = require('fs');

const targetFile = 'backend/controllers/orderController.js';
let code = fs.readFileSync(targetFile, 'utf8');

if (!code.includes("import foodModel")) {
    code = code.replace("import couponModel from './../models/couponModel.js';", "import couponModel from './../models/couponModel.js';\nimport foodModel from './../models/foodModel.js';");
}

const targetStart = `        // Prepare order data
        let finalAmount = req.body.amount;
        let discountAmount = 0;
        let couponData = {};`;

const targetEnd = `        // Não limpar carrinho aqui - será limpo apenas após confirmação do pagamento

        const line_items = req.body.items.map((item)=>{
            // Calcular preço total do item incluindo extras
            let totalPrice = item.price;
            let itemName = item.name;`;

const newCode = `        // Validar e recalcular preços dos itens de forma segura via backend
        let subtotalSeguro = 0;
        let secureItems = [];

        for (const item of req.body.items) {
            const food = await foodModel.findById(item._id);
            if (!food) {
                return res.json({success: false, message: \`Produto não encontrado: \${item.name}\`});
            }

            // Validar se o produto pertence à loja do pedido
            if (food.storeId && storeId && food.storeId.toString() !== storeId.toString()) {
                return res.json({success: false, message: \`Produto \${food.name} não pertence a esta loja.\`});
            }

            let precoItem = food.price;
            let secureExtras = [];

            // Validar extras
            if (item.extras && item.extras.length > 0) {
                for (const extra of item.extras) {
                    const oldExtra = food.extras?.find(e => e.name === extra.name);
                    let newExtra = null;
                    
                    if (food.categoryAddons) {
                        for (const cat in food.categoryAddons) {
                            const found = food.categoryAddons[cat].find(e => e.name === extra.name);
                            if (found) {
                                newExtra = found;
                                break;
                            }
                        }
                    }

                    const actualExtra = oldExtra || newExtra;
                    if (actualExtra) {
                        precoItem += actualExtra.price;
                        secureExtras.push({ name: actualExtra.name, price: actualExtra.price });
                    }
                }
            }

            subtotalSeguro += precoItem * item.quantity;
            secureItems.push({
                ...item,
                price: food.price,
                extras: secureExtras
            });
        }

        const deliveryFee = req.body.deliveryFee || 0;
        let finalAmount = subtotalSeguro + deliveryFee;
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
                if (subtotalSeguro >= coupon.minOrderValue) {
                    // Check user usage limit
                    const userUsageCount = await orderModel.countDocuments({
                        userId: req.body.userId,
                        couponCode: coupon.code,
                        payment: true
                    });
                    
                    if (userUsageCount < coupon.maxUsesPerUser) {
                        // Calculate discount based on subtotal securely
                        discountAmount = coupon.calculateDiscount(subtotalSeguro);
                        finalAmount = Math.max(0, finalAmount - discountAmount);
                        
                        couponData = {
                            couponCode: coupon.code,
                            couponId: coupon._id,
                            discountAmount: discountAmount,
                            originalAmount: finalAmount + discountAmount
                        };
                    }
                }
            }
        }
        
        const orderData = {
            userId: req.body.userId, // Pode ser null para usuários não autenticados
            storeId: storeId,
            items: secureItems, // Itens validados pelo backend
            amount: finalAmount, // Preço validado pelo backend
            address: req.body.address,
            orderType: req.body.orderType || req.body.deliveryType || 'delivery',
            deliveryType: req.body.deliveryType || 'delivery',
            paymentMethod: req.body.paymentMethod || null,
            customerId: req.body.customerId || null,
            customerInfo: req.body.customerInfo || null,
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

        const line_items = secureItems.map((item)=>{
            // Calcular preço total do item incluindo extras revalidados
            let totalPrice = item.price;
            let itemName = item.name;`;

const startIdx = code.indexOf(targetStart);
const endIdx = code.indexOf(targetEnd) + targetEnd.length;

if (startIdx === -1) {
  console.log("Could not find targetStart");
  process.exit(1);
}
if (code.indexOf(targetEnd) === -1) {
  console.log("Could not find targetEnd");
  process.exit(1);
}

const finalCode = code.substring(0, startIdx) + newCode + code.substring(endIdx);
fs.writeFileSync(targetFile, finalCode);
console.log("Patched successfully");
