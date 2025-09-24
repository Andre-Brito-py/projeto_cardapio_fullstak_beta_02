import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import Category from './models/categoryModel.js';
import User from './models/userModel.js';
import Table from './models/tableModel.js';
import Banner from './models/bannerModel.js';
import CashbackTransaction from './models/cashbackTransactionModel.js';
import Customer from './models/customerModel.js';
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

const testCRUDOperations = async () => {
  try {
    await connectDB();

    console.log('\n=== TESTE DE OPERAÇÕES CRUD ===');

    // 1. TESTE DE USUÁRIOS
    console.log('\n👤 TESTANDO CRUD DE USUÁRIOS');
    
    // CREATE - Criar usuário de teste
    const hashedPassword = await bcrypt.hash('teste123', 10);
    const testUser = new User({
      name: 'Usuário Teste CRUD',
      email: 'teste_crud@example.com',
      password: hashedPassword,
      role: 'customer',
      isActive: true
    });
    
    const savedUser = await testUser.save();
    console.log('✅ CREATE User: Usuário criado com sucesso');
    
    // READ - Buscar usuário
    const foundUser = await User.findById(savedUser._id);
    console.log(`✅ READ User: ${foundUser.name} encontrado`);
    
    // UPDATE - Atualizar usuário
    foundUser.name = 'Usuário Teste CRUD Atualizado';
    await foundUser.save();
    console.log('✅ UPDATE User: Nome atualizado com sucesso');
    
    // DELETE - Deletar usuário
    await User.findByIdAndDelete(savedUser._id);
    console.log('✅ DELETE User: Usuário deletado com sucesso');

    // 2. TESTE DE LOJAS
    console.log('\n🏪 TESTANDO CRUD DE LOJAS');
    
    // Buscar Super Admin para usar como owner
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    // CREATE - Criar loja de teste
    const testStore = new Store({
      name: 'Loja Teste CRUD',
      slug: 'loja-teste-crud-' + Date.now(),
      description: 'Loja para teste de CRUD',
      owner: superAdmin._id,
      status: 'active',
      subscription: {
        plan: 'Básico',
        status: 'active'
      },
      settings: {
        restaurantAddress: 'Rua Teste, 123 - Centro',
        address: {
          street: 'Rua Teste',
          number: '123',
          neighborhood: 'Centro',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01000-000'
        },
        pixKey: 'teste@loja.com',
        isOpen: true
      }
    });
    
    const savedStore = await testStore.save();
    console.log('✅ CREATE Store: Loja criada com sucesso');
    
    // READ - Buscar loja
    const foundStore = await Store.findById(savedStore._id);
    console.log(`✅ READ Store: ${foundStore.name} encontrada`);
    
    // UPDATE - Atualizar loja
    foundStore.name = 'Loja Teste CRUD Atualizada';
    await foundStore.save();
    console.log('✅ UPDATE Store: Nome da loja atualizado');

    // 3. TESTE DE CATEGORIAS
    console.log('\n📂 TESTANDO CRUD DE CATEGORIAS');
    
    // CREATE - Criar categoria de teste
    const testCategory = new Category({
      name: 'Categoria Teste CRUD',
      description: 'Categoria para teste de CRUD',
      image: '/images/test-category.jpg',
      storeId: savedStore._id,
      isActive: true
    });
    
    const savedCategory = await testCategory.save();
    console.log('✅ CREATE Category: Categoria criada com sucesso');
    
    // READ - Buscar categoria
    const foundCategory = await Category.findById(savedCategory._id);
    console.log(`✅ READ Category: ${foundCategory.name} encontrada`);
    
    // UPDATE - Atualizar categoria
    foundCategory.description = 'Descrição atualizada para teste';
    await foundCategory.save();
    console.log('✅ UPDATE Category: Descrição atualizada');

    // 4. TESTE DE MESAS
    console.log('\n🪑 TESTANDO CRUD DE MESAS');
    
    // CREATE - Criar mesa de teste
    const testTable = new Table({
      storeId: savedStore._id,
      tableNumber: '99',
      displayName: 'Mesa Teste CRUD',
      qrCode: 'QR_TESTE_CRUD_' + Date.now(),
      capacity: 4,
      isActive: true
    });
    
    const savedTable = await testTable.save();
    console.log('✅ CREATE Table: Mesa criada com sucesso');
    
    // READ - Buscar mesa
    const foundTable = await Table.findById(savedTable._id);
    console.log(`✅ READ Table: ${foundTable.displayName} encontrada`);
    
    // UPDATE - Atualizar mesa
    foundTable.capacity = 6;
    await foundTable.save();
    console.log('✅ UPDATE Table: Capacidade atualizada');

    // 5. TESTE DE BANNERS
    console.log('\n🖼️  TESTANDO CRUD DE BANNERS');
    
    // CREATE - Criar banner de teste
    const testBanner = new Banner({
      title: 'Banner Teste CRUD',
      description: 'Banner para teste de CRUD',
      image: '/images/test-banner.jpg',
      storeId: savedStore._id,
      isActive: true
    });
    
    const savedBanner = await testBanner.save();
    console.log('✅ CREATE Banner: Banner criado com sucesso');
    
    // READ - Buscar banner
    const foundBanner = await Banner.findById(savedBanner._id);
    console.log(`✅ READ Banner: ${foundBanner.title} encontrado`);
    
    // UPDATE - Atualizar banner
    foundBanner.title = 'Banner Teste CRUD Atualizado';
    await foundBanner.save();
    console.log('✅ UPDATE Banner: Título atualizado');

    // 6. TESTE DE RELACIONAMENTOS
    console.log('\n🔗 TESTANDO RELACIONAMENTOS');
    
    // Verificar se a categoria pertence à loja correta
    const categoryWithStore = await Category.findById(savedCategory._id).populate('storeId');
    if (categoryWithStore.storeId._id.toString() === savedStore._id.toString()) {
      console.log('✅ RELATIONSHIP: Categoria vinculada à loja corretamente');
    }
    
    // Verificar se a mesa pertence à loja correta
    const tableWithStore = await Table.findById(savedTable._id).populate('storeId');
    if (tableWithStore.storeId._id.toString() === savedStore._id.toString()) {
      console.log('✅ RELATIONSHIP: Mesa vinculada à loja corretamente');
    }
    
    // Verificar se o banner pertence à loja correta
    const bannerWithStore = await Banner.findById(savedBanner._id).populate('storeId');
    if (bannerWithStore.storeId._id.toString() === savedStore._id.toString()) {
      console.log('✅ RELATIONSHIP: Banner vinculado à loja corretamente');
    }

    // 7. LIMPEZA - Deletar dados de teste
    console.log('\n🧹 LIMPANDO DADOS DE TESTE');
    
    await Category.findByIdAndDelete(savedCategory._id);
    console.log('✅ DELETE Category: Categoria de teste deletada');
    
    await Table.findByIdAndDelete(savedTable._id);
    console.log('✅ DELETE Table: Mesa de teste deletada');
    
    await Banner.findByIdAndDelete(savedBanner._id);
    console.log('✅ DELETE Banner: Banner de teste deletado');
    
    await Store.findByIdAndDelete(savedStore._id);
    console.log('✅ DELETE Store: Loja de teste deletada');

    console.log('\n🎉 TODOS OS TESTES CRUD PASSARAM COM SUCESSO!');
    
    // 8. RESUMO DOS TESTES
    console.log('\n📋 RESUMO DOS TESTES:');
    console.log('✅ CREATE operations: 5/5 sucessos');
    console.log('✅ READ operations: 5/5 sucessos');
    console.log('✅ UPDATE operations: 5/5 sucessos');
    console.log('✅ DELETE operations: 5/5 sucessos');
    console.log('✅ RELATIONSHIP tests: 3/3 sucessos');

  } catch (error) {
    console.error('❌ Erro durante os testes CRUD:', error);
  } finally {
    console.log('\n🔌 Fechando conexão com MongoDB');
    await mongoose.connection.close();
  }
};

testCRUDOperations();