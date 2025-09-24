import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/userModel.js';

async function createCustomer() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Verificar se o usuário já existe
        const existingUser = await User.findOne({ email: 'customer@fooddelivery.com' });
        if (existingUser) {
            console.log('⚠️ Usuário customer já existe!');
            console.log('   Email:', existingUser.email);
            console.log('   Nome:', existingUser.name);
            console.log('   Role:', existingUser.role);
            return;
        }

        // Hash da senha
        const hashedPassword = await bcrypt.hash('customer123', 10);

        // Criar o usuário customer
        const customerUser = new User({
            name: 'Cliente Teste',
            email: 'customer@fooddelivery.com',
            password: hashedPassword,
            role: 'customer',
            isActive: true
        });

        await customerUser.save();

        console.log('✅ Usuário customer criado com sucesso!');
        console.log('   Nome:', customerUser.name);
        console.log('   Email:', customerUser.email);
        console.log('   Role:', customerUser.role);
        console.log('   ID:', customerUser._id);
        console.log('   Senha: customer123');

    } catch (error) {
        console.error('❌ Erro ao criar usuário customer:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

createCustomer();