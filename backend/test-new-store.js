import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import userModel from './models/userModel.js';
import categoryModel from './models/categoryModel.js';
import { setupDefaultCategories } from './setup-default-categories.js';
import bcrypt from 'bcrypt';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://admin:admin123@localhost:27017/mern-food-delivery-app?authSource=admin');
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Função para criar nova loja e testar categorias
const createNewTestStore = async () => {
    try {
        const timestamp = Date.now();
        console.log('🏪 Criando nova loja de teste...');
        
        // Dados da nova loja
        const storeData = {
            name: `Loja Teste Categorias ${timestamp}`,
            description: 'Loja para testar criação automática de categorias',
            slug: `loja-teste-categorias-${timestamp}`,
            customization: {
                bannerImage: 'banner_principal.png',
                defaultCategories: true
            },
            domain: {
                subdomain: `loja-teste-categorias-${timestamp}`
            },
            subscription: {
                plan: 'basic',
                status: 'trial'
            },
            settings: {
                restaurantAddress: 'Rua Teste, 123',
                address: {
                    street: 'Rua Teste',
                    number: '123',
                    neighborhood: 'Centro',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01000-000'
                },
                currency: 'BRL',
                language: 'pt-BR',
                timezone: 'America/Sao_Paulo'
            }
        };
        
        // Criar um ObjectId temporário para o owner
        const tempOwnerId = new mongoose.Types.ObjectId();
        storeData.owner = tempOwnerId;
        
        // Criar loja primeiro
        const store = new Store(storeData);
        await store.save();
        console.log('🏪 Loja criada:', store.name, '- ID:', store._id);
        
        // Criar proprietário com storeId
        const ownerData = {
            name: 'Proprietário Teste',
            email: `proprietario${timestamp}@teste.com`,
            password: await bcrypt.hash('senha123', 10),
            role: 'store_admin',
            storeId: store._id
        };
        
        const owner = new userModel(ownerData);
        await owner.save();
        console.log('👤 Proprietário criado:', owner.email);
        
        // Atualizar a loja com o proprietário real
        store.owner = owner._id;
        await store.save();
        
        console.log('📋 Configurações da loja:');
        console.log('- Banner:', store.customization?.bannerImage);
        console.log('- Categorias padrão habilitadas:', store.customization?.defaultCategories);
        
        // Verificar categorias antes de setupDefaultCategories
        const categoriesBefore = await categoryModel.find({ storeId: store._id });
        console.log('\n📂 Categorias antes do setup:', categoriesBefore.length);
        
        // Configurar categorias padrão
        console.log('\n🔄 Configurando categorias padrão...');
        try {
            await setupDefaultCategories(store._id, false);
            console.log('✅ setupDefaultCategories executado com sucesso');
        } catch (categoryError) {
            console.error('❌ Erro ao configurar categorias:', categoryError);
        }
        
        // Verificar categorias após setup
        const categoriesAfter = await categoryModel.find({ storeId: store._id });
        console.log('\n📂 Categorias após setup:', categoriesAfter.length);
        
        if (categoriesAfter.length > 0) {
            console.log('✅ Categorias criadas com sucesso!');
            categoriesAfter.forEach(category => {
                console.log(`  - ${category.name}: ${category.image}`);
            });
        } else {
            console.log('❌ Nenhuma categoria foi criada');
        }
        
        // Verificar se o banner está correto
        if (store.customization?.bannerImage === 'banner_principal.png') {
            console.log('\n✅ Banner padrão configurado corretamente!');
        } else {
            console.log('\n❌ Banner padrão não configurado');
        }
        
        console.log('\n📋 Resumo da loja criada:');
        console.log('- ID:', store._id);
        console.log('- Nome:', store.name);
        console.log('- Slug:', store.slug);
        console.log('- Status:', store.status);
        console.log('- Banner:', store.customization?.bannerImage);
        console.log('- Categorias padrão:', store.customization?.defaultCategories);
        console.log('- Total de categorias:', categoriesAfter.length);
        
    } catch (error) {
        console.error('❌ Erro ao criar loja de teste:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar
const run = async () => {
    await connectDB();
    await createNewTestStore();
    process.exit(0);
};

run();