import mongoose from 'mongoose';
import foodModel from './models/foodModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect('mongodb://localhost:27017/food-del');
        console.log('✅ Conectado ao MongoDB');
        
        // ID da loja existente (Loja Teste)
        const storeId = '68b07fe9c75426c082da4290';
        
        // Buscar produtos órfãos (sem storeId)
        const orphanProducts = await foodModel.find({ 
            $or: [
                { storeId: null },
                { storeId: { $exists: false } }
            ]
        });
        
        console.log(`\n🔍 Produtos órfãos encontrados: ${orphanProducts.length}`);
        
        if (orphanProducts.length > 0) {
            console.log('\n📦 Lista de produtos órfãos:');
            orphanProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name} (${product.category})`);
            });
            
            // Atualizar produtos órfãos com o storeId da loja existente
            const updateResult = await foodModel.updateMany(
                { 
                    $or: [
                        { storeId: null },
                        { storeId: { $exists: false } }
                    ]
                },
                { 
                    $set: { 
                        storeId: storeId,
                        isActive: true // Garantir que estão ativos
                    }
                }
            );
            
            console.log(`\n✅ Produtos atualizados: ${updateResult.modifiedCount}`);
            
            // Verificar resultado
            const updatedProducts = await foodModel.find({ storeId: storeId });
            console.log(`\n🏪 Produtos agora associados à Loja Teste: ${updatedProducts.length}`);
            
            console.log('\n📋 Lista atualizada:');
            updatedProducts.forEach((product, index) => {
                console.log(`${index + 1}. ${product.name}`);
                console.log(`   - Categoria: ${product.category}`);
                console.log(`   - StoreId: ${product.storeId}`);
                console.log(`   - Ativo: ${product.isActive}`);
                console.log('');
            });
        } else {
            console.log('\n✅ Nenhum produto órfão encontrado!');
        }
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

connectDB();