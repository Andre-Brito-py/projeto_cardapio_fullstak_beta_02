import mongoose from 'mongoose';
import User from './models/userModel.js';
import bcrypt from 'bcrypt';

const createSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    
    // Verificar se já existe um Super Admin
    const existingSuperAdmin = await User.findOne({ isSuperAdmin: true });
    
    if (existingSuperAdmin) {
      console.log('Super Admin já existe:', existingSuperAdmin.email);
      process.exit(0);
    }
    
    // Criar novo Super Admin
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const superAdmin = new User({
      name: 'Super Admin',
      email: 'superadmin@fooddelivery.com',
      password: hashedPassword,
      isSuperAdmin: true
    });
    
    await superAdmin.save();
    
    console.log('Super Admin criado com sucesso!');
    console.log('Email: superadmin@fooddelivery.com');
    console.log('Senha: admin123');
    console.log('ID:', superAdmin._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao criar Super Admin:', error.message);
    process.exit(1);
  }
};

createSuperAdmin();