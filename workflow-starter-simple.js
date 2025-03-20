#!/usr/bin/env node

/**
 * Script de inicialização simplificado para o workflow do Replit
 * 
 * Este script inicia um servidor HTTP simples na porta 5000
 * e executa o servidor de desenvolvimento através do server-bridge.cjs
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Configuração do servidor
const PORT = 5000;
const HOST = '0.0.0.0';

console.log('=== SISAF Workflow Starter (Simplificado) ===');
console.log(`Data/Hora: ${new Date().toISOString()}`);

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema em Inicialização</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .loader { 
          border: 5px solid #f3f3f3; 
          border-top: 5px solid #007bff; 
          border-radius: 50%;
          width: 40px; 
          height: 40px; 
          animation: spin 2s linear infinite;
          margin: 30px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <h1>SISAF - Sistema de Gestão</h1>
      <p>Servidor em inicialização. Aguarde um momento...</p>
      <div class="loader"></div>
      <p>
        Esta página será atualizada automaticamente quando o servidor estiver pronto.
        <br>Última atualização: ${new Date().toLocaleTimeString()}
      </p>
    </body>
    </html>
  `);
});

// Iniciar servidor HTTP
server.listen(PORT, HOST, () => {
  console.log(`Servidor temporário iniciado em http://${HOST}:${PORT}`);
  
  // Iniciar o servidor bridge usando CommonJS
  console.log('Iniciando servidor principal via server-bridge.cjs...');
  
  const serverProcess = spawn('node', ['server-bridge.cjs'], {
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
  });
  
  // Gerenciar encerramento limpo
  process.on('SIGINT', () => {
    console.log('Recebido SIGINT. Encerrando processos...');
    serverProcess.kill('SIGINT');
    server.close();
  });
  
  process.on('SIGTERM', () => {
    console.log('Recebido SIGTERM. Encerrando processos...');
    serverProcess.kill('SIGTERM');
    server.close();
  });
});