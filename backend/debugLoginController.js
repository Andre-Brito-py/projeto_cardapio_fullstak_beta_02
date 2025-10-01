import mongoose from 'mongoose';
import userModel from './models/userModel.js';
import storeModel from './models/storeModel.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const debugLoginController = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect('mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB\n');

        // Simular a função loginStoreAdmin
        const email = 'admin@fooddelivery.com';
        const password = 'admin123';
        
        console.log('🔍 Testando função loginStoreAdmin...');
        console.log('   Email:', email);
        console.log('   Password:', password);
        
        // Passo 1: Buscar usuário
        console.log('\n1️⃣ Buscando usuário...');
        const user = await userModel.findOne({ email, role: 'store_admin' }).populate('storeId');
        
        if (!user) {
            console.log('❌ Usuário não encontrado');
            return;
        }
        
        console.log('✅ Usuário encontrado:');
        console.log('   ID:', user._id);
        console.log('   Nome:', user.name);
        console.log('   Email:', user.email);
        console.log('   Role:', user.role);
        console.log('   Ativo:', user.isActive);
        console.log('   Store ID:', user.storeId?._id);
        console.log('   Store Nome:', user.storeId?.name);
        console.log('   Store Status:', user.storeId?.status);
        
        // Passo 2: Verificar senha
        console.log('\n2️⃣ Verificando senha...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('   Senha correta:', isMatch ? '✅ SIM' : '❌ NÃO');
        
        if (!isMatch) {
            console.log('❌ Senha incorreta - parando aqui');
            return;
        }
        
        // Passo 3: Verificar se usuário está ativo
        console.log('\n3️⃣ Verificando se usuário está ativo...');
        if (!user.isActive) {
            console.log('❌ Usuário não está ativo');
            return;
        }
        console.log('✅ Usuário está ativo');
        
        // Passo 4: Verificar se loja está ativa
        console.log('\n4️⃣ Verificando se loja está ativa...');
        if (user.storeId && user.storeId.status !== 'active') {
            console.log('❌ Loja não está ativa. Status:', user.storeId.status);
            return;
        }
        console.log('✅ Loja está ativa');
        
        // Passo 5: Gerar token
        console.log('\n5️⃣ Gerando token...');
        const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_testing';
        console.log('   JWT_SECRET disponível:', JWT_SECRET ? '✅ SIM' : '❌ NÃO');
        
        const token = jwt.sign(
            { id: user._id, role: user.role, storeId: user.storeId?._id },
            JWT_SECRET,
            { expiresIn: '7d' }
        );
        
        console.log('✅ Token gerado com sucesso');
        console.log('   Token (primeiros 50 chars):', token.substring(0, 50) + '...');
        
        // Passo 6: Preparar resposta
        console.log('\n6️⃣ Preparando resposta...');
        const response = {
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                storeId: user.storeId?._id,
                storeName: user.storeId?.name
            }
        };
        
        console.log('✅ Resposta preparada:');
        console.log(JSON.stringify(response, null, 2));
        
        console.log('\n🎉 Login deveria funcionar perfeitamente!');

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        console.log('\n🔌 Fechando conexão...');
        await mongoose.connection.close();
    }
};

debugLoginController();