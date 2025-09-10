import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import CounterAttendant from './models/counterAttendantModel.js';
import Store from './models/storeModel.js';
import User from './models/userModel.js';
import dotenv from 'dotenv';

dotenv.config();

const createTestAttendant = async () => {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Conectado ao MongoDB');
        
        // Buscar uma loja existente
        const store = await Store.findOne();
        if (!store) {
            console.log('Nenhuma loja encontrada. Crie uma loja primeiro.');
            return;
        }
        
        console.log('Loja encontrada:', store.name);
        
        // Buscar qualquer usuário existente
        const admin = await User.findOne();
        if (!admin) {
            console.log('Nenhum usuário encontrado. Crie um usuário primeiro.');
            return;
        }
        
        console.log('Usuário encontrado:', admin.name, '- Role:', admin.role);
        
        // Verificar se já existe um atendente de teste
        const existingAttendant = await CounterAttendant.findOne({ email: 'atendente@teste.com' });
        if (existingAttendant) {
            console.log('Atendente de teste já existe!');
            console.log('Email: atendente@teste.com');
            console.log('Senha: 123456789');
            return;
        }
        
        // Hash da senha
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456789', salt);
        
        // Criar atendente de teste
        const testAttendant = new CounterAttendant({
            name: 'Atendente Teste',
            email: 'atendente@teste.com',
            password: hashedPassword,
            storeId: store._id,
            employeeId: 'ATD001',
            phone: '(11) 99999-9999',
            shift: 'full_time',
            permissions: {
                canCreateOrders: true,
                canViewReports: true,
                canManageProducts: false
            },
            isActive: true,
            createdBy: admin._id
        });
        
        await testAttendant.save();
        
        console.log('✅ Atendente de teste criado com sucesso!');
        console.log('📧 Email: atendente@teste.com');
        console.log('🔑 Senha: 123456789');
        console.log('🏪 Loja:', store.name);
        
    } catch (error) {
        console.error('Erro ao criar atendente de teste:', error);
    } finally {
        mongoose.connection.close();
    }
};

createTestAttendant();