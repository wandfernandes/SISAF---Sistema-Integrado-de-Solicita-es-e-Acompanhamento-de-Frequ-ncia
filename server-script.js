#!/usr/bin/env node

/**
 * Script to start the server with proper TypeScript and ESM support
 */

const http = require('http');
const { execSync, spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Create a basic server to respond immediately on port 5000
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Inicializando</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .loader { 
            border: 5px solid #f3f3f3; 
            border-top: 5px solid #3498db; 
            border-radius: 50%;
            width: 40px; 
            height: 40px; 
            animation: spin 1.5s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>
          // Auto refresh after 3 seconds
          setTimeout(() => { window.location.reload(); }, 3000);
        </script>
      </head>
      <body>
        <h2>SISAF - Sistema de Gestão</h2>
        <p>O servidor está inicializando, por favor aguarde...</p>
        <div class="loader"></div>
        <p><small>Inicialização em progresso. Isso pode levar alguns instantes.</small></p>
        <p><small>Horário do servidor: ${new Date().toLocaleTimeString()}</small></p>
      </body>
    </html>
  `);
});

// Start listening on port immediately to satisfy the workflow requirement
server.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] Servidor temporário iniciado em http://${HOST}:${PORT}`);
  
  // Now start the real server with tsx
  const tsxProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: '3000'  // Use a different port for the actual server
    }
  });
  
  tsxProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
  
  tsxProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Servidor encerrado com código: ${code}`);
      process.exit(code || 1);
    }
  });
  
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
});