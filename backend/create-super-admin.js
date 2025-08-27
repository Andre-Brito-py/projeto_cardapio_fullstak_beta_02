import axios from 'axios';

const createSuperAdmin = async () => {
  try {
    console.log('👤 Criando Super Admin...');
    const response = await axios.post('http://localhost:4000/api/system/super-admin/create', {
      name: 'Super Admin',
      email: 'superadmin@admin.com',
      password: 'superadmin123'
    });
    
    console.log('✅ Resposta:', response.data);
    
    if (response.data.success) {
      console.log('🎉 Super Admin criado com sucesso!');
    } else {
      console.log('❌ Erro:', response.data.message);
    }
  } catch (error) {
    console.log('❌ Erro de conexão:', error.message);
    if (error.response) {
      console.log('Resposta do servidor:', error.response.data);
    }
  }
};

createSuperAdmin();