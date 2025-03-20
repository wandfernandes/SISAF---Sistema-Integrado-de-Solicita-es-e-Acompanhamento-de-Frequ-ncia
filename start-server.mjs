#!/usr/bin/env node

/**
 * Script de inicialização para o SISAF
 * Este script inicia o servidor usando tsx para compatibilidade com ESM e TypeScript
 */

import { spawn } from 'child_process';
import http from 'http';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Porta para o servidor temporário
const PORT = 5000;
const HOST = '0.0.0.0';

console.log('=== SISAF - Iniciando servidor ===');

// Criar um servidor temporário para responder rapidamente
const tempServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema em Inicialização</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .loader { 
          border: 5px solid #f3f3f3; 
          border-top: 5px solid #3498db; 
          border-radius: 50%;
          width: 40px; 
          height: 40px; 
          animation: spin 1.5s linear infinite;
          margin: 30px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .container { background: white; max-width: 600px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
      </style>
    </head>
    <body>
      <div class="container">
        <h2>SISAF - Sistema de Gestão</h2>
        <p>O servidor está inicializando, por favor aguarde...</p>
        <div class="loader"></div>
        <p><small>Aguarde enquanto o servidor TypeScript é compilado</small></p>
        <p><small>Iniciado em: ${new Date().toLocaleTimeString()}</small></p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar o servidor temporário
tempServer.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] Servidor temporário iniciado em http://${HOST}:${PORT}`);
  
  // Iniciar o servidor principal usando tsx
  startMainServer();
});

function startMainServer() {
  console.log('Iniciando servidor principal com tsx...');
  
  // Usar tsx para executar TypeScript com suporte a ESM
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '3000' // Usar porta 3000 para o servidor principal
    }
  });
  
  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor principal:', err);
  });
  
  // Se o servidor principal iniciar com sucesso, fechar o servidor temporário após um tempo
  serverProcess.on('spawn', () => {
    console.log('Servidor principal iniciado. Aguardando inicialização completa...');
    
    // Aguardar um tempo para o servidor principal inicializar completamente
    setTimeout(() => {
      console.log('Fechando servidor temporário...');
      tempServer.close(() => {
        console.log('Servidor temporário encerrado. Usando apenas o servidor principal.');
      });
    }, 5000); // 5 segundos
  });
  
  serverProcess.on('close', (code) => {
    console.log(`Servidor principal encerrado com código ${code}`);
  });
}