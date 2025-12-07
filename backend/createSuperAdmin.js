import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/userModel.js';

const createSuperAdmin = async () => {
    try {
        // Conectar ao MongoDB usando a mesma configuração do servidor
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conectado ao MongoDB');

        // Verificar se já existe um super admin
        const existingSuperAdmin = await User.findOne({ role: 'super_admin' });

        if (existingSuperAdmin) {
            console.log('⚠️  Super Admin já existe:', existingSuperAdmin.email);
            console.log('📧 Email:', existingSuperAdmin.email);
            console.log('🔑 Use a senha: admin123');
            await mongoose.connection.close();
            process.exit(0);
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Criar o super admin
        const superAdmin = new User({
            name: 'Super Admin',
            email: 'admin@fooddelivery.com',
            password: hashedPassword,
            role: 'super_admin',
            permissions: ['all'],
            isActive: true
        });

        await superAdmin.save();

        console.log('✅ Super Admin criado com sucesso!');
        console.log('📧 Email: admin@fooddelivery.com');
        console.log('🔑 Senha: admin123');
        console.log('⚠️  Por favor, altere a senha após o primeiro login!');

    } catch (error) {
        console.error('❌ Erro ao criar Super Admin:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada');
        process.exit(0);
    }
};

createSuperAdmin();
