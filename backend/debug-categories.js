import mongoose from 'mongoose';
import Store from './models/storeModel.js';
import categoryModel from './models/categoryModel.js';
import { setupDefaultCategories, createDefaultCategories } from './setup-default-categories.js';

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

// Função para debugar criação de categorias
const debugCategories = async () => {
    try {
        console.log('🔍 Buscando loja de teste...');
        
        // Buscar a loja de teste mais recente
        const testStore = await Store.findOne({ 
            name: { $regex: /teste|test/i } 
        }).sort({ createdAt: -1 });
        
        if (!testStore) {
            console.log('❌ Nenhuma loja de teste encontrada');
            return;
        }
        
        console.log('📋 Loja encontrada:', testStore.name, '- ID:', testStore._id);
        
        // Verificar categorias existentes antes
        const existingCategories = await categoryModel.find({ storeId: testStore._id });
        console.log('📂 Categorias existentes antes:', existingCategories.length);
        
        // Deletar categorias existentes para testar criação limpa
        if (existingCategories.length > 0) {
            await categoryModel.deleteMany({ storeId: testStore._id });
            console.log('🗑️ Categorias existentes removidas para teste limpo');
        }
        
        console.log('\n🔄 Testando createDefaultCategories diretamente...');
        
        // Testar a função createDefaultCategories diretamente
        await createDefaultCategories(testStore._id);
        
        // Verificar se as categorias foram criadas
        const newCategories = await categoryModel.find({ storeId: testStore._id });
        console.log('\n📂 Categorias criadas:', newCategories.length);
        
        if (newCategories.length > 0) {
            console.log('✅ Categorias criadas com sucesso!');
            newCategories.forEach(category => {
                console.log(`  - ${category.name}: ${category.image} (StoreId: ${category.storeId})`);
            });
        } else {
            console.log('❌ Nenhuma categoria foi criada');
            
            // Testar criação manual de uma categoria
            console.log('\n🧪 Testando criação manual de categoria...');
            try {
                const testCategory = new categoryModel({
                    name: 'Teste Manual',
                    description: 'Categoria de teste criada manualmente',
                    image: 'test.png',
                    isActive: true,
                    storeId: testStore._id
                });
                
                await testCategory.save();
                console.log('✅ Categoria manual criada com sucesso!');
                
                // Verificar se foi salva
                const savedCategory = await categoryModel.findById(testCategory._id);
                console.log('📋 Categoria salva:', savedCategory);
                
            } catch (manualError) {
                console.error('❌ Erro ao criar categoria manual:', manualError);
            }
        }
        
        console.log('\n🔄 Testando setupDefaultCategories completo...');
        
        // Deletar categorias novamente
        await categoryModel.deleteMany({ storeId: testStore._id });
        
        // Testar setupDefaultCategories completo
        await setupDefaultCategories(testStore._id, false);
        
        // Verificar resultado final
        const finalCategories = await categoryModel.find({ storeId: testStore._id });
        console.log('\n📂 Categorias após setupDefaultCategories:', finalCategories.length);
        
        finalCategories.forEach(category => {
            console.log(`  - ${category.name}: ${category.image}`);
        });
        
    } catch (error) {
        console.error('❌ Erro no debug:', error);
        console.error('Stack trace:', error.stack);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão MongoDB fechada');
    }
};

// Executar
const run = async () => {
    await connectDB();
    await debugCategories();
    process.exit(0);
};

run();