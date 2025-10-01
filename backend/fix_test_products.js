import mongoose from 'mongoose';

// Conectar ao MongoDB
await mongoose.connect('mongodb://localhost:27017/food-del');

// Schema do produto
const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    extras: [{
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String }
    }],
    inlineAddonCategories: [{
        name: { type: String, required: true },
        description: { type: String },
        maxSelection: { type: Number, default: 1 },
        isRequired: { type: Boolean, default: false }
    }],
    categoryAddons: { type: mongoose.Schema.Types.Mixed, default: {} },
    useOldSystem: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isOutOfStock: { type: Boolean, default: false },
    outOfStockAddons: { type: [String], default: [] },
    outOfStockAddonCategories: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Food = mongoose.model('Food', foodSchema);

try {
    // Buscar produtos de teste que podem estar inativos
    const testProducts = await Food.find({ name: { $regex: /teste/i } });
    
    console.log(`📊 Encontrados ${testProducts.length} produtos de teste`);
    
    // Ativar todos os produtos de teste
    const updateResult = await Food.updateMany(
        { name: { $regex: /teste/i } },
        { 
            $set: { 
                isActive: true,
                isOutOfStock: false,
                updatedAt: new Date()
            }
        }
    );
    
    console.log(`✅ ${updateResult.modifiedCount} produtos de teste foram ativados`);
    
    // Verificar o status atual
    const updatedProducts = await Food.find({ name: { $regex: /teste/i } });
    
    updatedProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Ativo: ${product.isActive}`);
        console.log(`   Em estoque: ${!product.isOutOfStock}`);
        console.log(`   Sistema antigo: ${product.useOldSystem}`);
    });
    
} catch (error) {
    console.error('❌ Erro ao ativar produtos de teste:', error);
} finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
}