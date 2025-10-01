import 'dotenv/config';
import mongoose from 'mongoose';
import userModel from './models/userModel.js';

const deleteSuperAdmin = async () => {
    try {
        console.log('🔄 Conectando ao banco de dados...');
        
        // Conectar ao MongoDB usando a mesma configuração do servidor
        const mongoOptions = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 10000,
            socketTimeoutMS: 60000,
            maxPoolSize: 10,
        };
        
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app', mongoOptions);
        console.log('✅ Conectado ao banco de dados');
        
        // Buscar super admin existente
        const superAdmin = await userModel.findOne({ role: 'super_admin' });
        
        if (!superAdmin) {
            console.log('⚠️  Nenhum super admin encontrado no banco de dados');
            return;
        }
        
        console.log(`📋 Super admin encontrado: ${superAdmin.email} (ID: ${superAdmin._id})`);
        
        // Excluir o super admin
        await userModel.deleteOne({ _id: superAdmin._id });
        console.log('✅ Super admin excluído com sucesso!');
        
        // Verificar se foi realmente excluído
        const checkDeleted = await userModel.findOne({ role: 'super_admin' });
        if (!checkDeleted) {
            console.log('✅ Confirmado: Nenhum super admin existe mais no banco de dados');
        } else {
            console.log('⚠️  Ainda existe um super admin no banco de dados');
        }
        
    } catch (error) {
        console.error('❌ Erro ao excluir super admin:', error.message);
        
        if (error.name === 'MongoServerError' && error.code === 18) {
            console.log('💡 Dica: Verifique se as credenciais do MongoDB estão corretas no arquivo .env');
        }
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com banco de dados fechada');
        process.exit(0);
    }
};

// Executar o script
deleteSuperAdmin();