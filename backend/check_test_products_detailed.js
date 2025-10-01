import mongoose from 'mongoose';

// Conectar ao MongoDB
mongoose.connect('mongodb://localhost:27017/food-del', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Schema do produto
const foodSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    category: { type: String, required: true },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Store' },
    extras: [{ name: String, price: Number }],
    useOldSystem: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    isOutOfStock: { type: Boolean, default: false },
    outOfStockAddons: [String],
    outOfStockAddonCategories: [String],
    inlineAddonCategories: [{
        name: String,
        addons: [{
            name: String,
            price: Number
        }]
    }],
    categoryAddons: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

const Food = mongoose.model('Food', foodSchema);

async function checkTestProductsDetailed() {
    try {
        console.log('🔍 Verificando produtos de teste em detalhes...');
        
        // Buscar produtos de teste
        const testProducts = await Food.find({ 
            name: { $regex: /teste/i } 
        });
        
        console.log(`📊 Encontrados ${testProducts.length} produtos de teste`);
        
        testProducts.forEach((product, index) => {
            console.log(`\n${index + 1}. ${product.name}`);
            console.log(`   ID: ${product._id}`);
            console.log(`   Preço: R$ ${product.price}`);
            console.log(`   Categoria: ${product.category}`);
            console.log(`   StoreId: ${product.storeId || 'null'}`);
            console.log(`   Ativo: ${product.isActive}`);
            console.log(`   Em estoque: ${!product.isOutOfStock}`);
            console.log(`   Sistema antigo: ${product.useOldSystem}`);
            console.log(`   Extras: ${product.extras?.length || 0}`);
            console.log(`   Categorias inline: ${product.inlineAddonCategories?.length || 0}`);
        });
        
        // Verificar todos os produtos ativos sem storeId
        console.log('\n🔍 Verificando produtos ativos sem storeId...');
        const productsWithoutStore = await Food.find({ 
            storeId: null,
            isActive: true 
        });
        
        console.log(`📊 Produtos ativos sem storeId: ${productsWithoutStore.length}`);
        productsWithoutStore.forEach((product, index) => {
            console.log(`   ${index + 1}. ${product.name} (${product.category})`);
        });
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

checkTestProductsDetailed();