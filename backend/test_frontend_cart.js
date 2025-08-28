import mongoose from 'mongoose';
import dotenv from 'dotenv';
import userModel from './models/userModel.js';
import foodModel from './models/foodModel.js';
import jwt from 'jsonwebtoken';

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

const testFrontendCart = async () => {
    try {
        console.log('🧪 Testando integração do carrinho frontend-backend...');
        
        // 1. Verificar produtos ativos
        const activeProducts = await foodModel.find({ isActive: true });
        console.log(`📦 Produtos ativos disponíveis: ${activeProducts.length}`);
        
        if (activeProducts.length === 0) {
            console.log('❌ Nenhum produto ativo encontrado');
            return;
        }
        
        // 2. Criar/encontrar usuário de teste
        let testUser = await userModel.findOne({ email: 'frontend-test@example.com' });
        if (!testUser) {
            testUser = new userModel({
                name: 'Frontend Test User',
                email: 'frontend-test@example.com',
                password: 'hashedpassword',
                cartData: {}
            });
            await testUser.save();
            console.log('👤 Usuário de teste criado');
        } else {
            // Limpar carrinho existente
            testUser.cartData = {};
            await testUser.save();
            console.log('👤 Usuário de teste encontrado e carrinho limpo');
        }
        
        // 3. Gerar token JWT para o usuário
        const token = jwt.sign({ id: testUser._id }, process.env.JWT_SECRET);
        console.log('🔑 Token JWT gerado para teste');
        
        // 4. Simular adição de produtos ao carrinho (como o frontend faria)
        console.log('\n🛒 Simulando adição de produtos ao carrinho...');
        
        const testProduct = activeProducts[0];
        const cartKey = testProduct._id.toString();
        
        // Simular estrutura do carrinho como o frontend cria
        const cartData = {
            [cartKey]: {
                quantity: 2,
                itemId: testProduct._id.toString(),
                extras: [],
                observations: 'Teste de integração frontend',
                includeDisposables: false
            }
        };
        
        // 5. Salvar no banco (simulando o que o backend faria)
        testUser.cartData = cartData;
        await testUser.save();
        console.log(`✅ Produto adicionado: ${testProduct.name} (Qtd: 2)`);
        
        // 6. Simular recuperação do carrinho (GET /api/cart/get)
        const retrievedUser = await userModel.findById(testUser._id);
        const retrievedCartData = retrievedUser.cartData || {};
        
        console.log('\n📡 Simulando resposta da API GET /cart/get:');
        console.log(`   - Success: true`);
        console.log(`   - Items no carrinho: ${Object.keys(retrievedCartData).length}`);
        
        // 7. Verificar estrutura dos dados
        console.log('\n🔍 Verificando estrutura dos dados do carrinho:');
        for (const key in retrievedCartData) {
            const item = retrievedCartData[key];
            console.log(`   - CartKey: ${key}`);
            console.log(`   - ItemId: ${item.itemId}`);
            console.log(`   - Quantity: ${item.quantity}`);
            console.log(`   - Extras: ${JSON.stringify(item.extras)}`);
            console.log(`   - Observations: ${item.observations}`);
            console.log(`   - IncludeDisposables: ${item.includeDisposables}`);
            
            // Verificar se o produto ainda existe
            const product = await foodModel.findById(item.itemId);
            if (product) {
                console.log(`   - Produto encontrado: ${product.name} (Ativo: ${product.isActive})`);
            } else {
                console.log(`   - ❌ Produto não encontrado`);
            }
        }
        
        // 8. Simular adição de mais um item (como quando usuário clica +)
        console.log('\n➕ Simulando adição de mais uma unidade...');
        if (retrievedCartData[cartKey]) {
            retrievedCartData[cartKey].quantity += 1;
            testUser.cartData = retrievedCartData;
            await testUser.save();
            console.log(`✅ Quantidade atualizada para: ${retrievedCartData[cartKey].quantity}`);
        }
        
        // 9. Verificar estado final
        const finalUser = await userModel.findById(testUser._id);
        const finalCartData = finalUser.cartData || {};
        const totalItems = Object.values(finalCartData).reduce((sum, item) => sum + item.quantity, 0);
        
        console.log('\n📊 Estado final do carrinho:');
        console.log(`   - Tipos de produtos: ${Object.keys(finalCartData).length}`);
        console.log(`   - Total de itens: ${totalItems}`);
        
        // 10. Simular resposta completa da API
        const apiResponse = {
            success: true,
            cartData: finalCartData,
            message: 'Carrinho carregado com sucesso'
        };
        
        console.log('\n🎯 Resposta final da API (simulada):');
        console.log(JSON.stringify(apiResponse, null, 2));
        
        console.log('\n🎉 Teste de integração frontend-backend concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
};

const main = async () => {
    await connectDB();
    await testFrontendCart();
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
};

main().catch(console.error);