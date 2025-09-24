import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import userModel from './models/userModel.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
dotenv.config({ path: join(__dirname, '..', '.env') });

async function checkPasswordHashes() {
    try {
        console.log('🔌 Conectando ao MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado ao MongoDB\n');

        // Buscar todos os usuários
        const users = await userModel.find({}, 'name email password role');
        
        console.log('🔍 VERIFICANDO HASHES DAS SENHAS');
        console.log('================================\n');
        
        for (const user of users) {
            console.log(`👤 Usuário: ${user.name} (${user.email})`);
            console.log(`📧 Email: ${user.email}`);
            console.log(`🔑 Role: ${user.role}`);
            console.log(`🔒 Hash da senha: ${user.password}`);
            
            // Testar senhas conhecidas
            const testPasswords = ['superadmin123', 'admin123', '123456', 'password'];
            
            console.log('\n🧪 Testando senhas conhecidas:');
            for (const testPassword of testPasswords) {
                try {
                    const isMatch = await bcrypt.compare(testPassword, user.password);
                    console.log(`   "${testPassword}": ${isMatch ? '✅ MATCH' : '❌ NO MATCH'}`);
                } catch (error) {
                    console.log(`   "${testPassword}": ❌ ERRO - ${error.message}`);
                }
            }
            
            // Verificar se o hash parece válido (bcrypt hashes começam com $2b$)
            const isValidBcryptHash = user.password.startsWith('$2b$') || user.password.startsWith('$2a$');
            console.log(`🔍 Hash válido do bcrypt: ${isValidBcryptHash ? '✅ SIM' : '❌ NÃO'}`);
            
            console.log('\n' + '='.repeat(50) + '\n');
        }
        
        // Testar criação de novo hash
        console.log('🧪 TESTANDO CRIAÇÃO DE NOVO HASH');
        console.log('=================================\n');
        
        const testPassword = 'superadmin123';
        const saltRounds = 10;
        const newHash = await bcrypt.hash(testPassword, saltRounds);
        
        console.log(`Senha original: ${testPassword}`);
        console.log(`Novo hash: ${newHash}`);
        
        const testMatch = await bcrypt.compare(testPassword, newHash);
        console.log(`Teste de comparação: ${testMatch ? '✅ FUNCIONOU' : '❌ FALHOU'}`);
        
    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Conexão com MongoDB fechada');
    }
}

checkPasswordHashes();