import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import userModel from '../models/userModel.js';
import Store from '../models/storeModel.js';
import jwt from 'jsonwebtoken';

// Registro Self-Service de novas Lojas
export const registerTenant = async (req, res) => {
    try {
        const { storeName, ownerName, email, password } = req.body;

        if (!storeName || !ownerName || !email || !password) {
            return res.status(400).json({ success: false, message: "Todos os campos são obrigatórios." });
        }

        // Verifica se o email já existe
        const exists = await userModel.findOne({ email });
        if (exists) {
            return res.status(400).json({ success: false, message: "Este e-mail já está em uso." });
        }

        // Gera IDs manualmente para resolver a dependência circular (User precisa de Store, Store precisa de User)
        const userId = new mongoose.Types.ObjectId();
        const storeId = new mongoose.Types.ObjectId();

        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Cria a Loja (Tenant)
        const newStore = new Store({
            _id: storeId,
            name: storeName,
            owner: userId,
            settings: {
                restaurantAddress: "Por favor, preencha o endereço nas configurações."
            }
        });

        // Cria o Dono da Loja (store_admin)
        const newUser = new userModel({
            _id: userId,
            name: ownerName,
            email: email,
            password: hashedPassword,
            role: 'store_admin',
            storeId: storeId
        });

        // Salva ambos
        await newStore.save();
        await newUser.save();

        // Gera Token
        const token = jwt.sign({ id: newUser._id, role: newUser.role, storeId: storeId }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            success: true,
            message: "Loja criada com sucesso!",
            token,
            store: newStore,
            user: { name: newUser.name, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error("Erro no registerTenant:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
