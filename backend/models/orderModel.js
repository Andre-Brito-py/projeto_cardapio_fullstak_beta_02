import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId:{type:String, required: true},
    storeId:{type:mongoose.Schema.Types.ObjectId, ref:'Store', required: true},
    items:{type:Array, required: true},
    amount:{type:Number, required: true},
    address:{type:Object, required: true},
    status:{type:String, default:"Food Processing"},
    date:{type:Date, default:Date.now()},
    payment:{type:Boolean, default:false},
    // Campos relacionados à mesa
    tableId:{type:mongoose.Schema.Types.ObjectId, ref:'Table', required: false},
    tableNumber:{type:String, required: false}, // Número da mesa para fácil identificação
    tableName:{type:String, required: false}, // Nome/descrição da mesa (ex: "Mesa 1")
    orderType:{type:String, enum:['delivery', 'pickup', 'dine_in'], default:'delivery'}, // Tipo do pedido
    // Campos relacionados a cupons de desconto
    couponCode:{type:String, required: false}, // Código do cupom aplicado
    discountAmount:{type:Number, default: 0}, // Valor do desconto aplicado
    originalAmount:{type:Number, required: false}, // Valor original antes do desconto
    couponId:{type:mongoose.Schema.Types.ObjectId, ref:'Coupon', required: false} // Referência ao cupom usado
})

const orderModel = mongoose.models.order || mongoose.model("order", orderSchema)

export default orderModel;
