#!/usr/bin/env node

/**
 * Arquivo de inicialização do servidor para suporte a ESM
 * Este script inicia o servidor utilizando tsx com as configurações
 * necessárias para executar módulos ES
 */

const { spawn } = require('child_process');
const path = require('path');

// Obter diretório atual
const __dirname = process.cwd();

function startServer() {
  console.log('=== SISAF ESM Server Starter ===');
  console.log('Iniciando servidor com suporte a ES Modules...');
  console.log(`Data/Hora: ${new Date().toISOString()}`);
  
  // Iniciar o servidor usando tsx (que suporta TypeScript + ESM)
  const serverProcess = spawn('npx', [
    'tsx',
    '--experimental-specifier-resolution=node',
    'server/index.ts'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '5000'
    }
  });
  
  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
  
  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Servidor encerrado com código: ${code}`);
      process.exit(code || 1);
    }
  });
  
  // Capturar sinais para encerramento limpo
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT. Encerrando servidor...');
    serverProcess.kill('SIGINT');
  });
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM. Encerrando servidor...');
    serverProcess.kill('SIGTERM');
  });
}

// Iniciar o servidor
startServer();