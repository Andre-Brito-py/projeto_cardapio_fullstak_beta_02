import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/userModel.js';
import Store from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function createStoreAdmin() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    console.log('Conectado ao MongoDB');

    // Buscar a primeira loja
    const store = await Store.findOne({ slug: 'edgar-bolos-e-festas' });
    if (!store) {
      console.log('Loja não encontrada');
      process.exit(1);
    }

    console.log('Loja encontrada:', store.name, '- ID:', store._id);

    // Verificar se já existe um store admin para esta loja
    const existingAdmin = await User.findOne({ 
      email: 'admin@edgarbolos.com',
      role: 'store_admin'
    });

    if (existingAdmin) {
      console.log('Store Admin já existe para esta loja');
      process.exit(0);
    }

    // Criar hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Criar o store admin
    const storeAdmin = new User({
      name: 'Admin Edgar Bolos',
      email: 'admin@edgarbolos.com',
      password: hashedPassword,
      role: 'store_admin',
      storeId: store._id,
      isActive: true,
      permissions: [
        'canManageProducts',
        'canManageOrders',
        'canViewAnalytics',
        'canManageSettings'
      ]
    });

    await storeAdmin.save();
    console.log('Store Admin criado com sucesso!');
    console.log('Email:', storeAdmin.email);
    console.log('Senha: admin123');
    console.log('Loja:', store.name);
    
  } catch (error) {
    console.error('Erro ao criar Store Admin:', error.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createStoreAdmin();