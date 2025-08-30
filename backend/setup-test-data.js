// Script para criar dados de teste e resolver o erro "Loja não encontrada"
// Este script deve ser executado no diretório backend: node ../setup-test-data.js

import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import foodModel from './models/foodModel.js';
import categoryModel from './models/categoryModel.js';
import userModel from './models/userModel.js';
import bcrypt from 'bcrypt';

// Configuração do banco de dados
const DB_URI = 'mongodb://localhost:27017/food-del';

// Função para conectar ao banco
const connectDB = async () => {
    try {
        await mongoose.connect(DB_URI);
        console.log('✅ Conectado ao MongoDB');
        return true;
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error.message);
        return false;
    }
};

// Função para criar loja de teste
const createTestStore = async () => {
    try {
        // Verificar se já existe uma loja de teste
        const existingStore = await Store.findOne({ slug: 'loja-teste' });
        if (existingStore) {
            console.log('✅ Loja de teste já existe:', existingStore.name);
            return existingStore;
        }

        // Criar nova loja de teste
        const testStore = new Store({
            name: 'Loja Teste - Food Delivery',
            slug: 'loja-teste',
            email: 'admin@loja-teste.com',
            phone: '(11) 99999-9999',
            address: 'Rua Teste, 123 - Centro',
            description: 'Loja de teste para demonstração do sistema',
            status: 'active',
            isOpen: true,
            subscription: {
                plan: 'Básico',
                status: 'active',
                startDate: new Date(),
                endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 dias
            },
            settings: {
                currency: 'BRL',
                language: 'pt-BR',
                timezone: 'America/Sao_Paulo',
                deliveryFee: 5.00,
                minimumOrder: 20.00,
                maxDeliveryDistance: 10,
                estimatedDeliveryTime: 45,
                acceptsOnlinePayment: true,
                acceptsCashOnDelivery: true
            },
            customization: {
                primaryColor: '#ff6b35',
                secondaryColor: '#2c3e50',
                logo: null,
                banner: null
            },
            analytics: {
                totalOrders: 0,
                totalRevenue: 0,
                averageOrderValue: 0,
                topSellingItems: []
            }
        });

        const savedStore = await testStore.save();
        console.log('✅ Loja de teste criada:', savedStore.name);
        return savedStore;
    } catch (error) {
        console.error('❌ Erro ao criar loja de teste:', error.message);
        return null;
    }
};

// Função para criar categorias de teste
const createTestCategories = async (storeId) => {
    try {
        const categories = [
            { name: 'Hambúrgueres', image: 'hamburger-category.jpg', storeId, isActive: true },
            { name: 'Pizzas', image: 'pizza-category.jpg', storeId, isActive: true },
            { name: 'Bebidas', image: 'drinks-category.jpg', storeId, isActive: true },
            { name: 'Sobremesas', image: 'dessert-category.jpg', storeId, isActive: true }
        ];

        const createdCategories = [];
        for (const categoryData of categories) {
            const existingCategory = await categoryModel.findOne({ 
                name: categoryData.name, 
                storeId: categoryData.storeId 
            });
            
            if (!existingCategory) {
                const category = new categoryModel(categoryData);
                const savedCategory = await category.save();
                createdCategories.push(savedCategory);
                console.log(`✅ Categoria criada: ${savedCategory.name}`);
            } else {
                createdCategories.push(existingCategory);
                console.log(`✅ Categoria já existe: ${existingCategory.name}`);
            }
        }

        return createdCategories;
    } catch (error) {
        console.error('❌ Erro ao criar categorias:', error.message);
        return [];
    }
};

