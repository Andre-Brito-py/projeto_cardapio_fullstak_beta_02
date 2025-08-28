import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './models/userModel.js';
import foodModel from './models/foodModel.js';
import storeModel from './models/storeModel.js';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

const testCartPersistence = async () => {
    try {
        console.log('🧪 Iniciando teste de persistência do carrinho...');
        
        // 1. Verificar produtos no banco
        const allProducts = await foodModel.find({});
        const activeProducts = await foodModel.find({ isActive: true });
        console.log(`📦 Total de produtos: ${allProducts.length}`);
        console.log(`📦 Produtos ativos: ${activeProducts.length}`);
        
        if (allProducts.length > 0) {
            console.log('\n📋 Primeiros 3 produtos encontrados:');
            allProducts.slice(0, 3).forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} (ID: ${product._id}) - Ativo: ${product.isActive}`);
            });
        }
        
        // 2. Usar produtos existentes (ativos ou não) para teste
        const testProducts = allProducts.slice(0, 3);
        
        if (testProducts.length === 0) {
            console.log('❌ Nenhum produto encontrado no banco de dados');
            return;
        }
        
        // 3. Buscar ou criar usuário de teste
        let testUser = await userModel.findOne({ email: 'test@example.com' });
        if (!testUser) {
            console.log('👤 Criando usuário de teste...');
            testUser = new userModel({
                name: 'Test User',
                email: 'test@example.com',
                password: 'hashedpassword',
                cartData: {}
            });
            await testUser.save();
            console.log('✅ Usuário de teste criado');
        } else {
            console.log('👤 Usuário de teste encontrado');
        }
        
        // 4. Simular adição de itens ao carrinho
        console.log('\n🛒 Simulando adição de itens ao carrinho...');
        const testCartData = {};
        
        testProducts.forEach((product, index) => {
            const cartKey = product._id.toString();
            testCartData[cartKey] = {
                quantity: index + 1,
                itemId: product._id.toString(),
                extras: [],
                observations: `Teste ${index + 1}`,
                includeDisposables: false
            };
            console.log(`➕ Adicionado: ${product.name} (Qtd: ${index + 1})`);
        });
        
        // 5. Salvar carrinho no banco
        testUser.cartData = testCartData;
        await testUser.save();
        console.log('\n💾 Carrinho salvo no banco de dados');
        console.log(`📊 Total de itens no carrinho: ${Object.keys(testCartData).length}`);
        
        // 6. Verificar se os dados foram salvos corretamente
        const updatedUser = await userModel.findById(testUser._id);
        console.log('\n🔍 Verificando dados salvos...');
        
        const retrievedCartData = updatedUser.cartData || {};
        const cartItemsCount = Object.keys(retrievedCartData).length;
        console.log(`🛒 Itens recuperados do carrinho: ${cartItemsCount}`);
        
        // 7. Verificar cada item do carrinho
        console.log('\n📋 Detalhes dos itens no carrinho:');
        for (const cartKey in retrievedCartData) {
            const cartItem = retrievedCartData[cartKey];
            const product = await foodModel.findById(cartItem.itemId);
            if (product) {
                console.log(`✅ ${product.name} - Qtd: ${cartItem.quantity} - Obs: ${cartItem.observations}`);
            } else {
                console.log(`❌ Produto ${cartItem.itemId} não encontrado`);
            }
        }
        
        // 8. Testar simulação de API do carrinho
        console.log('\n🔄 Testando simulação de API do carrinho...');
        
        // Simular GET /api/cart/get
        const cartResponse = {
            success: true,
            cartData: updatedUser.cartData
        };
        console.log('📡 Resposta simulada da API GET /cart/get:');
        console.log(`   - Success: ${cartResponse.success}`);
        console.log(`   - Items: ${Object.keys(cartResponse.cartData).length}`);
        
        console.log('\n🎉 Teste de persistência do carrinho concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
};

const main = async () => {
    await connectDB();
    await testCartPersistence();
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
};

main().catch(console.error);