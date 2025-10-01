import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app')
  .then(async () => {
    console.log('Conectado ao MongoDB');
    
    // Simular o que o controller faz
    const email = 'superadmin@fooddelivery.com';
    const password = 'superadmin123';
    
    console.log('Procurando usuário com email:', email);
    const user = await userModel.findOne({ email, role: 'super_admin' });
    
    if (!user) {
      console.log('❌ Usuário não encontrado');
      process.exit(1);
    }
    
    console.log('✅ Usuário encontrado:', user.email);
    console.log('Role:', user.role);
    console.log('Ativo:', user.isActive);
    
    console.log('Comparando senha...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Senha confere:', isMatch);
    
    if (!isMatch) {
      console.log('❌ Senha não confere');
      process.exit(1);
    }
    
    if (!user.isActive) {
      console.log('❌ Conta desativada');
      process.exit(1);
    }
    
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Definido' : 'Não definido');
    
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '7d' }
    );
    
    console.log('✅ Token gerado com sucesso');
    console.log('Token:', token.substring(0, 50) + '...');
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });