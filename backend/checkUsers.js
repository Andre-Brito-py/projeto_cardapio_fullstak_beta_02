import mongoose from 'mongoose';
import User from './models/userModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const checkUsers = async () => {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-food-delivery-app');
        console.log('✅ Conectado ao MongoDB');

        // Buscar todos os usuários
        const users = await User.find({}, 'name email role isActive createdAt');
        
        console.log('\n📋 Usuários encontrados no banco de dados:');
        console.log('='.repeat(60));
        
        if (users.length === 0) {
            console.log('❌ Nenhum usuário encontrado no banco de dados');
        } else {
            users.forEach((user, index) => {
                console.log(`\n${index + 1}. Nome: ${user.name}`);
                console.log(`   Email: ${user.email}`);
                console.log(`   Role: ${user.role}`);
                console.log(`   Ativo: ${user.isActive ? 'Sim' : 'Não'}`);
                console.log(`   Criado em: ${user.createdAt.toLocaleString('pt-BR')}`);
            });
        }
        
        console.log('\n='.repeat(60));
        console.log(`📊 Total de usuários: ${users.length}`);

    } catch (error) {
        console.error('❌ Erro ao verificar usuários:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Conexão com MongoDB fechada');
    }
};

checkUsers();