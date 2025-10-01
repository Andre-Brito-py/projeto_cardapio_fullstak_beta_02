import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Simular exatamente o que o controller faz
const loginSuperAdmin = async (req, res) => {
    try {
        console.log('=== DEBUG LOGIN SUPER ADMIN ===');
        console.log('Body recebido:', req.body);
        
        const { email, password } = req.body;
        console.log('Email:', email);
        console.log('Password:', password);
        
        console.log('Procurando usuário no banco...');
        const user = await userModel.findOne({ email, role: 'super_admin' });
        console.log('Usuário encontrado:', user ? 'SIM' : 'NÃO');
        
        if (!user) {
            console.log('❌ Usuário não encontrado - retornando erro');
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        console.log('Usuário encontrado:', {
            id: user._id,
            email: user.email,
            role: user.role,
            isActive: user.isActive
        });
        
        console.log('Comparando senha...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('Senha confere:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Senha não confere - retornando erro');
            return res.json({ success: false, message: "Credenciais inválidas" });
        }
        
        if (!user.isActive) {
            console.log('❌ Conta desativada - retornando erro');
            return res.json({ success: false, message: "Conta desativada" });
        }
        
        console.log('Atualizando último login...');
        user.lastLogin = new Date();
        await user.save();
        
        console.log('Gerando token JWT...');
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Login bem-sucedido!');
        const response = {
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        };
        
        console.log('Resposta:', response);
        res.json(response);
    } catch (error) {
        console.error('❌ Erro no login do super admin:', error);
        res.json({ success: false, message: "Erro no login" });
    }
};

// Conectar ao MongoDB e testar
mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app')
  .then(() => {
    console.log('Conectado ao MongoDB');
    
    // Simular requisição
    const mockReq = {
        body: {
            email: 'superadmin@fooddelivery.com',
            password: 'superadmin123'
        }
    };
    
    const mockRes = {
        json: (data) => {
            console.log('=== RESPOSTA FINAL ===');
            console.log(JSON.stringify(data, null, 2));
            process.exit(0);
        }
    };
    
    loginSuperAdmin(mockReq, mockRes);
  })
  .catch(err => {
    console.error('Erro de conexão:', err);
    process.exit(1);
  });