import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import Category from './models/categoryModel.js';
import User from './models/userModel.js';
import Table from './models/tableModel.js';
import Banner from './models/bannerModel.js';
import bcrypt from 'bcrypt';

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fooddelivery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Conectado ao MongoDB');
    return conn;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error.message);
    process.exit(1);
  }
};

const createSuperAdminStore = async () => {
  try {
    await connectDB();

    console.log('\n=== CRIANDO DADOS INICIAIS PARA SUPER ADMIN ===');

    // Buscar o Super Admin
    let superAdmin = await User.findOne({ role: 'super_admin' });
    if (!superAdmin) {
      console.log('❌ Super Admin não encontrado. Criando...');
      
      const hashedPassword = await bcrypt.hash('123456', 10);
      superAdmin = new User({
        name: 'Super Admin',
        email: 'superadmin@fooddelivery.com',
        password: hashedPassword,
        role: 'super_admin',
        permissions: ['all'],
        isActive: true
      });
      
      await superAdmin.save();
      console.log('✅ Super Admin criado com sucesso!');
      console.log(`👤 Email: superadmin@fooddelivery.com`);
      console.log(`🔑 Senha: 123456`);
    } else {
      console.log('✅ Super Admin já existe');
      console.log(`👤 Nome: ${superAdmin.name}`);
      console.log(`📧 Email: ${superAdmin.email}`);
    }

    // Verificar se já existe uma loja para o Super Admin
    let store = await Store.findOne({ owner: superAdmin._id });
    
    if (!store) {
      console.log('\n📦 Criando loja padrão para Super Admin...');
      
      // Gerar slug único
      const slug = 'loja-principal-food-delivery';
      
      store = new Store({
        name: 'Loja Principal - Food Delivery',
        slug: slug,
        description: 'Loja principal do sistema Food Delivery',
        owner: superAdmin._id,
        status: 'active',
        subscription: {
          plan: 'Premium',
          status: 'active'
        },
        settings: {
          restaurantAddress: 'Rua Principal, 123 - Centro, São Paulo - SP',
          address: {
            street: 'Rua Principal',
            number: '123',
            neighborhood: 'Centro',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01000-000'
          },
          pixKey: 'loja@fooddelivery.com',
          isOpen: true,
          autoAcceptOrders: true,
          deliveryZones: [{
            name: 'Centro',
            maxDistance: 5,
            fee: 5.00,
            estimatedTime: 30
          }],
          workingHours: {
            monday: { open: '08:00', close: '22:00', isOpen: true },
            tuesday: { open: '08:00', close: '22:00', isOpen: true },
            wednesday: { open: '08:00', close: '22:00', isOpen: true },
            thursday: { open: '08:00', close: '22:00', isOpen: true },
            friday: { open: '08:00', close: '23:00', isOpen: true },
            saturday: { open: '09:00', close: '23:00', isOpen: true },
            sunday: { open: '09:00', close: '21:00', isOpen: true }
          }
        }
      });
      
      await store.save();
      console.log('✅ Loja criada com sucesso!');
      console.log(`🏪 Nome: ${store.name}`);
      console.log(`🔗 Slug: ${store.slug}`);
    } else {
      console.log('\n✅ Loja já existe para o Super Admin');
      console.log(`🏪 Nome: ${store.name}`);
    }

    // Criar categorias padrão
    const defaultCategories = [
      { name: 'Lanches', description: 'Hambúrgueres, sanduíches e lanches em geral', image: '/images/categories/lanches.jpg' },
      { name: 'Pizzas', description: 'Pizzas doces e salgadas', image: '/images/categories/pizzas.jpg' },
      { name: 'Bebidas', description: 'Refrigerantes, sucos e bebidas em geral', image: '/images/categories/bebidas.jpg' },
      { name: 'Sobremesas', description: 'Doces, sorvetes e sobremesas', image: '/images/categories/sobremesas.jpg' },
      { name: 'Pratos Executivos', description: 'Refeições completas e pratos do dia', image: '/images/categories/pratos.jpg' }
    ];

    console.log('\n📂 Criando categorias padrão...');
    for (const categoryData of defaultCategories) {
      const existingCategory = await Category.findOne({ 
        name: categoryData.name, 
        storeId: store._id 
      });
      
      if (!existingCategory) {
        const category = new Category({
          ...categoryData,
          storeId: store._id,
          isActive: true
        });
        
        await category.save();
        console.log(`✅ Categoria criada: ${category.name}`);
      } else {
        console.log(`⚠️  Categoria já existe: ${categoryData.name}`);
      }
    }

    // Criar mesas padrão
    console.log('\n🪑 Criando mesas padrão...');
    const defaultTables = [
      { tableNumber: '1', displayName: 'Mesa 1', capacity: 2, qrCode: 'QR_MESA_1_' + store._id },
      { tableNumber: '2', displayName: 'Mesa 2', capacity: 4, qrCode: 'QR_MESA_2_' + store._id },
      { tableNumber: '3', displayName: 'Mesa 3', capacity: 4, qrCode: 'QR_MESA_3_' + store._id },
      { tableNumber: '4', displayName: 'Mesa 4', capacity: 6, qrCode: 'QR_MESA_4_' + store._id },
      { tableNumber: '5', displayName: 'Mesa 5', capacity: 2, qrCode: 'QR_MESA_5_' + store._id },
      { tableNumber: '6', displayName: 'Mesa 6', capacity: 8, qrCode: 'QR_MESA_6_' + store._id }
    ];

    for (const tableData of defaultTables) {
      const existingTable = await Table.findOne({ 
        tableNumber: tableData.tableNumber, 
        storeId: store._id 
      });
      
      if (!existingTable) {
        const table = new Table({
          ...tableData,
          storeId: store._id,
          isActive: true
        });
        
        await table.save();
        console.log(`✅ Mesa criada: ${table.displayName} (${table.capacity} pessoas)`);
      } else {
        console.log(`⚠️  Mesa já existe: ${tableData.displayName}`);
      }
    }

    // Criar banner padrão
    console.log('\n🖼️  Criando banner padrão...');
    const existingBanner = await Banner.findOne({ storeId: store._id });
    
    if (!existingBanner) {
      const banner = new Banner({
        title: 'Bem-vindo ao Food Delivery!',
        description: 'Os melhores pratos da cidade, entregues na sua casa!',
        image: '/images/banners/banner-default.jpg',
        storeId: store._id,
        isActive: true,
        isDefault: true
      });
      
      await banner.save();
      console.log(`✅ Banner criado: ${banner.title}`);
    } else {
      console.log(`⚠️  Banner já existe para a loja`);
    }

    console.log('\n🎉 Dados iniciais criados com sucesso!');
    console.log('\n📋 RESUMO:');
    console.log(`👤 Super Admin: ${superAdmin.email}`);
    console.log(`🏪 Loja: ${store.name}`);
    console.log(`📂 Categorias: ${defaultCategories.length}`);
    console.log(`🪑 Mesas: ${defaultTables.length}`);
    console.log(`🖼️  Banners: 1`);

  } catch (error) {
    console.error('❌ Erro durante a criação:', error);
  } finally {
    console.log('\n🔌 Fechando conexão com MongoDB');
    await mongoose.connection.close();
  }
};

createSuperAdminStore();