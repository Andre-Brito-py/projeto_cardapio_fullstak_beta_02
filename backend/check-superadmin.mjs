import mongoose from 'mongoose';
import userModel from './models/userModel.js';

mongoose.connect('mongodb://admin:admin123@localhost:27017/food-delivery-multitenant?authSource=admin')
  .then(async () => {
    console.log('Conectado ao MongoDB');
    const superAdmin = await userModel.findOne({ role: 'super_admin' });
    if (superAdmin) {
      console.log('Super Admin encontrado:');
      console.log('Email:', superAdmin.email);
      console.log('Ativo:', superAdmin.isActive);
      console.log('ID:', superAdmin._id);
    } else {
      console.log('Nenhum Super Admin encontrado');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });
