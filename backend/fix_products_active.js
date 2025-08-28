import mongoose from 'mongoose';
import dotenv from 'dotenv';
import foodModel from './models/foodModel.js';

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

const fixProductsActive = async () => {
    try {
        console.log('🔧 Corrigindo campo active dos produtos...');
        
        // 1. Verificar produtos sem campo isActive
        const productsWithoutActive = await foodModel.find({ isActive: { $exists: false } });
        console.log(`📦 Produtos sem campo isActive: ${productsWithoutActive.length}`);
        
        // 2. Verificar produtos com isActive undefined
        const productsWithUndefinedActive = await foodModel.find({ isActive: undefined });
        console.log(`📦 Produtos com isActive undefined: ${productsWithUndefinedActive.length}`);
        
        // 3. Atualizar todos os produtos para isActive: true
        const updateResult = await foodModel.updateMany(
            { $or: [{ isActive: { $exists: false } }, { isActive: undefined }, { isActive: null }] },
            { $set: { isActive: true } }
        );
        
        console.log(`✅ Produtos atualizados: ${updateResult.modifiedCount}`);
        
        // 4. Verificar resultado
        const allProducts = await foodModel.find({});
        const activeProducts = await foodModel.find({ isActive: true });
        const inactiveProducts = await foodModel.find({ isActive: false });
        
        console.log('\n📊 Status final dos produtos:');
        console.log(`   - Total de produtos: ${allProducts.length}`);
        console.log(`   - Produtos ativos: ${activeProducts.length}`);
        console.log(`   - Produtos inativos: ${inactiveProducts.length}`);
        
        // 5. Listar alguns produtos para verificação
        console.log('\n📋 Primeiros 5 produtos:');
        allProducts.slice(0, 5).forEach((product, index) => {
            console.log(`${index + 1}. ${product.name} - Ativo: ${product.isActive}`);
        });
        
        console.log('\n🎉 Correção concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro durante a correção:', error);
    }
};

const main = async () => {
    await connectDB();
    await fixProductsActive();
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
};

main().catch(console.error);