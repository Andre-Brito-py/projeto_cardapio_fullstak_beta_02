import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Store from './models/storeModel.js';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB conectado');
  } catch (error) {
    console.error('Erro ao conectar MongoDB:', error);
    process.exit(1);
  }
};

const testStoreCreation = async () => {
  try {
    await connectDB();
    
    console.log('Iniciando teste de criação de loja...');
    
    // Dados da loja
    const timestamp = Date.now();
    const storeData = {
      name: `Test Store Debug ${timestamp}`,
      description: 'Teste de debug',
      restaurantAddress: 'Debug Street, 123',
      ownerName: 'Debug Owner',
      ownerEmail: `debug${timestamp}@test.com`,
      ownerPassword: '123456',
      subscriptionPlan: 'Premium'
    };
    
    console.log('Dados da loja:', storeData);
    
    // Gerar slug manualmente
    const slug = storeData.name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    console.log('Slug gerado:', slug);
    
    // Criar ObjectId temporário para owner
    const tempOwnerId = new mongoose.Types.ObjectId();
    console.log('Owner temporário ID:', tempOwnerId);
    
    // Criar objeto da loja
    const newStore = new Store({
      name: storeData.name,
      slug: slug,
      description: storeData.description,
      owner: tempOwnerId,
      subscription: {
        plan: storeData.subscriptionPlan,
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
      },
      settings: {
        restaurantAddress: storeData.restaurantAddress,
        deliveryZones: [{
          name: 'Zona Principal',
          coordinates: [[0, 0], [1, 1]],
          deliveryFee: 5.00,
          minOrderValue: 20.00,
          fee: 5.00,
          maxDistance: 10
        }]
      },
      status: 'active'
    });
    
    console.log('Objeto da loja criado:', JSON.stringify(newStore.toObject(), null, 2));
    
    // Salvar loja
    console.log('Salvando loja...');
    const savedStore = await newStore.save();
    console.log('Loja salva com sucesso! ID:', savedStore._id);
    
    // Hash da senha
    const hashedPassword = await bcrypt.hash(storeData.ownerPassword, 12);
    
    // Criar usuário proprietário
    console.log('Criando usuário proprietário...');
    const newUser = new User({
      name: storeData.ownerName,
      email: storeData.ownerEmail,
      password: hashedPassword,
      role: 'store_admin',
      store: savedStore._id,
      storeId: savedStore._id,
      isActive: true
    });
    
    const savedUser = await newUser.save();
    console.log('Usuário criado com sucesso! ID:', savedUser._id);
    
    // Atualizar loja com o owner real
    console.log('Atualizando loja com owner real...');
    savedStore.owner = savedUser._id;
    await savedStore.save();
    
    console.log('Processo concluído com sucesso!');
    console.log('Loja final:', {
      id: savedStore._id,
      name: savedStore.name,
      slug: savedStore.slug,
      owner: savedStore.owner
    });
    
  } catch (error) {
    console.error('Erro detalhado:', error);
    console.error('Stack trace:', error.stack);
    if (error.errors) {
      console.error('Erros de validação:', error.errors);
    }
  } finally {
    await mongoose.connection.close();
    console.log('Conexão fechada');
  }
};

testStoreCreation();