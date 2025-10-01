import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app')
  .then(async () => {
    console.log('Conectado ao MongoDB');
    
    let superAdmin = await userModel.findOne({ role: 'super_admin' });
    if (superAdmin) {
      console.log('Super Admin encontrado:', superAdmin.email);
      
      // Atualizar email e senha
      superAdmin.email = 'superadmin@fooddelivery.com';
      
      // Hash da nova senha
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      superAdmin.password = hashedPassword;
      await superAdmin.save();
      
      console.log('Email e senha atualizados com sucesso!');
      console.log('Novo email:', superAdmin.email);
    } else {
      console.log('Nenhum Super Admin encontrado - criando novo...');
      
      // Criar novo super admin se não existir
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('superadmin123', salt);
      
      superAdmin = new userModel({
        name: 'Super Admin',
        email: 'superadmin@fooddelivery.com',
        password: hashedPassword,
        role: 'super_admin',
        isActive: true,
        storeId: null
      });
      
      await superAdmin.save();
      console.log('Super Admin criado com sucesso!');
    }
    
    process.exit(0);
  })
  .catch(err => {
    console.error('Erro:', err);
    process.exit(1);
  });