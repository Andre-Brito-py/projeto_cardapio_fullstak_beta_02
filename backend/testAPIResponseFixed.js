import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import storeModel from './models/storeModel.js';
import axios from 'axios';

const MONGODB_URI = 'mongodb://localhost:27017/mern-food-delivery-app';

async function testAPIResponseFixed() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');

        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`\n🏪 Lojas encontradas: ${stores.length}`);

        for (const store of stores) {
            console.log(`\n====================================================`);
            console.log(`🏪 Testando loja: ${store.name} (ID: ${store._id})`);
            console.log(`====================================================`);

            // Testar API com storeId
            try {
                const response = await axios.get(`http://localhost:4001/api/category/list?storeId=${store._id}`);
                
                if (response.data.success) {
                    const categories = response.data.data;
                    console.log(`✅ Status: ${response.status}`);
                    console.log(`📊 Categorias retornadas: ${categories.length}`);
                    
                    // Verificar duplicatas
                    const categoryNames = categories.map(cat => cat.name);
                    const uniqueNames = [...new Set(categoryNames)];
                    
                    if (categoryNames.length !== uniqueNames.length) {
                        console.log('🚨 DUPLICATAS ENCONTRADAS NA API!');
                        console.log(`📊 Total retornado: ${categoryNames.length}`);
                        console.log(`📊 Únicos: ${uniqueNames.length}`);
                        
                        // Mostrar duplicatas
                        const duplicates = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
                        console.log(`🔄 Duplicatas: ${[...new Set(duplicates)].join(', ')}`);
                    } else {
                        console.log('✅ Nenhuma duplicata encontrada!');
                        console.log(`📊 Categorias únicas: ${uniqueNames.length}`);
                        
                        // Listar categorias
                        categories.forEach((cat, index) => {
                            console.log(`   ${index + 1}. "${cat.name}" (ID: ${cat._id})`);
                        });
                    }
                } else {
                    console.log(`❌ Erro na API: ${response.data.message}`);
                }
            } catch (error) {
                console.log(`❌ Erro ao testar API: ${error.message}`);
            }

            // Testar API de categorias ativas
            try {
                const response = await axios.get(`http://localhost:4001/api/category/active?storeId=${store._id}`);
                
                if (response.data.success) {
                    const categories = response.data.data;
                    console.log(`\n🔗 Testando: GET /api/category/active`);
                    console.log(`✅ Status: ${response.status}`);
                    console.log(`📊 Categorias ativas retornadas: ${categories.length}`);
                    
                    // Verificar duplicatas
                    const categoryNames = categories.map(cat => cat.name);
                    const uniqueNames = [...new Set(categoryNames)];
                    
                    if (categoryNames.length !== uniqueNames.length) {
                        console.log('🚨 DUPLICATAS ENCONTRADAS NA API ATIVA!');
                        console.log(`📊 Total retornado: ${categoryNames.length}`);
                        console.log(`📊 Únicos: ${uniqueNames.length}`);
                        
                        // Mostrar duplicatas
                        const duplicates = categoryNames.filter((name, index) => categoryNames.indexOf(name) !== index);
                        console.log(`🔄 Duplicatas: ${[...new Set(duplicates)].join(', ')}`);
                    } else {
                        console.log('✅ Nenhuma duplicata encontrada nas categorias ativas!');
                    }
                } else {
                    console.log(`❌ Erro na API ativa: ${response.data.message}`);
                }
            } catch (error) {
                console.log(`❌ Erro ao testar API ativa: ${error.message}`);
            }
        }

        console.log('\n🔌 Conexão com MongoDB fechada');
        await mongoose.connection.close();

    } catch (error) {
        console.error('❌ Erro:', error);
        await mongoose.connection.close();
    }
}

testAPIResponseFixed();