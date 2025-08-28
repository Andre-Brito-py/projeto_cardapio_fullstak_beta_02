const axios = require('axios');
const mongoose = require('mongoose');

// Create user schema directly since we can't import ES modules in CommonJS
const userSchema = new mongoose.Schema({
    name:{type:String, required:true},
    email:{type:String, required:true, unique:true},
    password:{type:String, required:true},
    cartData:{type:Object, default:{}},
    role: {
        type: String,
        enum: ['super_admin', 'store_admin', 'customer'],
        default: 'customer'
    }
},{minimize:false});

const userModel = mongoose.model('User', userSchema);

const BASE_URL = 'http://localhost:4000';

async function testCartFunctionality() {
    console.log('🧪 Iniciando teste abrangente do carrinho...');
    
    try {
        // 1. Teste de conexão básica
        console.log('\n1. Testando conexão com API...');
        const healthCheck = await axios.get(`${BASE_URL}/api/food/list`);
        console.log('✅ API respondendo:', healthCheck.status === 200);
        console.log('📦 Produtos disponíveis:', healthCheck.data.data.length);
        
        // 2. Conectar ao MongoDB para criar usuário de teste
        console.log('\n2. Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/food-delivery');
        console.log('✅ Conectado ao MongoDB');
        
        // 3. Criar usuário de teste
        console.log('\n3. Criando usuário de teste...');
        const testUser = {
            name: 'Test User Cart',
            email: 'testcart@example.com',
            password: 'password123'
        };
        
        // Limpar usuário existente se houver
        await userModel.deleteOne({ email: testUser.email });
        
        // Registrar novo usuário
        const registerResponse = await axios.post(`${BASE_URL}/api/user/register`, testUser);
        console.log('✅ Usuário registrado:', registerResponse.data.success);
        
        // 4. Fazer login
        console.log('\n4. Fazendo login...');
        const loginResponse = await axios.post(`${BASE_URL}/api/user/login`, {
            email: testUser.email,
            password: testUser.password
        });
        console.log('✅ Login realizado:', loginResponse.data.success);
        const token = loginResponse.data.token;
        
        // 5. Testar adição ao carrinho
        console.log('\n5. Testando adição ao carrinho...');
        const productId = healthCheck.data.data[0]._id; // Primeiro produto
        const addToCartResponse = await axios.post(
            `${BASE_URL}/api/cart/add`,
            {
                itemId: productId,
                quantity: 2
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log('✅ Produto adicionado ao carrinho:', addToCartResponse.data.success);
        
        // 6. Verificar carrinho
        console.log('\n6. Verificando carrinho...');
        const getCartResponse = await axios.post(
            `${BASE_URL}/api/cart/get`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log('✅ Carrinho recuperado:', getCartResponse.data.success);
        console.log('📦 Itens no carrinho:', Object.keys(getCartResponse.data.cartData || {}).length);
        
        // 7. Testar remoção do carrinho
        console.log('\n7. Testando remoção do carrinho...');
        const removeFromCartResponse = await axios.post(
            `${BASE_URL}/api/cart/remove`,
            {
                itemId: productId
            },
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log('✅ Produto removido do carrinho:', removeFromCartResponse.data.success);
        
        // 8. Verificar carrinho após remoção
        console.log('\n8. Verificando carrinho após remoção...');
        const finalCartResponse = await axios.post(
            `${BASE_URL}/api/cart/get`,
            {},
            {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }
        );
        console.log('✅ Carrinho final verificado:', finalCartResponse.data.success);
        console.log('📦 Itens restantes no carrinho:', Object.keys(finalCartResponse.data.cartData || {}).length);
        
        // Limpar usuário de teste
        await userModel.deleteOne({ email: testUser.email });
        console.log('\n🧹 Usuário de teste removido');
        
        console.log('\n🎉 Teste abrangente do carrinho concluído com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro no teste:', error.response?.data || error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada');
    }
}

testCartFunctionality();