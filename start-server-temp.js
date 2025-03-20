#!/usr/bin/env node

/**
 * Script temporário para iniciar o servidor SISAF
 * Utilizando TSX para suportar ESM + TypeScript sem problema de extensão
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

// Porto para o servidor HTTP simples
const PORT = 5000;

console.log('=== SISAF Temporary Server Starter ===');
console.log(`[${new Date().toISOString()}] Iniciando`);

// Criar um servidor HTTP simples para responder ao Replit
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('SISAF Iniciando...');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor temporário iniciado na porta ${PORT}`);
  
  // Usar TSX para iniciar o servidor real
  const tsx = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '3000' // Usar porta diferente para o servidor real
    }
  });
  
  tsx.on('error', (err) => {
    console.error('Erro ao iniciar TSX:', err);
    
    // Tentar fallback para o Node puro
    console.log('Tentando fallback para Node...');
    const node = spawn('node', ['server/esm-start.js'], {
      stdio: 'inherit'
    });
    
    node.on('error', (nodeErr) => {
      console.error('Erro ao iniciar Node fallback:', nodeErr);
      process.exit(1);
    });
  });
});

// Tratar sinais para encerramento limpo
process.on('SIGINT', () => {
  console.log('Encerrando servidor temporário...');
  server.close();
  process.exit(0);
});