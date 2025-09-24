import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/userModel.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar .env do diretório raiz do projeto
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const createSuperAdmin = async () => {
  try {
    // Conectar ao MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Conectado ao MongoDB');

    // Verificar se já existe um super admin
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('⚠️  Super Admin já existe:', existingSuperAdmin.email);
      process.exit(0);
    }

    // Dados do super admin
    const superAdminData = {
      name: 'Super Admin',
      email: 'admin@fooddelivery.com',
      password: 'admin123',
      role: 'superadmin',
      isActive: true
    };

    // Hash da senha
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(superAdminData.password, saltRounds);

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
    console.log('📧 Email:', superAdminData.email);
    console.log('🔑 Senha:', superAdminData.password);
    console.log('⚠️  Altere a senha após o primeiro login!');

  } catch (error) {
    console.error('❌ Erro ao criar Super Admin:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Conexão com MongoDB fechada');
    process.exit(0);
  }
};

createSuperAdmin();