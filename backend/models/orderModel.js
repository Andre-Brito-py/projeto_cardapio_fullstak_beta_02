import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{type:String, required: false}, // Opcional para permitir pedidos sem login
    storeId:{type:mongoose.Schema.Types.ObjectId, ref:'Store', required: true},
    items:{type:Array, required: true},
    amount:{type:Number, required: true},
    address:{type:Object, required: true},
    status:{type:String, default:"Food Processing"},
    date:{type:Date, default:Date.now()},
    payment:{type:Boolean, default:false},
    // Campos relacionados ao cliente
    customerId:{type:mongoose.Schema.Types.ObjectId, ref:'Customer', required: false}, // Referência ao cliente
    customerInfo:{type:Object, required: false}, // Informações do cliente para backup
    // Campos relacionados à mesa
    tableId:{type:mongoose.Schema.Types.ObjectId, ref:'Table', required: false},
    tableNumber:{type:String, required: false}, // Número da mesa para fácil identificação
    tableName:{type:String, required: false}, // Nome/descrição da mesa (ex: "Mesa 1")
    orderType:{type:String, enum:['delivery', 'pickup', 'dine_in'], default:'delivery'}, // Tipo do pedido
    // Campos relacionados a cupons de desconto
    couponCode:{type:String, required: false}, // Código do cupom aplicado
    discountAmount:{type:Number, default: 0}, // Valor do desconto aplicado
    originalAmount:{type:Number, required: false}, // Valor original antes do desconto
    couponId:{type:mongoose.Schema.Types.ObjectId, ref:'Coupon', required: false}, // Referência ao cupom usado
    // Campos relacionados ao garçom
    waiterToken:{type:String, required: false}, // Token do garçom que fez o pedido
    isWaiterOrder:{type:Boolean, default: false}, // Indica se o pedido foi feito por um garçom
    paymentMethod:{
        type: String,
        enum: ['pix', 'dinheiro', 'cartao_credito', 'cartao_debito', 'vale_refeicao', 'vale_alimentacao'],
        required: false
    }, // Método de pagamento escolhido pelo cliente
    notes:{type:String, required: false}, // Observações do pedido
    // Campos relacionados ao cashback
    cashback: {
        earned: {
            type: Number,
            default: 0
        },
        used: {
            type: Number,
            default: 0
        },
        percentage: {
            type: Number,
            default: 0
        },
        transactionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'CashbackTransaction',
            required: false
        }
    },
    // Campos relacionados ao frete
    shipping: {
        fee: {
            type: Number,
            default: 0
        },
        distance: {
            type: Number, // Distância em quilômetros
            required: false
        },
        duration: {
            type: Number, // Duração em minutos
            required: false
        },
        calculatedBy: {
            type: String,
            enum: ['google_maps', 'manual', 'zone'],
            required: false
        },
        googleMapsData: {
            type: Object, // Dados completos da resposta do Google Maps
            required: false
        }
    },
    // Campo para rastrear tipo de saída do produto
    deliveryType: {
        type: String,
        enum: ['delivery', 'waiter', 'in_person'], // delivery: entrega, waiter: garçom, in_person: presencial
        default: 'delivery',
        required: true
    }
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel;
