import mongoose from 'mongoose';
import categoryModel from './models/categoryModel.js';
import storeModel from './models/storeModel.js';
import dotenv from 'dotenv';

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

// Função para análise temporal das categorias
const analyzeTemporalCreation = async () => {
    await connectDB();
    
    try {
        console.log('🔍 ANÁLISE TEMPORAL DE CRIAÇÃO DE CATEGORIAS');
        console.log('=============================================\n');
        
        // Buscar todas as categorias ordenadas por data de criação
        const allCategories = await categoryModel.find({})
            .sort({ createdAt: 1 })
            .populate('storeId', 'name');
        
        console.log(`📊 Total de categorias encontradas: ${allCategories.length}\n`);
        
        // Agrupar por data de criação (apenas data, sem hora)
        const creationDates = {};
        const categoryNames = {};
        
        allCategories.forEach(category => {
            const createdDate = category.createdAt ? 
                new Date(category.createdAt).toLocaleDateString('pt-BR') : 'Data desconhecida';
            
            if (!creationDates[createdDate]) {
                creationDates[createdDate] = [];
            }
            creationDates[createdDate].push(category);
            
            // Agrupar por nome para detectar padrões
            if (!categoryNames[category.name]) {
                categoryNames[category.name] = [];
            }
            categoryNames[category.name].push(category);
        });
        
        // Analisar datas de criação
        console.log('📅 ANÁLISE POR DATA DE CRIAÇÃO:');
        console.log('─'.repeat(50));
        
        Object.keys(creationDates).sort().forEach(date => {
            const categories = creationDates[date];
            console.log(`\n📆 ${date}: ${categories.length} categorias criadas`);
            
            // Agrupar por loja nesta data
            const storeGroups = {};
            categories.forEach(cat => {
                const storeName = cat.storeId?.name || 'Loja desconhecida';
                if (!storeGroups[storeName]) {
                    storeGroups[storeName] = [];
                }
                storeGroups[storeName].push(cat);
            });
            
            Object.keys(storeGroups).forEach(storeName => {
                const storeCats = storeGroups[storeName];
                console.log(`   🏪 ${storeName}: ${storeCats.length} categorias`);
                
                // Verificar se há duplicatas na mesma loja na mesma data
                const nameCount = {};
                storeCats.forEach(cat => {
                    nameCount[cat.name] = (nameCount[cat.name] || 0) + 1;
                });
                
                Object.keys(nameCount).forEach(name => {
                    if (nameCount[name] > 1) {
                        console.log(`      ⚠️  "${name}": ${nameCount[name]} instâncias (DUPLICATA!)`)
                        
                        // Mostrar horários específicos das duplicatas
                        const duplicates = storeCats.filter(cat => cat.name === name);
                        duplicates.forEach((dup, index) => {
                            const time = dup.createdAt ? 
                                new Date(dup.createdAt).toLocaleTimeString('pt-BR') : 'Hora desconhecida';
                            console.log(`         ${index + 1}. ${time} - ID: ${dup._id}`);
                        });
                    } else {
                        console.log(`      ✅ "${name}": única`);
                    }
                });
            });
        });
        
        // Análise de padrões suspeitos
        console.log('\n\n🔍 ANÁLISE DE PADRÕES SUSPEITOS:');
        console.log('─'.repeat(50));
        
        let suspiciousPatterns = 0;
        
        Object.keys(categoryNames).forEach(categoryName => {
            const instances = categoryNames[categoryName];
            
            if (instances.length > 3) { // Mais de 3 instâncias da mesma categoria
                console.log(`\n⚠️  PADRÃO SUSPEITO: "${categoryName}"`);
                console.log(`   Total de instâncias: ${instances.length}`);
                suspiciousPatterns++;
                
                // Agrupar por loja
                const storeInstances = {};
                instances.forEach(inst => {
                    const storeId = inst.storeId?._id?.toString() || 'unknown';
                    const storeName = inst.storeId?.name || 'Loja desconhecida';
                    
                    if (!storeInstances[storeId]) {
                        storeInstances[storeId] = {
                            name: storeName,
                            instances: []
                        };
                    }
                    storeInstances[storeId].instances.push(inst);
                });
                
                Object.keys(storeInstances).forEach(storeId => {
                    const storeData = storeInstances[storeId];
                    if (storeData.instances.length > 1) {
                        console.log(`   🏪 ${storeData.name}: ${storeData.instances.length} duplicatas`);
                        
                        // Verificar intervalos de tempo entre criações
                        const sortedInstances = storeData.instances.sort((a, b) => 
                            new Date(a.createdAt) - new Date(b.createdAt)
                        );
                        
                        for (let i = 1; i < sortedInstances.length; i++) {
                            const prev = new Date(sortedInstances[i-1].createdAt);
                            const curr = new Date(sortedInstances[i].createdAt);
                            const diffMinutes = Math.round((curr - prev) / (1000 * 60));
                            
                            console.log(`      ⏱️  Intervalo: ${diffMinutes} minutos entre criações`);
                            
                            if (diffMinutes < 5) {
                                console.log(`         🚨 SUSPEITO: Criações muito próximas (< 5 min)`);
                            }
                        }
                    }
                });
            }
        });
        
        // Relatório final
        console.log('\n\n📋 RELATÓRIO FINAL:');
        console.log('===================');
        console.log(`📊 Total de categorias: ${allCategories.length}`);
        console.log(`📅 Datas de criação diferentes: ${Object.keys(creationDates).length}`);
        console.log(`⚠️  Padrões suspeitos encontrados: ${suspiciousPatterns}`);
        
        if (suspiciousPatterns > 0) {
            console.log('\n💡 POSSÍVEIS CAUSAS:');
            console.log('1. Execução múltipla manual dos scripts');
            console.log('2. Processo automático executando scripts repetidamente');
            console.log('3. Falha na verificação de categorias existentes');
            console.log('4. Problema na lógica de criação condicional');
            
            console.log('\n🔧 AÇÕES RECOMENDADAS:');
            console.log('1. Implementar verificação mais robusta antes da criação');
            console.log('2. Adicionar logs detalhados nos scripts');
            console.log('3. Criar índice único composto (storeId + name)');
            console.log('4. Implementar limpeza automática de duplicatas');
        } else {
            console.log('\n🎉 Nenhum padrão suspeito detectado!');
        }
        
    } catch (error) {
        console.error('❌ Erro durante a análise:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
};

// Executar análise
analyzeTemporalCreation().catch(console.error);