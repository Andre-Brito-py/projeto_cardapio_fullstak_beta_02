import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function getRealAdminId() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    console.log('Conectado ao MongoDB');

    const user = await User.findOne({ email: 'superadmin@admin.com' });
    
    if (user) {
      console.log('Real Super Admin ID:', user._id.toString());
      console.log('Nome:', user.name);
      console.log('Email:', user.email);
      console.log('Role:', user.role);
      console.log('IsActive:', user.isActive);
    } else {
      console.log('❌ Super Admin não encontrado');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.connection.close();
  }
}

getRealAdminId();