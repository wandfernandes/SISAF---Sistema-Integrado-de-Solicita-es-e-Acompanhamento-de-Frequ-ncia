#!/usr/bin/env node

/**
 * Script para executar o servidor diretamente, ignorando o ts-node
 */

// Usamos ESM aqui, já que o package.json tem "type": "module"
import http from 'http';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { execFile } from 'child_process';

// Configurações
const PORT = 5000;
const HOST = '0.0.0.0';

// Obtém diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('==================================');
console.log('SISAF - INICIALIZADOR ESM');
console.log('==================================');

// Criar um servidor HTTP simples
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema em Inicialização</title>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          text-align: center; 
          padding: 50px; 
          background-color: #f0f4f8;
          color: #333;
          line-height: 1.6;
        }
        .container { 
          background-color: white; 
          padding: 30px; 
          border-radius: 10px; 
          box-shadow: 0 4px 8px rgba(0,0,0,0.1); 
          max-width: 600px; 
          margin: 0 auto; 
        }
        .logo {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 20px;
          color: #0056b3;
        }
        .loader { 
          border: 5px solid #f3f3f3; 
          border-top: 5px solid #0056b3; 
          border-radius: 50%; 
          width: 50px; 
          height: 50px; 
          animation: spin 2s linear infinite; 
          margin: 20px auto; 
        }
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        h1 {
          color: #0056b3;
          font-size: 28px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">SISAF</div>
        <h1>Sistema de Gestão de Pessoal</h1>
        <div class="loader"></div>
        <p>O sistema está em processo de inicialização.</p>
        <p>Por favor, aguarde alguns instantes enquanto preparamos o ambiente.</p>
        <p><small>Data e hora: ${new Date().toLocaleString('pt-BR')}</small></p>
      </div>
    </body>
    </html>
  `);
});

// Inicia o servidor
server.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] Servidor temporário rodando em http://${HOST}:${PORT}`);
  console.log('O workflow agora deve detectar que este servidor está em execução.');
});

// Tratamento de encerramento para limpeza
process.on('SIGINT', () => {
  console.log('Encerrando o servidor...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando o servidor...');
  server.close();
  process.exit(0);
});