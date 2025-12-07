import mongoose from 'mongoose';
import User from './models/userModel.js';

const checkAndFixSuperAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Conectado ao MongoDB');

        // Buscar todos os usuários para debug
        const allUsers = await User.find({});
        console.log('\n📋 Usuários no banco de dados:');
        allUsers.forEach(user => {
            console.log(`- Email: ${user.email}, Role: ${user.role}, Active: ${user.isActive}`);
        });

        // Deletar usuários super admin existentes
        await User.deleteMany({ $or: [{ role: 'super_admin' }, { role: 'superadmin' }] });
        console.log('\n🗑️  Usuários super admin anteriores removidos');

        // Criar novo super admin
        const bcrypt = await import('bcrypt');
        const hashedPassword = await bcrypt.default.hash('admin123', 10);

        const superAdmin = new User({
            name: 'Super Admin',
            email: 'superadmin@fooddelivery.com',
            password: hashedPassword,
            role: 'super_admin',
            permissions: ['all'],
            isActive: true
        });

        await superAdmin.save();
        console.log('\n✅ Novo Super Admin criado!');
        console.log('📧 Email: superadmin@fooddelivery.com');
        console.log('🔑 Senha: admin123');

        // Verificar se foi salvo corretamente
        const savedUser = await User.findOne({ email: 'superadmin@fooddelivery.com' });
        console.log('\n🔍 Verificação do usuário salvo:');
        console.log(`- ID: ${savedUser._id}`);
        console.log(`- Email: ${savedUser.email}`);
        console.log(`- Role: ${savedUser.role}`);
        console.log(`- Active: ${savedUser.isActive}`);
        console.log(`- Password Hash: ${savedUser.password.substring(0, 20)}...`);

    } catch (error) {
        console.error('❌ Erro:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão fechada');
        process.exit(0);
    }
};

checkAndFixSuperAdmin();
