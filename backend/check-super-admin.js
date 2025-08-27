import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const checkSuperAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('📊 Conectado ao MongoDB');
    
    const superAdmins = await userModel.find({ role: 'super_admin' });
    
    console.log('👥 Super Admins encontrados:', superAdmins.length);
    
    superAdmins.forEach((admin, index) => {
      console.log(`\n${index + 1}. Super Admin:`);
      console.log('   ID:', admin._id);
      console.log('   Nome:', admin.name);
      console.log('   Email:', admin.email);
      console.log('   Ativo:', admin.isActive);
      console.log('   Criado em:', admin.createdAt);
      console.log('   Último login:', admin.lastLogin);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.log('❌ Erro:', error.message);
  }
};

checkSuperAdmin();