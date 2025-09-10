import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

async function createInitialStore() {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
    console.log('Conectado ao MongoDB');

    // Verificar se a loja já existe
    const existingStore = await Store.findOne({ slug: 'edgar-bolos-e-festas' });
    if (existingStore) {
      console.log('Loja já existe:', existingStore.name);
      process.exit(0);
    }

    // Criar um ObjectId temporário para o owner (será atualizado depois)
    const tempOwnerId = new mongoose.Types.ObjectId();

    // Criar a loja inicial
    const store = new Store({
      name: 'Edgar Bolos e Festas',
      slug: 'edgar-bolos-e-festas',
      description: 'Loja especializada em bolos e doces para festas',
      owner: tempOwnerId,
      status: 'active',
      subscription: {
        plan: 'Básico',
        status: 'active'
      },
      settings: {
        restaurantAddress: 'Rua das Flores, 123 - Centro - São Paulo/SP',
        address: {
          street: 'Rua das Flores',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567'
        },
        contact: {
          phone: '(11) 99999-9999',
          email: 'contato@edgarbolos.com'
        },
        isActive: true,
        acceptsOrders: true,
        deliveryFee: 5.00,
        minimumOrderValue: 20.00,
        operatingHours: {
          monday: { open: '08:00', close: '18:00', isOpen: true },
          tuesday: { open: '08:00', close: '18:00', isOpen: true },
          wednesday: { open: '08:00', close: '18:00', isOpen: true },
          thursday: { open: '08:00', close: '18:00', isOpen: true },
          friday: { open: '08:00', close: '18:00', isOpen: true },
          saturday: { open: '08:00', close: '16:00', isOpen: true },
          sunday: { open: '08:00', close: '16:00', isOpen: false }
        }
      },
      language: 'pt-BR',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo'
    });

    await store.save();
    console.log('✅ Loja criada com sucesso!');
    console.log('Nome:', store.name);
    console.log('ID:', store._id);
    console.log('Slug:', store.slug);
    
  } catch (error) {
    console.error('❌ Erro ao criar loja:', error);
  } finally {
    mongoose.connection.close();
  }
}

createInitialStore();