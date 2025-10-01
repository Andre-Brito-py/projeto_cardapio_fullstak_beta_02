import mongoose from 'mongoose';

async function checkAllCollections() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/fooddelivery');
        console.log('✅ Conectado ao MongoDB\n');

        // Listar todas as coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📋 Coleções encontradas:');
        console.log('='.repeat(50));
        
        for (const collection of collections) {
            console.log(`📁 ${collection.name}`);
            
            // Contar documentos em cada coleção
            const count = await mongoose.connection.db.collection(collection.name).countDocuments();
            console.log(`   Documentos: ${count}`);
            
            // Se for uma coleção de usuários, mostrar alguns documentos
            if (collection.name.toLowerCase().includes('user') || collection.name.toLowerCase().includes('customer')) {
                console.log('   📄 Documentos:');
                const docs = await mongoose.connection.db.collection(collection.name).find({}).limit(5).toArray();
                docs.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.name || doc.email || doc._id} (${doc.role || 'sem role'})`);
                });
            }
            console.log('');
        }

        // Buscar especificamente por customer@fooddelivery.com em todas as coleções
        console.log('\n🔍 Procurando por customer@fooddelivery.com em todas as coleções:');
        console.log('='.repeat(60));
        
        for (const collection of collections) {
            try {
                const result = await mongoose.connection.db.collection(collection.name).findOne({ 
                    email: 'customer@fooddelivery.com' 
                });
                if (result) {
                    console.log(`✅ Encontrado na coleção: ${collection.name}`);
                    console.log('   Dados:', JSON.stringify(result, null, 2));
                }
            } catch (error) {
                // Ignorar erros de coleções que não têm campo email
            }
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

checkAllCollections();