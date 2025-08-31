#!/usr/bin/env node

/**
 * Script de Setup do Food Delivery Application
 * 
 * Este script automatiza a configuração inicial do projeto,
 * garantindo que todas as URLs sejam configuradas corretamente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurações padrão
const DEFAULT_CONFIG = {
  FRONTEND_URL: 'http://localhost:5173',
  ADMIN_URL: 'http://localhost:5174',
  BACKEND_URL: 'http://localhost:4000',
  MONGO_URI: 'mongodb://localhost:27017/food-delivery',
  JWT_SECRET: 'your-super-secret-jwt-key-here-' + Math.random().toString(36).substring(7)
};

class ProjectSetup {
  constructor() {
    this.projectRoot = __dirname;
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };
    
    const prefix = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    console.log(`${colors[type]}${prefix[type]} ${message}${colors.reset}`);
  }

  createEnvFile(directory, content) {
    const envPath = path.join(this.projectRoot, directory, '.env');
    const envExamplePath = path.join(this.projectRoot, directory, '.env.example');
    
    try {
      // Verificar se .env já existe
      if (fs.existsSync(envPath)) {
        this.log(`Arquivo .env já existe em ${directory}`, 'warning');
        return false;
      }

      // Verificar se .env.example existe
      if (!fs.existsSync(envExamplePath)) {
        this.log(`Arquivo .env.example não encontrado em ${directory}`, 'error');
        return false;
      }

      // Copiar .env.example para .env
      fs.copyFileSync(envExamplePath, envPath);
      this.log(`Arquivo .env criado em ${directory}`, 'success');
      return true;
    } catch (error) {
      this.log(`Erro ao criar .env em ${directory}: ${error.message}`, 'error');
      return false;
    }
  }

  updateBackendEnv() {
    const envPath = path.join(this.projectRoot, '.env');
    
    try {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Atualizar configurações específicas se necessário
      Object.entries(DEFAULT_CONFIG).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          // Se a linha existe mas está comentada ou vazia, descomente e defina valor
          if (envContent.includes(`# ${key}=`) || envContent.includes(`${key}=\n`)) {
            envContent = envContent.replace(new RegExp(`# ${key}=.*$`, 'm'), `${key}=${value}`);
            envContent = envContent.replace(new RegExp(`${key}=$`, 'm'), `${key}=${value}`);
          }
        }
      });
      
      fs.writeFileSync(envPath, envContent);
      this.log('Configurações do backend atualizadas', 'success');
    } catch (error) {
      this.log(`Erro ao atualizar .env do backend: ${error.message}`, 'error');
    }
  }

  validateUrls() {
    this.log('Validando configurações de URL...', 'info');
    
    // Verificar arquivos de configuração
    const configFiles = [
      'backend/config/urls.js',
      'admin/src/config/urls.js'
    ];

    let allValid = true;

    configFiles.forEach(file => {
      const filePath = path.join(this.projectRoot, file);
      if (fs.existsSync(filePath)) {
        this.log(`✓ Arquivo de configuração encontrado: ${file}`, 'success');
      } else {
        this.log(`✗ Arquivo de configuração não encontrado: ${file}`, 'error');
        allValid = false;
      }
    });

    return allValid;
  }

  checkDependencies() {
    this.log('Verificando dependências...', 'info');
    
    const directories = ['backend', 'frontend', 'admin'];
    let allInstalled = true;

    directories.forEach(dir => {
      const nodeModulesPath = path.join(this.projectRoot, dir, 'node_modules');
      if (fs.existsSync(nodeModulesPath)) {
        this.log(`✓ Dependências instaladas em ${dir}`, 'success');
      } else {
        this.log(`✗ Dependências não instaladas em ${dir}`, 'warning');
        this.log(`  Execute: cd ${dir} && npm install`, 'info');
        allInstalled = false;
      }
    });

    return allInstalled;
  }

  displaySummary() {
    console.log('\n' + '='.repeat(50));
    this.log('CONFIGURAÇÃO CONCLUÍDA!', 'success');
    console.log('='.repeat(50));
    
    console.log('\n📍 URLs configuradas:');
    console.log(`   • Frontend (Cliente/Garçom): ${DEFAULT_CONFIG.FRONTEND_URL}`);
    console.log(`   • Admin (Painel):           ${DEFAULT_CONFIG.ADMIN_URL}`);
    console.log(`   • Backend (API):            ${DEFAULT_CONFIG.BACKEND_URL}`);
    
    console.log('\n🚀 Para iniciar o projeto:');
    console.log('   • Windows: .\\start-project.bat');
    console.log('   • PowerShell: .\\start-project.ps1');
    console.log('   • Manual: npm run dev em cada diretório');
    
    console.log('\n🔧 Comandos úteis:');
    console.log('   • Validar URLs: node scripts/validate-urls.js');
    console.log('   • Instalar deps: npm run install:all');
    
    console.log('\n📚 Documentação:');
    console.log('   • URLS_GUIDE.md - Guia de URLs e portas');
    console.log('   • PREVENTION_CHECKLIST.md - Lista de verificação');
    console.log('   • README.md - Documentação geral');
  }

  async run() {
    console.log('\n' + '='.repeat(50));
    this.log('FOOD DELIVERY - SETUP DO PROJETO', 'info');
    console.log('='.repeat(50) + '\n');

    // 1. Criar arquivos .env
    this.log('Etapa 1: Configurando arquivos de ambiente...', 'info');
    this.createEnvFile('.', '');
    this.createEnvFile('admin', '');
    this.createEnvFile('frontend', '');

    // 2. Atualizar configurações do backend
    if (fs.existsSync(path.join(this.projectRoot, '.env'))) {
      this.updateBackendEnv();
    }

    // 3. Validar configurações
    this.log('\nEtapa 2: Validando configurações...', 'info');
    this.validateUrls();

    // 4. Verificar dependências
    this.log('\nEtapa 3: Verificando dependências...', 'info');
    this.checkDependencies();

    // 5. Exibir resumo
    this.displaySummary();
  }
}

// Executar setup
const setup = new ProjectSetup();
setup.run().catch(error => {
  console.error('❌ Erro durante o setup:', error);
  process.exit(1);
});