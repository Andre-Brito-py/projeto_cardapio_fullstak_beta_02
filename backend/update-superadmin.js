import mongoose from 'mongoose';
import User from './models/userModel.js';

const updateSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    
    // Encontrar o Super Admin pelo email
    const superAdmin = await User.findOne({ email: 'superadmin@fooddelivery.com' });
    
    if (!superAdmin) {
      console.log('Super Admin não encontrado');
      process.exit(1);
    }
    
    // Atualizar o role para super_admin
    superAdmin.role = 'super_admin';
    await superAdmin.save();
    
    console.log('Super Admin atualizado com sucesso!');
    console.log('Email:', superAdmin.email);
    console.log('Role:', superAdmin.role);
    console.log('ID:', superAdmin._id);
    
    process.exit(0);
  } catch (error) {
    console.error('Erro ao atualizar Super Admin:', error.message);
    process.exit(1);
  }
};

updateSuperAdmin();