// Função para criar produtos de teste
const createTestProducts = async (storeId, categories) => {
    try {
        const products = [
            {
                name: 'Hambúrguer Clássico',
                description: 'Hambúrguer com carne, queijo, alface e tomate',
                price: 25.90,
                category: 'Hambúrgueres',
                image: 'hamburger.jpg',
                storeId,
                isActive: true
            },
            {
                name: 'Pizza Margherita',
                description: 'Pizza com molho de tomate, mussarela e manjericão',
                price: 35.90,
                category: 'Pizzas',
                image: 'pizza.jpg',
                storeId,
                isActive: true
            },
            {
                name: 'Coca-Cola 350ml',
                description: 'Refrigerante Coca-Cola lata 350ml',
                price: 5.90,
                category: 'Bebidas',
                image: 'coca.jpg',
                storeId,
                isActive: true
            },
            {
                name: 'Brownie com Sorvete',
                description: 'Brownie de chocolate com sorvete de baunilha',
                price: 15.90,
                category: 'Sobremesas',
                image: 'brownie.jpg',
                storeId,
                isActive: true
            }
        ];

        const createdProducts = [];
        for (const productData of products) {
            const existingProduct = await foodModel.findOne({ 
                name: productData.name, 
                storeId: productData.storeId 
            });
            
            if (!existingProduct) {
                const product = new foodModel(productData);
                const savedProduct = await product.save();
                createdProducts.push(savedProduct);
                console.log(`✅ Produto criado: ${savedProduct.name}`);
            } else {
                createdProducts.push(existingProduct);
                console.log(`✅ Produto já existe: ${existingProduct.name}`);
            }
        }

        return createdProducts;
    } catch (error) {
        console.error('❌ Erro ao criar produtos:', error.message);
        return [];
    }
};

// Função para criar usuário admin de teste
const createTestAdmin = async (storeId) => {
    try {
        const existingAdmin = await userModel.findOne({ email: 'admin@loja-teste.com' });
        if (existingAdmin) {
            console.log('✅ Admin de teste já existe');
            return existingAdmin;
        }

        const hashedPassword = await bcrypt.hash('admin123', 10);
        const testAdmin = new userModel({
            name: 'Admin Loja Teste',
            email: 'admin@loja-teste.com',
            password: hashedPassword,
            role: 'store_admin',
            storeId: storeId,
            isActive: true
        });

        const savedAdmin = await testAdmin.save();
        console.log('✅ Admin de teste criado:', savedAdmin.email);
        return savedAdmin;
    } catch (error) {
        console.error('❌ Erro ao criar admin de teste:', error.message);
        return null;
    }
};

// Função principal
const setupTestData = async () => {
    console.log('========================================');
    console.log('    SETUP DE DADOS DE TESTE');
    console.log('========================================');
    console.log('');

    // Conectar ao banco
    const connected = await connectDB();
    if (!connected) {
        console.log('❌ Não foi possível conectar ao banco de dados');
        process.exit(1);
    }

    try {
        // Criar loja de teste
        console.log('\n[1/4] Criando loja de teste...');
        const testStore = await createTestStore();
        if (!testStore) {
            throw new Error('Falha ao criar loja de teste');
        }

        // Criar categorias
        console.log('\n[2/4] Criando categorias...');
        const categories = await createTestCategories(testStore._id);
        if (categories.length === 0) {
            throw new Error('Falha ao criar categorias');
        }

        // Criar produtos
        console.log('\n[3/4] Criando produtos...');
        const products = await createTestProducts(testStore._id, categories);
        if (products.length === 0) {
            throw new Error('Falha ao criar produtos');
        }

        // Criar admin
        console.log('\n[4/4] Criando admin de teste...');
        const admin = await createTestAdmin(testStore._id);

        console.log('\n========================================');
        console.log('    ✅ SETUP CONCLUÍDO COM SUCESSO!');
        console.log('========================================');
        console.log('');
        console.log('📍 Dados criados:');
        console.log(`   • Loja: ${testStore.name}`);
        console.log(`   • Slug: ${testStore.slug}`);
        console.log(`   • Categorias: ${categories.length}`);
        console.log(`   • Produtos: ${products.length}`);
        console.log(`   • Admin: ${admin ? admin.email : 'Não criado'}`);
        console.log('');
        console.log('🔗 Links de teste:');
        console.log(`   • Frontend: http://localhost:5173/loja/${testStore.slug}`);
        console.log(`   • Admin: http://localhost:5174`);
        console.log('');
        console.log('🔑 Credenciais de admin:');
        console.log('   • Email: admin@loja-teste.com');
        console.log('   • Senha: admin123');
        console.log('');

    } catch (error) {
        console.error('❌ Erro durante o setup:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com o banco fechada');
    }
};

// Executar o setup
setupTestData().catch(console.error);