import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // Verificar se a categoria 'Deserts' já existe
        const existingDeserts = await categoryModel.findOne({ name: 'Deserts' });
        
        if (existingDeserts) {
            console.log('✅ Categoria "Deserts" já existe!');
            console.log(`   - ID: ${existingDeserts._id}`);
            console.log(`   - Ativa: ${existingDeserts.isActive}`);
        } else {
            console.log('📦 Criando categoria "Deserts"...');
            
            const desertsCategory = new categoryModel({
                name: 'Deserts',
                description: 'Sobremesas deliciosas e doces especiais',
                image: 'deserts-category.png', // Imagem padrão
                isActive: true
            });
            
            try {
                await desertsCategory.save();
                console.log('✅ Categoria "Deserts" criada com sucesso!');
                console.log(`   - ID: ${desertsCategory._id}`);
            } catch (error) {
                console.log('❌ Erro ao criar categoria "Deserts":', error.message);
            }
        }
        
        // Listar todas as categorias
        const allCategories = await categoryModel.find({});
        console.log(`\n📊 Total de categorias: ${allCategories.length}`);
        console.log('\n📋 Lista de todas as categorias:');
        allCategories.forEach((category, index) => {
            console.log(`${index + 1}. ${category.name} (Ativa: ${category.isActive})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();