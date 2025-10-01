import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app')
  .then(async () => {
    console.log('Conectado ao MongoDB');
    
    const superAdmin = await userModel.findOne({ role: 'super_admin' });
    if (superAdmin) {
      console.log('Super Admin encontrado:');
      console.log('Email:', superAdmin.email);
      console.log('Password hash:', superAdmin.password);
      
      // Testar comparação de senha
      const testPassword = 'superadmin123';
      const isMatch = await bcrypt.compare(testPassword, superAdmin.password);
      console.log('Senha "superadmin123" confere:', isMatch);
      
      // Testar hash da senha
      const hashedTest = await bcrypt.hash(testPassword, 10);
      console.log('Hash de teste:', hashedTest);
      
    } else {
      console.log('Nenhum Super Admin encontrado');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });