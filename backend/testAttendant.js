import mongoose from 'mongoose';
import CounterAttendant from './models/counterAttendantModel.js';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// Conectar ao MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Conectado ao MongoDB'))
  .catch(err => console.error('Erro ao conectar:', err));

async function testAttendant() {
  try {
    // Verificar se existe o atendente de teste específico
    const testAttendant = await CounterAttendant.findOne({ email: 'atendente@teste.com' });
    
    if (testAttendant) {
      console.log('Atendente de teste encontrado:', {
        email: testAttendant.email,
        name: testAttendant.name,
        isActive: testAttendant.isActive,
        storeId: testAttendant.storeId
      });
    } else {
      console.log('Atendente de teste não encontrado. Criando...');
      
      // Criar atendente de teste
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('123456789', salt);
      
      const newTestAttendant = new CounterAttendant({
        name: 'Atendente Teste',
        email: 'atendente@teste.com',
        password: hashedPassword,
        storeId: new mongoose.Types.ObjectId(), // ID fictício
        isActive: true,
        permissions: {
          canCreateOrders: true,
          canViewReports: false,
          canManageProducts: false
        }
      });
      
      await newTestAttendant.save();
      console.log('Atendente de teste criado com sucesso!');
      console.log('Email: atendente@teste.com');
      console.log('Senha: 123456789');
    }
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    mongoose.connection.close();
  }
}

testAttendant();