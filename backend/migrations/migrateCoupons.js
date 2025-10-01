import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Conectar ao MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cardapio_db');
        console.log('Conectado ao MongoDB');
    } catch (error) {
        console.error('Erro ao conectar ao MongoDB:', error);
        process.exit(1);
    }
};

// Schemas temporários para migração
const CouponSchema = new mongoose.Schema({}, { strict: false });
const StoreSchema = new mongoose.Schema({}, { strict: false });

const Coupon = mongoose.model('Coupon', CouponSchema);
const Store = mongoose.model('Store', StoreSchema);

const migrateCoupons = async () => {
    try {
        console.log('Iniciando migração de cupons...');

        // Buscar todos os cupons existentes
        const coupons = await Coupon.find({});
        console.log(`Encontrados ${coupons.length} cupons para migrar`);

        // Buscar todas as lojas ativas
        const stores = await Store.find({ isActive: true });
        console.log(`Encontradas ${stores.length} lojas ativas`);

        if (stores.length === 0) {
            console.log('Nenhuma loja ativa encontrada. Criando loja padrão...');
            const defaultStore = new Store({
                name: 'Loja Principal',
                isActive: true,
                createdAt: new Date()
            });
            await defaultStore.save();
            stores.push(defaultStore);
        }

        let migratedCount = 0;
        let errorCount = 0;

        for (const coupon of coupons) {
            try {
                // Se o cupom já tem storeId, pular
                if (coupon.storeId) {
                    console.log(`Cupom ${coupon.code} já tem storeId, pulando...`);
                    continue;
                }

                // Se o cupom tem applicableStores definido, usar a primeira loja
                if (coupon.applicableStores && coupon.applicableStores.length > 0) {
                    const storeId = coupon.applicableStores[0];
                    
                    // Verificar se a loja existe
                    const storeExists = stores.find(store => store._id.toString() === storeId.toString());
                    
                    if (storeExists) {
                        await Coupon.updateOne(
                            { _id: coupon._id },
                            { 
                                $set: { storeId: storeId },
                                $unset: { applicableStores: 1 }
                            }
                        );
                        console.log(`Cupom ${coupon.code} migrado para loja ${storeId}`);
                        migratedCount++;
                    } else {
                        // Se a loja não existe, usar a primeira loja ativa
                        await Coupon.updateOne(
                            { _id: coupon._id },
                            { 
                                $set: { storeId: stores[0]._id },
                                $unset: { applicableStores: 1 }
                            }
                        );
                        console.log(`Cupom ${coupon.code} migrado para loja padrão ${stores[0]._id}`);
                        migratedCount++;
                    }
                } else {
                    // Se não tem applicableStores ou está vazio, usar a primeira loja ativa
                    await Coupon.updateOne(
                        { _id: coupon._id },
                        { 
                            $set: { storeId: stores[0]._id },
                            $unset: { applicableStores: 1 }
                        }
                    );
                    console.log(`Cupom ${coupon.code} migrado para loja padrão ${stores[0]._id}`);
                    migratedCount++;
                }

            } catch (error) {
                console.error(`Erro ao migrar cupom ${coupon.code}:`, error.message);
                errorCount++;
            }
        }

        console.log(`\nMigração concluída:`);
        console.log(`- Cupons migrados: ${migratedCount}`);
        console.log(`- Erros: ${errorCount}`);

        // Verificar se há cupons duplicados por loja
        console.log('\nVerificando cupons duplicados por loja...');
        const duplicates = await Coupon.aggregate([
            {
                $group: {
                    _id: { storeId: '$storeId', code: '$code' },
                    count: { $sum: 1 },
                    ids: { $push: '$_id' }
                }
            },
            {
                $match: { count: { $gt: 1 } }
            }
        ]);

        if (duplicates.length > 0) {
            console.log(`Encontrados ${duplicates.length} grupos de cupons duplicados:`);
            for (const duplicate of duplicates) {
                console.log(`- Loja ${duplicate._id.storeId}, Código ${duplicate._id.code}: ${duplicate.count} cupons`);
                
                // Manter apenas o primeiro cupom, remover os outros
                const idsToRemove = duplicate.ids.slice(1);
                await Coupon.deleteMany({ _id: { $in: idsToRemove } });
                console.log(`  Removidos ${idsToRemove.length} cupons duplicados`);
            }
        } else {
            console.log('Nenhum cupom duplicado encontrado.');
        }

    } catch (error) {
        console.error('Erro durante a migração:', error);
    }
};

const main = async () => {
    await connectDB();
    await migrateCoupons();
    await mongoose.connection.close();
    console.log('Migração finalizada e conexão fechada.');
};

main().catch(console.error);