const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.log('❌ Erro ao conectar:', err));

// Schema do usuário
const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  role: String,
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
  isActive: { type: Boolean, default: true },
  lastLogin: Date
});

const User = mongoose.model('User', userSchema);

// Schema da loja
const storeSchema = new mongoose.Schema({
  name: String,
  slug: String,
  email: String,
  status: String,
  isActive: Boolean,
  subscription: {
    plan: String,
    status: String
  }
});

const Store = mongoose.model('Store', storeSchema);

async function createStoreAdmin() {
  try {
    // Buscar uma loja ativa
    const store = await Store.findOne({ slug: 'loja-de-teste-gar-om' });
    if (!store) {
      console.log('❌ Loja não encontrada');
      return;
    }
    
    console.log(`✅ Loja encontrada: ${store.name} (${store.slug})`);
    
    // Verificar se já existe um admin para esta loja
    const existingAdmin = await User.findOne({ 
      role: 'store_admin', 
      storeId: store._id 
    });
    
    if (existingAdmin) {
      console.log('✅ Admin da loja já existe:');
      console.log(`   Email: ${existingAdmin.email}`);
      console.log(`   Nome: ${existingAdmin.name}`);
      
      // Atualizar senha para garantir que seja 'admin123'
      const hashedPassword = await bcrypt.hash('admin123', 10);
      existingAdmin.password = hashedPassword;
      existingAdmin.isActive = true;
      await existingAdmin.save();
      
      console.log('✅ Senha atualizada para: admin123');
    } else {
      // Criar novo admin da loja
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const newAdmin = new User({
        name: 'Admin da Loja',
        email: 'admin@loja.com',
        password: hashedPassword,
        role: 'store_admin',
        storeId: store._id,
        isActive: true
      });
      
      await newAdmin.save();
      console.log('✅ Novo admin da loja criado:');
      console.log(`   Email: admin@loja.com`);
      console.log(`   Senha: admin123`);
    }
    
    console.log('\n🔐 CREDENCIAIS PARA TESTE:');
    console.log('=====================================');
    console.log('Email: admin@loja.com');
    console.log('Senha: admin123');
    console.log(`Store Slug: ${store.slug}`);
    
  } catch (error) {
    console.log('❌ Erro:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
    process.exit(0);
  }
}

createStoreAdmin();