import mongoose from 'mongoose';
import User from './models/userModel.js';

async function checkAllUsersInCorrectDB() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
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
            if (collection.name.toLowerCase().includes('user')) {
                console.log('   📄 Documentos:');
                const docs = await mongoose.connection.db.collection(collection.name).find({}).toArray();
                docs.forEach((doc, index) => {
                    console.log(`   ${index + 1}. ${doc.name || doc.email || doc._id} (${doc.role || 'sem role'}) - Email: ${doc.email}`);
                });
            }
            console.log('');
        }

        // Usar o modelo User para buscar todos os usuários
        console.log('\n🔍 Usando modelo User para buscar usuários:');
        console.log('='.repeat(60));
        
        const users = await User.find({});
        console.log(`Total encontrado pelo modelo: ${users.length}`);
        
        users.forEach((user, index) => {
            console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
        });

        // Buscar especificamente por customer@fooddelivery.com
        console.log('\n🔍 Procurando especificamente por customer@fooddelivery.com:');
        console.log('='.repeat(60));
        
        const customer = await User.findOne({ email: 'customer@fooddelivery.com' });
        if (customer) {
            console.log('✅ Customer encontrado pelo modelo User:');
            console.log(JSON.stringify(customer, null, 2));
        } else {
            console.log('❌ Customer NÃO encontrado pelo modelo User');
        }

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

checkAllUsersInCorrectDB();