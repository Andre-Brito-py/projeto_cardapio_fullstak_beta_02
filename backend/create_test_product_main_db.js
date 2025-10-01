import mongoose from 'mongoose';

// Conectar ao banco principal
await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');

// Schema do produto (mesmo do foodModel.js)
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
        isRequired: { type: Boolean, default: false },
        addons: [{
            name: { type: String, required: true },
            price: { type: Number, required: true },
            description: { type: String }
        }]
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

const Food = mongoose.model('food', foodSchema);

// Criar produtos de teste com storeId null
const testProducts = [
    {
        name: 'Pizza Margherita Teste COM ADICIONAIS',
        description: 'Pizza de teste com sistema novo de adicionais',
        price: 29.99,
        image: 'pizza-test.jpg',
        category: 'Pizza',
        useOldSystem: false,
        isActive: true,
        storeId: null,
        inlineAddonCategories: [
            {
                name: 'Tamanho',
                description: 'Escolha o tamanho da pizza',
                maxSelection: 1,
                isRequired: true,
                addons: [
                    { name: 'Pequena', price: 0, description: 'Pizza pequena' },
                    { name: 'Média', price: 5, description: 'Pizza média' },
                    { name: 'Grande', price: 10, description: 'Pizza grande' }
                ]
            }
        ]
    },
    {
        name: 'Hambúrguer Clássico Teste',
        description: 'Hambúrguer de teste com sistema antigo',
        price: 19.99,
        image: 'burger-test.jpg',
        category: 'Burger',
        useOldSystem: true,
        isActive: true,
        storeId: null,
        extras: [
            { name: 'Queijo Extra', price: 3, description: 'Queijo adicional' },
            { name: 'Bacon', price: 5, description: 'Fatias de bacon' }
        ]
    }
];

try {
    // Verificar se já existem produtos de teste
    const existingProducts = await Food.find({ 
        name: { $regex: 'teste', $options: 'i' } 
    });
    
    if (existingProducts.length > 0) {
        console.log(`⚠️  Encontrados ${existingProducts.length} produtos de teste existentes. Removendo...`);
        await Food.deleteMany({ name: { $regex: 'teste', $options: 'i' } });
        console.log('✅ Produtos de teste antigos removidos');
    }

    // Criar produtos de teste
    const savedProducts = [];
    for (const productData of testProducts) {
        const newProduct = new Food(productData);
        const savedProduct = await newProduct.save();
        savedProducts.push(savedProduct);
        console.log(`✅ Produto criado: ${savedProduct.name} (ID: ${savedProduct._id})`);
    }

    // Verificar total de produtos
    const totalProducts = await Food.countDocuments({});
    console.log(`📊 Total de produtos no banco: ${totalProducts}`);

    // Verificar produtos de teste
    const createdTestProducts = await Food.find({ 
        name: { $regex: 'teste', $options: 'i' } 
    });
    console.log(`🧪 Produtos de teste criados: ${createdTestProducts.length}`);

} catch (error) {
    console.error('❌ Erro ao criar produtos de teste:', error);
} finally {
    console.log('🔌 Conexão com MongoDB fechada');
    await mongoose.connection.close();
}