import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import Category from './models/categoryModel.js';
import User from './models/userModel.js';
import Table from './models/tableModel.js';
import Banner from './models/bannerModel.js';
import CashbackTransaction from './models/cashbackTransactionModel.js';
import Customer from './models/customerModel.js';

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

const checkStoresAndCategories = async () => {
  try {
    await connectDB();

    console.log('\n=== VERIFICAÇÃO DE LOJAS ===');
    const stores = await Store.find({});
    console.log(`📊 Total de lojas: ${stores.length}`);
    
    if (stores.length > 0) {
      stores.forEach((store, index) => {
        console.log(`\n--- Loja ${index + 1} ---`);
        console.log(`🏪 Nome: ${store.name}`);
        console.log(`📧 Email: ${store.email}`);
        console.log(`📱 Telefone: ${store.phone || 'Não informado'}`);
        console.log(`📍 Endereço: ${store.address || 'Não informado'}`);
        console.log(`✅ Ativo: ${store.isActive}`);
        console.log(`👤 Admin ID: ${store.adminId}`);
        console.log(`📅 Criado em: ${store.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhuma loja encontrada no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE CATEGORIAS ===');
    const categories = await Category.find({});
    console.log(`📊 Total de categorias: ${categories.length}`);
    
    if (categories.length > 0) {
      categories.forEach((category, index) => {
        console.log(`\n--- Categoria ${index + 1} ---`);
        console.log(`📂 Nome: ${category.name}`);
        console.log(`📝 Descrição: ${category.description || 'Não informado'}`);
        console.log(`🏪 Loja ID: ${category.storeId}`);
        console.log(`✅ Ativo: ${category.isActive}`);
        console.log(`📅 Criado em: ${category.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhuma categoria encontrada no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE MESAS ===');
    const tables = await Table.find({});
    console.log(`📊 Total de mesas: ${tables.length}`);
    
    if (tables.length > 0) {
      tables.forEach((table, index) => {
        console.log(`\n--- Mesa ${index + 1} ---`);
        console.log(`🪑 Número: ${table.number}`);
        console.log(`👥 Capacidade: ${table.capacity}`);
        console.log(`🏪 Loja ID: ${table.storeId}`);
        console.log(`✅ Ativo: ${table.isActive}`);
        console.log(`📅 Criado em: ${table.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhuma mesa encontrada no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE BANNERS ===');
    const banners = await Banner.find({});
    console.log(`📊 Total de banners: ${banners.length}`);
    
    if (banners.length > 0) {
      banners.forEach((banner, index) => {
        console.log(`\n--- Banner ${index + 1} ---`);
        console.log(`🖼️  Título: ${banner.title}`);
        console.log(`📝 Descrição: ${banner.description || 'Não informado'}`);
        console.log(`🔗 URL da Imagem: ${banner.imageUrl}`);
        console.log(`🏪 Loja ID: ${banner.storeId}`);
        console.log(`✅ Ativo: ${banner.isActive}`);
        console.log(`📅 Criado em: ${banner.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhum banner encontrado no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE TRANSAÇÕES DE CASHBACK ===');
    const cashbackTransactions = await CashbackTransaction.find({});
    console.log(`📊 Total de transações de cashback: ${cashbackTransactions.length}`);
    
    if (cashbackTransactions.length > 0) {
      cashbackTransactions.forEach((transaction, index) => {
        console.log(`\n--- Transação ${index + 1} ---`);
        console.log(`👤 Cliente ID: ${transaction.customerId}`);
        console.log(`💰 Valor: R$ ${transaction.amount}`);
        console.log(`📝 Tipo: ${transaction.type}`);
        console.log(`📄 Descrição: ${transaction.description || 'Não informado'}`);
        console.log(`📅 Criado em: ${transaction.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhuma transação de cashback encontrada no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE CLIENTES ===');
    const customers = await Customer.find({});
    console.log(`📊 Total de clientes: ${customers.length}`);
    
    if (customers.length > 0) {
      customers.forEach((customer, index) => {
        console.log(`\n--- Cliente ${index + 1} ---`);
        console.log(`👤 Nome: ${customer.name}`);
        console.log(`📧 Email: ${customer.email}`);
        console.log(`📱 Telefone: ${customer.phone || 'Não informado'}`);
        console.log(`💰 Saldo de Cashback: R$ ${customer.cashbackBalance || 0}`);
        console.log(`✅ Ativo: ${customer.isActive}`);
        console.log(`📅 Criado em: ${customer.createdAt}`);
      });
    } else {
      console.log('⚠️  Nenhum cliente encontrado no banco de dados');
    }

    console.log('\n=== VERIFICAÇÃO DE RELACIONAMENTOS ===');
    
    // Verificar se existem lojas sem admin
    const storesWithoutAdmin = await Store.find({ adminId: { $exists: false } });
    if (storesWithoutAdmin.length > 0) {
      console.log(`⚠️  ${storesWithoutAdmin.length} loja(s) sem admin definido`);
    }

    // Verificar se existem categorias sem loja
    const categoriesWithoutStore = await Category.find({ storeId: { $exists: false } });
    if (categoriesWithoutStore.length > 0) {
      console.log(`⚠️  ${categoriesWithoutStore.length} categoria(s) sem loja definida`);
    }

    // Verificar se existem mesas sem loja
    const tablesWithoutStore = await Table.find({ storeId: { $exists: false } });
    if (tablesWithoutStore.length > 0) {
      console.log(`⚠️  ${tablesWithoutStore.length} mesa(s) sem loja definida`);
    }

    // Verificar se existem banners sem loja
    const bannersWithoutStore = await Banner.find({ storeId: { $exists: false } });
    if (bannersWithoutStore.length > 0) {
      console.log(`⚠️  ${bannersWithoutStore.length} banner(s) sem loja definida`);
    }

    console.log('\n✅ Verificação completa!');

  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
  } finally {
    console.log('\n🔌 Fechando conexão com MongoDB');
    await mongoose.connection.close();
  }
};

checkStoresAndCategories();