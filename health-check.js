#!/usr/bin/env node

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const SERVICES = {
  backend: {
    name: 'Backend API',
    url: 'http://localhost:4001/api/health',
    port: 4001,
    fallbackUrl: 'http://localhost:4001'
  },
  frontend: {
    name: 'Frontend (Clientes)',
    url: 'http://localhost:5173',
    port: 5173
  },
  admin: {
    name: 'Admin (Lojas)',
    url: 'http://localhost:5174',
    port: 5174
  },
  counter: {
    name: 'Counter (Balcão)',
    url: 'http://localhost:5176',
    port: 5176
  }
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function colorLog(message, color = 'reset') {
  console.log(`${COLORS[color]}${message}${COLORS.reset}`);
}

async function checkPort(port) {
  try {
    const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

async function checkService(service) {
  const { name, url, port, fallbackUrl } = service;
  
  // Verificar se a porta está em uso
  const portInUse = await checkPort(port);
  
  if (!portInUse) {
    return {
      name,
      status: 'offline',
      message: `Porta ${port} não está em uso`,
      port
    };
  }

  // Tentar fazer requisição HTTP
  try {
    const response = await axios.get(url, { 
      timeout: 5000,
      validateStatus: () => true // Aceitar qualquer status code
    });
    
    if (response.status >= 200 && response.status < 400) {
      return {
        name,
        status: 'online',
        message: `Respondendo na porta ${port}`,
        port,
        statusCode: response.status
      };
    } else {
      return {
        name,
        status: 'warning',
        message: `Porta ${port} ativa, mas retornou status ${response.status}`,
        port,
        statusCode: response.status
      };
    }
  } catch (error) {
    // Se falhar, tentar URL alternativa (para backend)
    if (fallbackUrl && fallbackUrl !== url) {
      try {
        const fallbackResponse = await axios.get(fallbackUrl, { 
          timeout: 5000,
          validateStatus: () => true
        });
        
        return {
          name,
          status: 'online',
          message: `Respondendo na porta ${port} (sem endpoint /health)`,
          port,
          statusCode: fallbackResponse.status
        };
      } catch (fallbackError) {
        // Continuar com o erro original
      }
    }
    
    return {
      name,
      status: 'error',
      message: `Porta ${port} ativa, mas serviço não responde: ${error.message}`,
      port
    };
  }
}

async function checkMongoDB() {
  try {
    const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq mongod.exe"');
    const isRunning = stdout.includes('mongod.exe');
    
    return {
      name: 'MongoDB',
      status: isRunning ? 'online' : 'offline',
      message: isRunning ? 'Processo mongod.exe encontrado' : 'Processo mongod.exe não encontrado'
    };
  } catch (error) {
    return {
      name: 'MongoDB',
      status: 'error',
      message: `Erro ao verificar MongoDB: ${error.message}`
    };
  }
}

async function main() {
  colorLog('\n🔍 VERIFICAÇÃO DE SAÚDE DO SISTEMA', 'bold');
  colorLog('=====================================\n', 'blue');
  
  const results = [];
  
  // Verificar MongoDB
  colorLog('📊 Verificando MongoDB...', 'yellow');
  const mongoResult = await checkMongoDB();
  results.push(mongoResult);
  
  // Verificar cada serviço
  for (const [key, service] of Object.entries(SERVICES)) {
    colorLog(`🔍 Verificando ${service.name}...`, 'yellow');
    const result = await checkService(service);
    results.push(result);
  }
  
  // Exibir resultados
  colorLog('\n📋 RESULTADOS:', 'bold');
  colorLog('===============\n', 'blue');
  
  let allOnline = true;
  
  results.forEach(result => {
    const { name, status, message, port, statusCode } = result;
    
    let statusIcon, statusColor;
    switch (status) {
      case 'online':
        statusIcon = '✅';
        statusColor = 'green';
        break;
      case 'warning':
        statusIcon = '⚠️';
        statusColor = 'yellow';
        allOnline = false;
        break;
      case 'offline':
        statusIcon = '❌';
        statusColor = 'red';
        allOnline = false;
        break;
      case 'error':
        statusIcon = '🔥';
        statusColor = 'red';
        allOnline = false;
        break;
      default:
        statusIcon = '❓';
        statusColor = 'yellow';
        allOnline = false;
    }
    
    const portInfo = port ? ` (porta ${port})` : '';
    const statusInfo = statusCode ? ` [${statusCode}]` : '';
    
    colorLog(`${statusIcon} ${name}${portInfo}${statusInfo}`, statusColor);
    colorLog(`   ${message}\n`, 'reset');
  });
  
  // Resumo final
  colorLog('📊 RESUMO:', 'bold');
  colorLog('==========', 'blue');
  
  if (allOnline) {
    colorLog('🎉 Todos os serviços estão funcionando corretamente!', 'green');
  } else {
    colorLog('⚠️  Alguns serviços precisam de atenção.', 'yellow');
  }
  
  const onlineCount = results.filter(r => r.status === 'online').length;
  const totalCount = results.length;
  
  colorLog(`\n📈 Status: ${onlineCount}/${totalCount} serviços online\n`, 'blue');
  
  // URLs de acesso
  colorLog('🌐 URLs DE ACESSO:', 'bold');
  colorLog('==================', 'blue');
  colorLog('• Frontend (Clientes): http://localhost:5173', 'reset');
  colorLog('• Admin (Lojas):       http://localhost:5174', 'reset');
  colorLog('• Counter (Balcão):    http://localhost:5176', 'reset');
  colorLog('• Backend (API):       http://localhost:4001\n', 'reset');
  
  process.exit(allOnline ? 0 : 1);
}

// Executar verificação
main().catch(error => {
  colorLog(`\n🔥 Erro durante verificação: ${error.message}`, 'red');
  process.exit(1);
});