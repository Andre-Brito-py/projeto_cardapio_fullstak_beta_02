import mongoose from 'mongoose';
import settingsModel from '../models/settingsModel.js';
import Store from '../models/storeModel.js';

/**
 * Script de migração para adicionar storeId às configurações existentes
 * Este script deve ser executado uma única vez após a atualização do modelo
 */
const migrateSettings = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Buscar configurações existentes sem storeId
        console.log('🔍 Buscando configurações existentes...');
        const existingSettings = await settingsModel.find({ storeId: { $exists: false } });
        
        if (existingSettings.length === 0) {
            console.log('✅ Nenhuma configuração sem storeId encontrada. Migração não necessária.');
            return;
        }

        console.log(`📋 Encontradas ${existingSettings.length} configurações para migrar`);

        // Buscar todas as lojas ativas
        const stores = await Store.find({ status: 'active' });
        
        if (stores.length === 0) {
            console.log('❌ Nenhuma loja ativa encontrada. Criando configuração padrão...');
            
            // Se não há lojas, remover configurações órfãs
            await settingsModel.deleteMany({ storeId: { $exists: false } });
            console.log('🗑️ Configurações órfãs removidas');
            return;
        }

        // Para cada loja, criar uma configuração baseada na primeira configuração existente
        const baseSettings = existingSettings[0];
        let migratedCount = 0;

        for (const store of stores) {
            // Verificar se a loja já tem configurações
            const existingStoreSettings = await settingsModel.findOne({ storeId: store._id });
            
            if (!existingStoreSettings) {
                // Criar nova configuração para a loja
                const newSettings = new settingsModel({
                    storeId: store._id,
                    pixKey: baseSettings.pixKey || '',
                    googleMapsApiKey: baseSettings.googleMapsApiKey || '',
                    restaurantAddress: baseSettings.restaurantAddress || {
                        street: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'Brasil'
                    },
                    deliveryZones: baseSettings.deliveryZones || [],
                    maxDeliveryDistance: baseSettings.maxDeliveryDistance || 10,
                    banner: baseSettings.banner || {
                        title: 'Peça sua comida favorita aqui',
                        description: 'Nosso aplicativo de entrega de comida traz refeições deliciosas diretamente à sua porta.',
                        image: '/header_img.png'
                    }
                });

                await newSettings.save();
                migratedCount++;
                console.log(`✅ Configuração criada para loja: ${store.name} (ID: ${store._id})`);
            } else {
                console.log(`⚠️ Loja ${store.name} já possui configurações`);
            }
        }

        // Remover configurações antigas sem storeId
        console.log('\n🗑️ Removendo configurações antigas...');
        await settingsModel.deleteMany({ storeId: { $exists: false } });

        console.log(`\n✅ Migração concluída!`);
        console.log(`📊 Estatísticas:`);
        console.log(`   - Configurações migradas: ${migratedCount}`);
        console.log(`   - Lojas processadas: ${stores.length}`);
        console.log(`   - Configurações antigas removidas: ${existingSettings.length}`);

    } catch (error) {
        console.error('❌ Erro durante a migração:', error);
        throw error;
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Desconectado do MongoDB');
    }
};

// Executar migração se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
    migrateSettings()
        .then(() => {
            console.log('🎉 Migração executada com sucesso!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Falha na migração:', error);
            process.exit(1);
        });
}

export default migrateSettings;