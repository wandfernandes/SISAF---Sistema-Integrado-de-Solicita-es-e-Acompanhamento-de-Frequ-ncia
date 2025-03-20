#!/usr/bin/env node

/**
 * Script de inicialização para ser usado pelo workflow do Replit
 * Este script inicia o servidor usando tsx para compatibilidade com ESM e TypeScript
 */

const { spawn } = require('child_process');
const http = require('http');

console.log('=== SISAF - Iniciando servidor via workflow ===');

// Iniciar o servidor com tsx
const tsxProcess = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '3000' // Usar porta 3000 para o servidor
  }
});

tsxProcess.on('error', (err) => {
  console.error('Erro ao iniciar o servidor com tsx:', err);
  
  // Tentar com node diretamente como fallback
  console.log('Tentando iniciar com node...');
  const nodeProcess = spawn('node', ['--loader', 'ts-node/esm', 'server/index.ts'], {
    stdio: 'inherit'
  });
  
  nodeProcess.on('error', (nodeErr) => {
    console.error('Erro ao iniciar com node:', nodeErr);
  });
});

process.on('SIGINT', () => {
  console.log('Encerrando servidor...');
  tsxProcess.kill('SIGINT');
  process.exit(0);
});