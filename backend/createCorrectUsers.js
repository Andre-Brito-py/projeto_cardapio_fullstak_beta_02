import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/userModel.js';
import Store from './models/storeModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createCorrectUsers = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB');

        // Primeiro, remover usuários e lojas existentes para evitar conflitos
        console.log('🗑️ Removendo usuários e lojas existentes...');
        await User.deleteMany({});
        await Store.deleteMany({});
        console.log('✅ Usuários e lojas existentes removidos');

        // Criar Super Admin
        console.log('👑 Criando Super Admin...');
        const superAdminPassword = await bcrypt.hash('superadmin123', 10);
        const superAdmin = new User({
            name: 'Super Admin',
            email: 'superadmin@fooddelivery.com',
            password: superAdminPassword,
            role: 'super_admin',
            permissions: ['all'],
            isActive: true
        });
        await superAdmin.save();
        console.log('✅ Super Admin criado com sucesso!');
        console.log('📧 Email: superadmin@fooddelivery.com');
        console.log('🔑 Senha: superadmin123');

        // Criar uma loja de exemplo
        console.log('🏪 Criando loja de exemplo...');
        const exampleStore = new Store({
            name: 'Loja Exemplo',
            slug: 'loja-exemplo',
            description: 'Loja de exemplo para testes',
            owner: superAdmin._id,
            status: 'active',
            settings: {
                restaurantAddress: 'Rua Exemplo, 123 - Centro',
                address: {
                    street: 'Rua Exemplo',
                    number: '123',
                    neighborhood: 'Centro',
                    city: 'São Paulo',
                    state: 'SP',
                    zipCode: '01000-000'
                },
                isOpen: true,
                operatingHours: {
                    monday: { open: '18:00', close: '23:00', closed: false },
                    tuesday: { open: '18:00', close: '23:00', closed: false },
                    wednesday: { open: '18:00', close: '23:00', closed: false },
                    thursday: { open: '18:00', close: '23:00', closed: false },
                    friday: { open: '18:00', close: '23:00', closed: false },
                    saturday: { open: '18:00', close: '23:00', closed: false },
                    sunday: { open: '18:00', close: '23:00', closed: false }
                }
            }
        });
        await exampleStore.save();
        console.log('✅ Loja de exemplo criada com sucesso!');

        // Criar Admin da Loja
        console.log('🏪 Criando Admin da Loja...');
        const storeAdminPassword = await bcrypt.hash('admin123', 10);
        const storeAdmin = new User({
            name: 'Admin da Loja',
            email: 'admin@fooddelivery.com',
            password: storeAdminPassword,
            role: 'store_admin',
            storeId: exampleStore._id,
            permissions: ['store_management'],
            isActive: true
        });
        await storeAdmin.save();
        console.log('✅ Admin da Loja criado com sucesso!');
        console.log('📧 Email: admin@fooddelivery.com');
        console.log('🔑 Senha: admin123');
        console.log('🏪 Loja: Loja Exemplo');

        console.log('\n🎉 Todos os usuários foram criados com sucesso!');
        console.log('⚠️ Altere as senhas após o primeiro login por questões de segurança!');

    } catch (error) {
        console.error('❌ Erro ao criar usuários:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada');
    }
};

createCorrectUsers();