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
    // Buscar produtos de teste
    const testProducts = await Food.find({ name: { $regex: /teste/i } });
    
    console.log(`📊 Encontrados ${testProducts.length} produtos de teste:`);
    
    testProducts.forEach((product, index) => {
        console.log(`\n${index + 1}. ${product.name}`);
        console.log(`   ID: ${product._id}`);
        console.log(`   Categoria: ${product.category}`);
        console.log(`   Preço: R$ ${product.price}`);
        console.log(`   Sistema Antigo: ${product.useOldSystem}`);
        
        if (product.useOldSystem) {
            console.log(`   Extras (${product.extras.length}):`);
            product.extras.forEach(extra => {
                console.log(`     - ${extra.name}: R$ ${extra.price}`);
            });
        } else {
            console.log(`   Categorias de Adicionais (${product.inlineAddonCategories.length}):`);
            product.inlineAddonCategories.forEach(category => {
                console.log(`     - ${category.name} (max: ${category.maxSelection}, obrigatório: ${category.isRequired})`);
            });
            
            console.log(`   Adicionais por Categoria:`);
            Object.keys(product.categoryAddons).forEach(categoryName => {
                console.log(`     ${categoryName}:`);
                product.categoryAddons[categoryName].forEach(addon => {
                    console.log(`       - ${addon.name}: R$ ${addon.price}`);
                });
            });
        }
    });
    
    // Verificar também todos os produtos
    const allProducts = await Food.find({});
    console.log(`\n📈 Total de produtos no banco: ${allProducts.length}`);
    
} catch (error) {
    console.error('❌ Erro ao buscar produtos:', error);
} finally {
    await mongoose.connection.close();
    console.log('\n🔌 Conexão com MongoDB fechada');
}