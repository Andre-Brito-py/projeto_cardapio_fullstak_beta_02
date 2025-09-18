import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

mongoose.connect('mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin')
  .then(async () => {
    console.log('Conectado ao MongoDB');
    
    const superAdmin = await userModel.findOne({ role: 'super_admin' });
    if (superAdmin) {
      console.log('Super Admin encontrado:', superAdmin.email);
      
      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      superAdmin.password = hashedPassword;
      await superAdmin.save();
      
      console.log('Senha resetada com sucesso!');
    } else {
      console.log('Nenhum Super Admin encontrado');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });