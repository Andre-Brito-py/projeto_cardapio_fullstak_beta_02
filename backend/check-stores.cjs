const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Conectado ao MongoDB'))
  .catch(err => console.log('❌ Erro ao conectar:', err));

// Schema da loja (simplificado)
const storeSchema = new mongoose.Schema({
  name: String,
  slug: String,
  email: String,
  isActive: Boolean,
  subscription: {
    plan: String,
    status: String
  }
});

const Store = mongoose.model('Store', storeSchema);

async function checkStores() {
  try {
    const stores = await Store.find({});
    console.log(`\n📊 Total de lojas encontradas: ${stores.length}`);
    
    if (stores.length > 0) {
      console.log('\n🏪 Lojas disponíveis:');
      stores.forEach((store, index) => {
        console.log(`${index + 1}. Nome: ${store.name}`);
        console.log(`   Slug: ${store.slug}`);
        console.log(`   Email: ${store.email}`);
        console.log(`   Ativa: ${store.isActive}`);
        console.log(`   Plano: ${store.subscription?.plan || 'N/A'}`);
        console.log(`   Status: ${store.subscription?.status || 'N/A'}`);
        console.log('---');
      });
    } else {
      console.log('⚠️ Nenhuma loja encontrada no sistema');
      console.log('💡 Você precisa criar uma loja primeiro');
    }
    
  } catch (error) {
    console.log('❌ Erro ao buscar lojas:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão fechada');
    process.exit(0);
  }
}

checkStores();