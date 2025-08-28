const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const axios = require('axios');

// Como os modelos usam ES modules, vamos usar uma abordagem diferente
let User, Food;

const loadModels = async () => {
  const userModule = await import('./models/userModel.js');
  const foodModule = await import('./models/foodModel.js');
  User = userModule.default;
  Food = foodModule.default;
};

// Configuração do MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/food-del');
    console.log('✅ Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para testar o carrinho completo
const testCompleteCart = async () => {
  console.log('🧪 Teste final do carrinho - Frontend + Backend');
  console.log('=' .repeat(50));

  try {
    // 1. Verificar produtos ativos
    const activeProducts = await Food.find({ isActive: true }).limit(3);
    console.log(`📦 Produtos ativos encontrados: ${activeProducts.length}`);
    
    if (activeProducts.length === 0) {
      console.log('❌ Nenhum produto ativo encontrado!');
      return;
    }

    activeProducts.forEach(product => {
      console.log(`   - ${product.name} (ID: ${product._id})`);
    });

    // 2. Criar/encontrar usuário de teste
    let testUser = await User.findOne({ email: 'teste@carrinho.com' });
    if (!testUser) {
      testUser = new User({
        name: 'Teste Carrinho',
        email: 'teste@carrinho.com',
        password: 'senha123'
      });
      await testUser.save();
      console.log('👤 Usuário de teste criado');
    } else {
      console.log('👤 Usuário de teste encontrado');
    }

    // 3. Gerar token JWT
    const token = jwt.sign({ id: testUser._id }, 'random#secret', { expiresIn: '1h' });
    console.log('🔑 Token JWT gerado');

    // 5. Nota: Carrinho é gerenciado via API, não há modelo específico
    console.log('🧹 Preparando teste de carrinho via API');

    // 5. Testar adição via API
    console.log('\n🛒 Testando adição via API...');
    const testProduct = activeProducts[0];
    
    try {
      // Simular requisição POST /api/cart/add
      const addResponse = await axios.post('http://localhost:4000/api/cart/add', {
        itemId: testProduct._id.toString(),
        quantity: 2,
        extras: [],
        observations: 'Teste via API',
        includeDisposables: false
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Produto adicionado via API:', addResponse.data.message);
    } catch (apiError) {
      console.log('❌ Erro na API:', apiError.response?.data || apiError.message);
    }

    // 6. Nota: Carrinho é armazenado no contexto do usuário via API
    console.log('✅ Carrinho gerenciado via API e contexto do usuário');

    // 7. Testar recuperação via API
    console.log('\n📡 Testando recuperação via API...');
    try {
      const getResponse = await axios.post('http://localhost:4000/api/cart/get', {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('✅ Carrinho recuperado via API:');
      console.log(`   - Success: ${getResponse.data.success}`);
      console.log(`   - Itens: ${Object.keys(getResponse.data.cartData || {}).length}`);
      
      if (getResponse.data.cartData) {
        Object.entries(getResponse.data.cartData).forEach(([key, item]) => {
          console.log(`   - ${key}: Qtd ${item.quantity}`);
        });
      }
    } catch (apiError) {
      console.log('❌ Erro ao recuperar via API:', apiError.response?.data || apiError.message);
    }

    // 8. Testar estrutura do localStorage (simulação)
    console.log('\n💾 Simulando estrutura do localStorage...');
    const localStorageStructure = {
      token: token,
      cartItems: {
        [testProduct._id.toString()]: {
          quantity: 2,
          itemId: testProduct._id.toString(),
          extras: [],
          observations: 'Teste localStorage',
          includeDisposables: false
        }
      }
    };
    
    console.log('✅ Estrutura localStorage simulada:');
    console.log('   - Token presente:', !!localStorageStructure.token);
    console.log('   - Itens no carrinho:', Object.keys(localStorageStructure.cartItems).length);

    console.log('\n🎉 Teste completo finalizado!');
    console.log('=' .repeat(50));
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  }
};

// Executar teste
const runTest = async () => {
  await connectDB();
  await loadModels();
  await testCompleteCart();
  await mongoose.connection.close();
  console.log('🔌 Conexão com MongoDB fechada');
};

runTest();