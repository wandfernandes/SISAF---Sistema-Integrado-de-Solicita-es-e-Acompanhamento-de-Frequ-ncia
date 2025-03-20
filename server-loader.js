/**
 * Script carregador para iniciar o servidor SISAF
 * Este script é projetado para resolver problemas de compatibilidade
 * entre o TypeScript e o ESM (ECMAScript Modules)
 */

const { spawn } = require('child_process');
const { resolve } = require('path');
const http = require('http');
const fs = require('fs');

// Configuração
const PORT = process.env.PORT || 5000;
const SERVER_FILE = resolve(__dirname, 'server/index.ts');

// Iniciar um servidor temporário para manter o Replit ativo
console.log('Iniciando servidor temporário...');
const tempServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Iniciando...</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .container { background-color: white; border-radius: 8px; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SISAF - Sistema Iniciando</h1>
        <div class="loader"></div>
        <p>O servidor está sendo carregado. Por favor, aguarde alguns instantes...</p>
        <p><small>Esta página será atualizada automaticamente quando o sistema estiver pronto.</small></p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar servidor temporário
tempServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor temporário iniciado em http://0.0.0.0:${PORT}`);
  
  // Verificar se o arquivo do servidor existe
  if (!fs.existsSync(SERVER_FILE)) {
    console.error(`ERRO: Arquivo do servidor não encontrado: ${SERVER_FILE}`);
    process.exit(1);
  }
  
  // Iniciar o servidor real usando TSX (que suporta TypeScript e ESM)
  console.log(`Iniciando servidor principal...`);
  const serverProcess = spawn('npx', [
    'tsx',
    SERVER_FILE
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });

  // Tratar eventos do processo do servidor
  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  });
  
  // Se o servidor principal terminar, encerrar também o servidor temporário
  serverProcess.on('exit', (code) => {
    console.log(`Servidor principal encerrado com código ${code}`);
    tempServer.close();
    process.exit(code || 0);
  });
});

// Tratar sinais de interrupção
process.on('SIGINT', () => {
  console.log('Recebido SIGINT, encerrando servidores...');
  tempServer.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM, encerrando servidores...');
  tempServer.close();
  process.exit(0);
});