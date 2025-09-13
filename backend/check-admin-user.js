import mongoose from 'mongoose';
import User from './models/userModel.js';
import Store from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    console.log('Conectado ao MongoDB');

    // Verificar usuário admin
    const user = await User.findOne({ email: 'superadmin@admin.com' }).populate('storeId');
    
    if (user) {
      console.log('✅ Usuário encontrado:');
      console.log('- Nome:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- StoreId:', user.storeId);
      console.log('- Store Name:', user.storeId?.name || 'N/A');
      console.log('- IsActive:', user.isActive);
    } else {
      console.log('❌ Usuário não encontrado');
    }

    // Verificar loja
    const store = await Store.findOne({ slug: 'edgar-bolos-e-festas' });
    if (store) {
      console.log('\n✅ Loja encontrada:');
      console.log('- Nome:', store.name);
      console.log('- ID:', store._id);
      console.log('- Status:', store.status);
      console.log('- Owner:', store.owner);
    } else {
      console.log('\n❌ Loja não encontrada');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkAdminUser();