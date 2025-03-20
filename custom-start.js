/**
 * Script para iniciar a aplicação SISAF no Replit
 * 
 * Este script é usado para:
 * 1. Iniciar um servidor HTTP temporário
 * 2. Executar o servidor real com tsx (para suporte TypeScript+ESM)
 */

const { spawn } = require('child_process');
const http = require('http');

// Configuração
const PORT = process.env.PORT || 5000;

// Iniciar servidor temporário
console.log('Iniciando servidor temporário na porta', PORT);
const tempServer = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Iniciando...</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 20px auto; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <h1>SISAF - Iniciando</h1>
      <div class="loader"></div>
      <p>O servidor está sendo carregado. Por favor, aguarde...</p>
    </body>
    </html>
  `);
});

// Iniciar o servidor temporário
tempServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor temporário iniciado em http://0.0.0.0:${PORT}`);
  
  // Iniciar o comando principal 'npm run dev'
  console.log('Iniciando servidor principal (npm run dev)...');
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: PORT.toString(),
      NODE_ENV: process.env.NODE_ENV || 'development'
    }
  });
  
  // Manipular erros do processo do servidor
  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor principal:', err);
    process.exit(1);
  });
  
  // Se o servidor principal terminar, encerrar também o servidor temporário
  serverProcess.on('exit', (code) => {
    console.log(`Servidor principal encerrado com código ${code}`);
    tempServer.close();
    process.exit(code || 0);
  });
});

// Manipular sinais de interrupção
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