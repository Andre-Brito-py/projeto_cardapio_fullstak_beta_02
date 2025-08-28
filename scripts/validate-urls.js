#!/usr/bin/env node

/**
 * Script de Validação de URLs
 * 
 * Este script verifica se todas as URLs no projeto estão configuradas corretamente
 * para evitar que links de loja direcionem para o admin ao invés do cliente.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Configurações esperadas
const EXPECTED_URLS = {
  FRONTEND: 'http://localhost:5173',
  ADMIN: 'http://localhost:5174',
  BACKEND: 'http://localhost:4000'
};

// Padrões problemáticos a serem verificados
const PROBLEMATIC_PATTERNS = [
  {
    pattern: /localhost:5174.*\/loja\//g,
    description: 'Link de loja usando porta do admin (5174) - deve usar 5173',
    severity: 'ERROR'
  },
  {
    pattern: /localhost:5174.*\/menu\//g,
    description: 'Link de menu usando porta do admin (5174) - deve usar 5173',
    severity: 'ERROR'
  },
  {
    pattern: /localhost:5173.*\/admin/g,
    description: 'Link de admin usando porta do cliente (5173) - deve usar 5174',
    severity: 'ERROR'
  },
  {
    pattern: /http:\/\/localhost:517[34]/g,
    description: 'URL hardcoded encontrada - considere usar configuração centralizada',
    severity: 'WARNING'
  }
];

// Arquivos a serem verificados
const FILES_TO_CHECK = [
  'admin/src/pages/StoreLinks/StoreLinks.jsx',
  'backend/models/tableModel.js',
  'backend/createAdmin.js',
  'frontend/src/components/ShareStore/ShareStore.jsx',
  'admin/src/config/urls.js'
];

class URLValidator {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checkedFiles = 0;
  }

  validateFile(filePath) {
    const fullPath = path.join(projectRoot, filePath);
    
    if (!fs.existsSync(fullPath)) {
      this.warnings.push(`Arquivo não encontrado: ${filePath}`);
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    this.checkedFiles++;

    console.log(`🔍 Verificando: ${filePath}`);

    PROBLEMATIC_PATTERNS.forEach(({ pattern, description, severity }) => {
      const matches = content.match(pattern);
      if (matches) {
        const issue = {
          file: filePath,
          description,
          matches: matches,
          severity
        };

        if (severity === 'ERROR') {
          this.errors.push(issue);
        } else {
          this.warnings.push(issue);
        }
      }
    });
  }

  validateAllFiles() {
    console.log('🚀 Iniciando validação de URLs...\n');

    FILES_TO_CHECK.forEach(file => {
      this.validateFile(file);
    });

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESULTADOS DA VALIDAÇÃO');
    console.log('='.repeat(60));
    console.log(`Arquivos verificados: ${this.checkedFiles}`);
    console.log(`Erros encontrados: ${this.errors.length}`);
    console.log(`Avisos: ${this.warnings.length}`);

    if (this.errors.length > 0) {
      console.log('\n❌ ERROS CRÍTICOS:');
      this.errors.forEach((error, index) => {
        console.log(`\n${index + 1}. ${error.file}`);
        console.log(`   Problema: ${error.description}`);
        console.log(`   Encontrado: ${error.matches.join(', ')}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  AVISOS:');
      this.warnings.forEach((warning, index) => {
        console.log(`\n${index + 1}. ${warning.file || 'Sistema'}`);
        console.log(`   Aviso: ${warning.description || warning}`);
        if (warning.matches) {
          console.log(`   Encontrado: ${warning.matches.join(', ')}`);
        }
      });
    }

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log('\n✅ Parabéns! Nenhum problema encontrado.');
      console.log('Todas as URLs estão configuradas corretamente.');
    }

    console.log('\n' + '='.repeat(60));
    
    if (this.errors.length > 0) {
      console.log('\n🔧 AÇÕES RECOMENDADAS:');
      console.log('1. Corrija os erros críticos listados acima');
      console.log('2. Use a configuração centralizada em admin/src/config/urls.js');
      console.log('3. Execute este script novamente após as correções');
      console.log('4. Reinicie os servidores após as mudanças');
      
      process.exit(1);
    } else {
      console.log('\n✅ Validação concluída com sucesso!');
      process.exit(0);
    }
  }
}

// Executar validação
const validator = new URLValidator();
validator.validateAllFiles();