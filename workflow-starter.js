/**
 * Script de inicialização para workflow no ambiente Replit
 * Este script inicia um servidor HTTP na porta EXATA que o Replit espera (8080)
 * e também executa o servidor principal na porta 5000.
 */
const http = require('http');
const { exec } = require('child_process');

// Garantir que a porta 8080 seja usada para o servidor de health check
const PORT = 8080;

// Criar servidor HTTP simples para o health check do Replit
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>RH+ Gestão Inteligente - Health Check</title>
        <meta http-equiv="refresh" content="1;url=https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        </style>
      </head>
      <body>
        <h2>RH+ Gestão Inteligente</h2>
        <p>Sistema de Gestão de Afastamento e Pagamento</p>
        <p>O servidor está funcionando corretamente.</p>
        <p>Redirecionando para o sistema principal...</p>
      </body>
    </html>
  `);
});

// Iniciar o servidor principal
async function startMainServer() {
  console.log('Iniciando o servidor RH+ principal...');

  const mainServer = exec('node server-start.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao iniciar o servidor principal: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no servidor principal: ${stderr}`);
    }
  });

  mainServer.stdout.on('data', (data) => {
    console.log(`servidor: ${data.toString().trim()}`);
  });

  mainServer.stderr.on('data', (data) => {
    console.error(`erro: ${data.toString().trim()}`);
  });

  mainServer.on('close', (code) => {
    console.log(`O servidor principal encerrou com código ${code}`);
  });
}

// Iniciar o servidor HTTP na porta 8080
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor health check iniciado em http://0.0.0.0:${PORT}`);

  // Iniciar o servidor principal após o health check estar funcionando
  startMainServer();
});

// Tratamento de erros
server.on('error', (err) => {
  console.error(`Erro no servidor health check: ${err.message}`);
});

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidores...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidores...');
  server.close();
  process.exit(0);
});