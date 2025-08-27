import axios from 'axios';

const resetSuperAdminPassword = async () => {
  try {
    console.log('🔐 Resetando senha do super admin...');
    const response = await axios.post('http://localhost:4000/api/system/super-admin/reset-password', {
      email: 'superadmin@sistema.com',
      newPassword: 'superadmin123'
    });
    
    console.log('✅ Resposta:', response.data);
    
    if (response.data.success) {
      console.log('🎉 Senha resetada com sucesso!');
      console.log('📧 Email:', 'superadmin@sistema.com');
      console.log('🔑 Nova senha:', 'superadmin123');
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

resetSuperAdminPassword();