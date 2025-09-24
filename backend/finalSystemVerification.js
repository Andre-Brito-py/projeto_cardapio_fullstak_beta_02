import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/food_delivery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para verificar todas as collections
const verifyAllCollections = async () => {
  console.log('\n📋 VERIFICANDO TODAS AS COLLECTIONS');
  
  try {
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log(`📊 Total de collections: ${collections.length}`);
    
    for (const collection of collections) {
      const collectionName = collection.name;
      const count = await db.collection(collectionName).countDocuments();
      console.log(`📁 ${collectionName}: ${count} documentos`);
      
      // Mostrar alguns documentos de exemplo para collections importantes
      if (['users', 'stores', 'categories'].includes(collectionName) && count > 0) {
        const samples = await db.collection(collectionName).find({}).limit(3).toArray();
        samples.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.name || doc.email || doc.title || 'Documento'} (${doc.role || doc.status || 'N/A'})`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de collections:', error.message);
  }
};

// Função para testar autenticação com usuários reais
const testRealUserAuthentication = async () => {
  console.log('\n🔐 TESTANDO AUTENTICAÇÃO COM USUÁRIOS REAIS');
  
  try {
    const db = mongoose.connection.db;
    const users = await db.collection('users').find({}).toArray();
    
    if (users.length === 0) {
      console.log('❌ Nenhum usuário encontrado para teste');
      return;
    }
    
    console.log(`👥 Encontrados ${users.length} usuários:`);
    
    for (const user of users) {
      console.log(`\n--- Testando ${user.email} ---`);
      console.log(`👤 Nome: ${user.name}`);
      console.log(`🎭 Role: ${user.role}`);
      console.log(`✅ Ativo: ${user.isActive}`);
      
      // Testar senha padrão
      const testPassword = '123456';
      try {
        const isPasswordValid = await bcrypt.compare(testPassword, user.password);
        console.log(`🔑 Senha padrão (123456): ${isPasswordValid ? '✅ FUNCIONA' : '❌ NÃO FUNCIONA'}`);
        
        if (isPasswordValid) {
          // Gerar JWT
          const token = jwt.sign(
            {
              userId: user._id,
              email: user.email,
              role: user.role
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' }
          );
          console.log(`🎫 JWT gerado: ${token.substring(0, 30)}...`);
        }
        
      } catch (error) {
        console.log(`❌ Erro ao testar senha: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de autenticação:', error.message);
  }
};

// Função para verificar relacionamentos
const verifyRelationships = async () => {
  console.log('\n🔗 VERIFICANDO RELACIONAMENTOS');
  
  try {
    const db = mongoose.connection.db;
    
    // Verificar stores e seus admins
    const stores = await db.collection('stores').find({}).toArray();
    console.log(`🏪 Lojas encontradas: ${stores.length}`);
    
    for (const store of stores) {
      console.log(`\n--- Loja: ${store.name} ---`);
      console.log(`🆔 ID: ${store._id}`);
      console.log(`👤 Owner ID: ${store.owner}`);
      
      // Buscar o owner
      if (store.owner) {
        const owner = await db.collection('users').findOne({ _id: new mongoose.Types.ObjectId(store.owner) });
        if (owner) {
          console.log(`✅ Owner encontrado: ${owner.name} (${owner.email})`);
        } else {
          console.log(`❌ Owner não encontrado`);
        }
      }
      
      // Verificar categorias da loja
      const categories = await db.collection('categories').find({ storeId: store._id }).toArray();
      console.log(`📂 Categorias: ${categories.length}`);
      
      // Verificar mesas da loja
      const tables = await db.collection('tables').find({ storeId: store._id }).toArray();
      console.log(`🪑 Mesas: ${tables.length}`);
      
      // Verificar banners da loja
      const banners = await db.collection('banners').find({ storeId: store._id }).toArray();
      console.log(`🖼️  Banners: ${banners.length}`);
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de relacionamentos:', error.message);
  }
};

// Função para verificar integridade dos dados
const verifyDataIntegrity = async () => {
  console.log('\n🔍 VERIFICANDO INTEGRIDADE DOS DADOS');
  
  try {
    const db = mongoose.connection.db;
    const issues = [];
    
    // Verificar usuários sem email
    const usersWithoutEmail = await db.collection('users').find({ email: { $exists: false } }).toArray();
    if (usersWithoutEmail.length > 0) {
      issues.push(`${usersWithoutEmail.length} usuários sem email`);
    }
    
    // Verificar lojas sem owner
    const storesWithoutOwner = await db.collection('stores').find({ owner: { $exists: false } }).toArray();
    if (storesWithoutOwner.length > 0) {
      issues.push(`${storesWithoutOwner.length} lojas sem owner`);
    }
    
    // Verificar categorias sem storeId
    const categoriesWithoutStore = await db.collection('categories').find({ storeId: { $exists: false } }).toArray();
    if (categoriesWithoutStore.length > 0) {
      issues.push(`${categoriesWithoutStore.length} categorias sem loja`);
    }
    
    // Verificar mesas sem storeId
    const tablesWithoutStore = await db.collection('tables').find({ storeId: { $exists: false } }).toArray();
    if (tablesWithoutStore.length > 0) {
      issues.push(`${tablesWithoutStore.length} mesas sem loja`);
    }
    
    if (issues.length === 0) {
      console.log('✅ Nenhum problema de integridade encontrado');
    } else {
      console.log('❌ Problemas encontrados:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de integridade:', error.message);
  }
};

// Função para gerar relatório final
const generateFinalReport = async () => {
  console.log('\n📊 RELATÓRIO FINAL DO SISTEMA');
  
  try {
    const db = mongoose.connection.db;
    
    const userCount = await db.collection('users').countDocuments();
    const storeCount = await db.collection('stores').countDocuments();
    const categoryCount = await db.collection('categories').countDocuments();
    const tableCount = await db.collection('tables').countDocuments();
    const bannerCount = await db.collection('banners').countDocuments();
    const customerCount = await db.collection('customers').countDocuments();
    
    console.log('='.repeat(50));
    console.log('📈 ESTATÍSTICAS GERAIS:');
    console.log(`👥 Usuários: ${userCount}`);
    console.log(`🏪 Lojas: ${storeCount}`);
    console.log(`📂 Categorias: ${categoryCount}`);
    console.log(`🪑 Mesas: ${tableCount}`);
    console.log(`🖼️  Banners: ${bannerCount}`);
    console.log(`🛒 Clientes: ${customerCount}`);
    
    // Verificar usuários por role
    const usersByRole = await db.collection('users').aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]).toArray();
    
    console.log('\n👥 USUÁRIOS POR ROLE:');
    usersByRole.forEach(role => {
      console.log(`   ${role._id}: ${role.count}`);
    });
    
    console.log('='.repeat(50));
    
  } catch (error) {
    console.error('❌ Erro na geração do relatório:', error.message);
  }
};

// Função principal
const runFinalVerification = async () => {
  console.log('=== VERIFICAÇÃO FINAL COMPLETA DO SISTEMA ===');
  
  await connectDB();
  
  await verifyAllCollections();
  await testRealUserAuthentication();
  await verifyRelationships();
  await verifyDataIntegrity();
  await generateFinalReport();
  
  console.log('\n🎉 VERIFICAÇÃO FINAL CONCLUÍDA!');
  
  // Fechar conexão
  await mongoose.connection.close();
  console.log('🔌 Fechando conexão com MongoDB');
};

// Executar verificação
runFinalVerification().catch(console.error);