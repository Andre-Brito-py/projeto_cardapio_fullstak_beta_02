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
    // Criar produto com sistema novo de adicionais
    const testProduct = new Food({
        name: 'Pizza Margherita Teste',
        description: 'Pizza com molho de tomate, mussarela e manjericão - PRODUTO DE TESTE COM ADICIONAIS',
        price: 29.99,
        image: 'default.jpg',
        category: 'Pizza',
        useOldSystem: false,
        inlineAddonCategories: [
            {
                name: 'Coberturas',
                description: 'Escolha suas coberturas favoritas',
                maxSelection: 3,
                isRequired: false
            },
            {
                name: 'Bordas',
                description: 'Tipo de borda da pizza',
                maxSelection: 1,
                isRequired: true
            }
        ],
        categoryAddons: {
            'Coberturas': [
                { name: 'Queijo Extra', price: 3.50, description: 'Queijo mussarela extra' },
                { name: 'Pepperoni', price: 5.00, description: 'Fatias de pepperoni' },
                { name: 'Azeitonas', price: 2.50, description: 'Azeitonas pretas' }
            ],
            'Bordas': [
                { name: 'Borda Catupiry', price: 8.00, description: 'Borda recheada com catupiry' },
                { name: 'Borda Cheddar', price: 7.50, description: 'Borda recheada com cheddar' },
                { name: 'Borda Simples', price: 0.00, description: 'Borda tradicional' }
            ]
        }
    });

    await testProduct.save();
    console.log('✅ Produto de teste criado com sucesso!');
    console.log('ID:', testProduct._id);
    
    // Criar também um produto com sistema antigo
    const oldSystemProduct = new Food({
        name: 'Hambúrguer Clássico Teste',
        description: 'Hambúrguer com carne, queijo e salada - PRODUTO DE TESTE COM EXTRAS',
        price: 18.99,
        image: 'default.jpg',
        category: 'Hambúrguer',
        useOldSystem: true,
        extras: [
            { name: 'Bacon', price: 4.00, description: 'Fatias de bacon crocante' },
            { name: 'Queijo Extra', price: 2.50, description: 'Fatia extra de queijo' },
            { name: 'Batata Frita', price: 6.00, description: 'Porção de batata frita' }
        ]
    });

    await oldSystemProduct.save();
    console.log('✅ Produto com sistema antigo criado com sucesso!');
    console.log('ID:', oldSystemProduct._id);
    
} catch (error) {
    console.error('❌ Erro ao criar produtos de teste:', error);
} finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
}