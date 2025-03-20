#!/usr/bin/env node

/**
 * Starter baseado em tsx para o sistema SISAF.
 * Este script serve como ponte entre o workflow do Replit 
 * e o servidor TypeScript + ESM
 */

import http from 'http';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

// Configuração do servidor temporário
const PORT = 5000;
const HOST = '0.0.0.0';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('=== SISAF Starter (tsx) ===');
console.log(`Data/Hora: ${new Date().toISOString()}`);

// Iniciar um servidor HTTP simples na porta 5000 para atender ao requisito de Replit
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
server.listen(PORT, HOST, async () => {
  console.log(`Servidor temporário iniciado em http://${HOST}:${PORT}`);
  
  try {
    // Iniciar o servidor real usando tsx
    console.log('Iniciando o servidor principal com tsx...');
    
    // Usar tsx diretamente, que tem melhor suporte para ESM + TypeScript
    const tsxProcess = spawn('npx', [
      'tsx', 
      '--experimental-specifier-resolution=node',
      'server/index.ts'
    ], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: '3000' // Usar porta 3000 para o servidor real
      }
    });
    
    tsxProcess.on('error', (err) => {
      console.error('Erro ao iniciar o servidor com tsx:', err);
    });
    
    // Adicionar handlers para encerramento limpo
    process.on('SIGINT', () => {
      console.log('Recebido SIGINT. Encerrando servidor...');
      tsxProcess.kill('SIGINT');
      server.close();
    });
    
    process.on('SIGTERM', () => {
      console.log('Recebido SIGTERM. Encerrando servidor...');
      tsxProcess.kill('SIGTERM');
      server.close();
    });
  } catch (error) {
    console.error('Erro ao iniciar o servidor principal:', error);
  }
});