#!/usr/bin/env node

/**
 * Script de inicialização do servidor SISAF
 * 
 * Este script é projetado para iniciar o servidor TypeScript+ESM
 * de forma compatível com o ambiente Replit.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Assegurar compatibilidade entre ESM e TypeScript
const setupESM = () => {
  // Verifique se existe um arquivo tsconfig.json
  const tsconfigPath = path.join(__dirname, 'tsconfig.json');
  if (fs.existsSync(tsconfigPath)) {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    
    // Assegure-se de que tsconfig tem as configurações necessárias para ESM
    if (tsconfig.compilerOptions) {
      // Estas configurações são essenciais para ESM + TypeScript
      const requiredOptions = {
        module: "NodeNext",
        moduleResolution: "NodeNext",
        esModuleInterop: true
      };
      
      let modified = false;
      
      for (const [key, value] of Object.entries(requiredOptions)) {
        if (tsconfig.compilerOptions[key] !== value) {
          tsconfig.compilerOptions[key] = value;
          modified = true;
        }
      }
      
      if (modified) {
        console.log('Atualizando tsconfig.json para suporte ESM...');
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
      }
    }
  }
};

// Inicializar o servidor
const startServer = () => {
  console.log('Iniciando servidor SISAF...');
  
  // Configurar variáveis de ambiente
  const env = {
    ...process.env,
    NODE_OPTIONS: '--experimental-specifier-resolution=node',
    PORT: process.env.PORT || '5000',
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  
  // Usar o tsx, que é compatível com TypeScript + ESM
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env
  });
  
  serverProcess.on('error', (error) => {
    console.error('Erro ao iniciar o servidor:', error);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    console.log(`Servidor encerrado com código ${code}`);
    process.exit(code || 0);
  });
  
  // Gerenciar sinais para encerramento limpo
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT, encerrando servidor...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM, encerrando servidor...');
    serverProcess.kill('SIGTERM');
  });
};

// Executar as funções
setupESM();
startServer();