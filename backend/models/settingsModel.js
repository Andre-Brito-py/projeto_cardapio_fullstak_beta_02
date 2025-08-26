import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema({
    pixKey: {
        type: String,
        default: ""
    },

    googleMapsApiKey: {
        type: String,
        default: ""
    },
    restaurantAddress: {
        street: {
            type: String,
            default: ""
        },
        city: {
            type: String,
            default: ""
        },
        state: {
            type: String,
            default: ""
        },
        zipCode: {
            type: String,
            default: ""
        },
        country: {
            type: String,
            default: "Brasil"
        }
    },
    deliveryZones: [{
        maxDistance: {
            type: Number, // em km
            required: true
        },
        fee: {
            type: Number, // taxa em reais
            required: true
        }
    }],
    maxDeliveryDistance: {
        type: Number,
        default: 10 // km
    },
    banner: {
        title: {
            type: String,
            default: "Peça sua comida favorita aqui"
        },
        description: {
            type: String,
            default: "Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta. Navegue por uma variedade de restaurantes, faça seu pedido e acompanhe em tempo real. Desfrute de comida quente e fresca sem sair de casa. Rápido, conveniente e fácil de usar."
        },
        image: {
            type: String,
            default: "/header_img.png"
        }
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const settingsModel = mongoose.model("settings", settingsSchema);

export default settingsModel;