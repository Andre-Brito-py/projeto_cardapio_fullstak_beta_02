import fetch from 'node-fetch';
import mongoose from 'mongoose';
import storeModel from './models/storeModel.js';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB para obter dados das lojas
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Conectado ao MongoDB');
    } catch (error) {
        console.error('❌ Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Função para testar API de categorias
const testCategoryAPI = async () => {
    await connectDB();
    
    try {
        console.log('🔍 TESTE DAS RESPOSTAS DA API DE CATEGORIAS');
        console.log('============================================\n');
        
        // Buscar todas as lojas
        const stores = await storeModel.find({});
        console.log(`🏪 Testando API para ${stores.length} lojas\n`);
        
        const baseURL = 'http://localhost:4001';
        
        for (const store of stores) {
            console.log(`📂 TESTANDO LOJA: ${store.name || store._id}`);
            console.log(`   Slug: ${store.slug}`);
            console.log(`   ID: ${store._id}`);
            console.log('─'.repeat(60));
            
            try {
                // Testar rota de categorias ativas
                console.log('🔗 Testando: GET /api/category/active');
                const activeResponse = await fetch(`${baseURL}/api/category/active`, {
                    headers: {
                        'x-store-slug': store.slug || store._id.toString()
                    }
                });
                
                if (activeResponse.ok) {
                    const activeData = await activeResponse.json();
                    console.log(`   ✅ Status: ${activeResponse.status}`);
                    console.log(`   📊 Categorias retornadas: ${activeData.data?.length || 0}`);
                    
                    if (activeData.data && activeData.data.length > 0) {
                        // Verificar duplicatas na resposta
                        const categoryNames = activeData.data.map(cat => cat.name);
                        const uniqueNames = [...new Set(categoryNames)];
                        
                        if (categoryNames.length !== uniqueNames.length) {
                            console.log(`   🚨 DUPLICATAS ENCONTRADAS NA API!`);
                            console.log(`   📊 Total retornado: ${categoryNames.length}`);
                            console.log(`   📊 Únicos: ${uniqueNames.length}`);
                            
                            // Mostrar duplicatas
                            const duplicates = categoryNames.filter((name, index) => 
                                categoryNames.indexOf(name) !== index
                            );
                            console.log(`   🔄 Duplicatas: ${[...new Set(duplicates)].join(', ')}`);
                            
                            // Mostrar todas as categorias com IDs
                            console.log('\n   📋 DETALHES DAS CATEGORIAS:');
                            activeData.data.forEach((cat, index) => {
                                console.log(`      ${index + 1}. "${cat.name}" (ID: ${cat._id})`);
                            });
                        } else {
                            console.log(`   ✅ Sem duplicatas na resposta da API`);
                            console.log(`   📋 Categorias: ${categoryNames.join(', ')}`);
                        }
                    }
                } else {
                    console.log(`   ❌ Erro na API: ${activeResponse.status} - ${activeResponse.statusText}`);
                }
                
                console.log('');
                
                // Testar rota de todas as categorias
                console.log('🔗 Testando: GET /api/category/list');
                const listResponse = await fetch(`${baseURL}/api/category/list`, {
                    headers: {
                        'x-store-slug': store.slug || store._id.toString()
                    }
                });
                
                if (listResponse.ok) {
                    const listData = await listResponse.json();
                    console.log(`   ✅ Status: ${listResponse.status}`);
                    console.log(`   📊 Categorias retornadas: ${listData.data?.length || 0}`);
                    
                    if (listData.data && listData.data.length > 0) {
                        // Verificar duplicatas na resposta
                        const categoryNames = listData.data.map(cat => cat.name);
                        const uniqueNames = [...new Set(categoryNames)];
                        
                        if (categoryNames.length !== uniqueNames.length) {
                            console.log(`   🚨 DUPLICATAS ENCONTRADAS NA API!`);
                            console.log(`   📊 Total retornado: ${categoryNames.length}`);
                            console.log(`   📊 Únicos: ${uniqueNames.length}`);
                            
                            // Mostrar duplicatas
                            const duplicates = categoryNames.filter((name, index) => 
                                categoryNames.indexOf(name) !== index
                            );
                            console.log(`   🔄 Duplicatas: ${[...new Set(duplicates)].join(', ')}`);
                        } else {
                            console.log(`   ✅ Sem duplicatas na resposta da API`);
                        }
                    }
                } else {
                    console.log(`   ❌ Erro na API: ${listResponse.status} - ${listResponse.statusText}`);
                }
                
            } catch (error) {
                console.log(`   ❌ Erro ao testar API para loja ${store.name}: ${error.message}`);
            }
            
            console.log('\n' + '='.repeat(60) + '\n');
        }
        
        // Teste adicional: verificar se há cache ou problemas de concorrência
        console.log('🔄 TESTE DE MÚLTIPLAS REQUISIÇÕES SIMULTÂNEAS');
        console.log('==============================================');
        
        const firstStore = stores[0];
        if (firstStore) {
            console.log(`🏪 Testando loja: ${firstStore.name || firstStore._id}`);
            
            // Fazer 5 requisições simultâneas
            const promises = [];
            for (let i = 0; i < 5; i++) {
                promises.push(
                    fetch(`${baseURL}/api/category/active`, {
                        headers: {
                            'x-store-slug': firstStore.slug || firstStore._id.toString()
                        }
                    })
                );
            }
            
            const responses = await Promise.all(promises);
            const results = await Promise.all(responses.map(r => r.json()));
            
            console.log('📊 Resultados das 5 requisições simultâneas:');
            results.forEach((result, index) => {
                const count = result.data?.length || 0;
                console.log(`   ${index + 1}. ${count} categorias retornadas`);
            });
            
            // Verificar se todas retornaram o mesmo número
            const counts = results.map(r => r.data?.length || 0);
            const uniqueCounts = [...new Set(counts)];
            
            if (uniqueCounts.length === 1) {
                console.log('✅ Todas as requisições retornaram o mesmo número de categorias');
            } else {
                console.log('🚨 INCONSISTÊNCIA: Requisições retornaram números diferentes!');
                console.log(`   Contagens: ${counts.join(', ')}`);
            }
        }
        
    } catch (error) {
        console.error('❌ Erro durante o teste da API:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar teste
testCategoryAPI().catch(console.error);