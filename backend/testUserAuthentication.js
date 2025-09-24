import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './models/userModel.js';

// Conectar ao MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/food_delivery', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('🔌 Conectado ao MongoDB');
  } catch (error) {
    console.error('❌ Erro ao conectar ao MongoDB:', error);
    process.exit(1);
  }
};

// Função para testar hash de senhas
const testPasswordHashing = async () => {
  console.log('\n🔐 TESTANDO HASH DE SENHAS');
  
  try {
    const testPassword = 'testPassword123';
    const hashedPassword = await bcrypt.hash(testPassword, 12);
    
    console.log('✅ Senha hasheada com sucesso');
    console.log(`📝 Hash gerado: ${hashedPassword.substring(0, 20)}...`);
    
    // Testar comparação de senha
    const isMatch = await bcrypt.compare(testPassword, hashedPassword);
    console.log(`✅ Comparação de senha: ${isMatch ? 'SUCESSO' : 'FALHA'}`);
    
    // Testar senha incorreta
    const wrongMatch = await bcrypt.compare('wrongPassword', hashedPassword);
    console.log(`✅ Teste senha incorreta: ${wrongMatch ? 'FALHA' : 'SUCESSO'}`);
    
  } catch (error) {
    console.error('❌ Erro no teste de hash:', error.message);
  }
};

// Função para testar JWT
const testJWTGeneration = () => {
  console.log('\n🎫 TESTANDO GERAÇÃO DE JWT');
  
  try {
    const payload = {
      userId: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      role: 'customer'
    };
    
    const secret = process.env.JWT_SECRET || 'fallback_secret_key';
    const token = jwt.sign(payload, secret, { expiresIn: '24h' });
    
    console.log('✅ JWT gerado com sucesso');
    console.log(`📝 Token: ${token.substring(0, 30)}...`);
    
    // Verificar token
    const decoded = jwt.verify(token, secret);
    console.log('✅ JWT verificado com sucesso');
    console.log(`📝 Payload decodificado:`, decoded);
    
  } catch (error) {
    console.error('❌ Erro no teste de JWT:', error.message);
  }
};

// Função para verificar integridade dos usuários existentes
const verifyUserIntegrity = async () => {
  console.log('\n👥 VERIFICANDO INTEGRIDADE DOS USUÁRIOS');
  
  try {
    const users = await User.find({});
    console.log(`📊 Total de usuários encontrados: ${users.length}`);
    
    if (users.length === 0) {
      console.log('⚠️  Nenhum usuário encontrado no banco de dados');
      return;
    }
    
    let validUsers = 0;
    let invalidUsers = 0;
    const issues = [];
    
    for (const user of users) {
      let userValid = true;
      const userIssues = [];
      
      // Verificar campos obrigatórios
      if (!user.name) {
        userIssues.push('Nome ausente');
        userValid = false;
      }
      
      if (!user.email) {
        userIssues.push('Email ausente');
        userValid = false;
      }
      
      if (!user.password) {
        userIssues.push('Senha ausente');
        userValid = false;
      }
      
      if (!user.role) {
        userIssues.push('Role ausente');
        userValid = false;
      }
      
      // Verificar formato do email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (user.email && !emailRegex.test(user.email)) {
        userIssues.push('Formato de email inválido');
        userValid = false;
      }
      
      // Verificar se a senha está hasheada (bcrypt hash tem 60 caracteres)
      if (user.password && user.password.length !== 60) {
        userIssues.push('Senha não está hasheada corretamente');
        userValid = false;
      }
      
      // Verificar roles válidas
      const validRoles = ['customer', 'store_admin', 'super_admin', 'waiter'];
      if (user.role && !validRoles.includes(user.role)) {
        userIssues.push(`Role inválida: ${user.role}`);
        userValid = false;
      }
      
      if (userValid) {
        validUsers++;
      } else {
        invalidUsers++;
        issues.push({
          userId: user._id,
          email: user.email,
          issues: userIssues
        });
      }
      
      console.log(`${userValid ? '✅' : '❌'} ${user.email} (${user.role}) - ${user.name}`);
      if (!userValid) {
        console.log(`   Problemas: ${userIssues.join(', ')}`);
      }
    }
    
    console.log(`\n📈 RESUMO DA VERIFICAÇÃO:`);
    console.log(`✅ Usuários válidos: ${validUsers}`);
    console.log(`❌ Usuários com problemas: ${invalidUsers}`);
    
    if (issues.length > 0) {
      console.log(`\n🚨 PROBLEMAS ENCONTRADOS:`);
      issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.email}:`);
        issue.issues.forEach(prob => console.log(`   - ${prob}`));
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de usuários:', error.message);
  }
};

// Função para testar login de usuários
const testUserLogin = async () => {
  console.log('\n🔑 TESTANDO LOGIN DE USUÁRIOS');
  
  try {
    // Buscar um super admin para testar
    const superAdmin = await User.findOne({ role: 'super_admin' });
    
    if (!superAdmin) {
      console.log('❌ Nenhum super admin encontrado para teste');
      return;
    }
    
    console.log(`📧 Testando login com: ${superAdmin.email}`);
    
    // Testar senha padrão (123456)
    const testPassword = '123456';
    const isPasswordValid = await bcrypt.compare(testPassword, superAdmin.password);
    
    if (isPasswordValid) {
      console.log('✅ Senha padrão funciona corretamente');
      
      // Gerar JWT para o usuário
      const token = jwt.sign(
        {
          userId: superAdmin._id,
          email: superAdmin.email,
          role: superAdmin.role
        },
        process.env.JWT_SECRET || 'fallback_secret_key',
        { expiresIn: '24h' }
      );
      
      console.log('✅ Token JWT gerado para o usuário');
      console.log(`📝 Token: ${token.substring(0, 50)}...`);
      
    } else {
      console.log('❌ Senha padrão não funciona');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste de login:', error.message);
  }
};

// Função para verificar duplicatas de email
const checkEmailDuplicates = async () => {
  console.log('\n📧 VERIFICANDO DUPLICATAS DE EMAIL');
  
  try {
    const emailCounts = await User.aggregate([
      {
        $group: {
          _id: '$email',
          count: { $sum: 1 },
          users: { $push: { id: '$_id', name: '$name', role: '$role' } }
        }
      },
      {
        $match: { count: { $gt: 1 } }
      }
    ]);
    
    if (emailCounts.length === 0) {
      console.log('✅ Nenhuma duplicata de email encontrada');
    } else {
      console.log(`❌ ${emailCounts.length} emails duplicados encontrados:`);
      emailCounts.forEach(duplicate => {
        console.log(`📧 ${duplicate._id}:`);
        duplicate.users.forEach(user => {
          console.log(`   - ${user.name} (${user.role}) - ID: ${user.id}`);
        });
      });
    }
    
  } catch (error) {
    console.error('❌ Erro na verificação de duplicatas:', error.message);
  }
};

// Função principal
const runAuthenticationTests = async () => {
  console.log('=== TESTE DE INTEGRIDADE DE USUÁRIOS E AUTENTICAÇÃO ===');
  
  await connectDB();
  
  await testPasswordHashing();
  testJWTGeneration();
  await verifyUserIntegrity();
  await testUserLogin();
  await checkEmailDuplicates();
  
  console.log('\n🎉 TESTES DE AUTENTICAÇÃO CONCLUÍDOS!');
  
  // Fechar conexão
  await mongoose.connection.close();
  console.log('🔌 Fechando conexão com MongoDB');
};

// Executar testes
runAuthenticationTests().catch(console.error);