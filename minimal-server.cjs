/**
 * Servidor mínimo para Replit - porta 5000
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('Iniciando servidor mínimo na porta 5000');

// Iniciar o servidor da aplicação principal como processo separado
console.log('Iniciando aplicação principal...');
const appProcess = exec('npm run dev', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro na aplicação principal: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Stderr da aplicação principal: ${stderr}`);
  }
  console.log(`Stdout da aplicação principal: ${stdout}`);
});

// Redirecionar para a aplicação real na porta 3000
const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Refresh': '0;url=https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev'
  });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Redirecionamento</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .loader { 
            border: 5px solid #f3f3f3; 
            border-top: 5px solid #3498db; 
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
        </style>
      </head>
      <body>
        <h1>SISAF - Sistema de Gestão de RH</h1>
        <p>Redirecionando para o aplicativo principal...</p>
        <div class="loader"></div>
        <p>Se você não for redirecionado automaticamente, 
           <a href="https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev">clique aqui</a>.
        </p>
      </body>
    </html>
  `);
});

// Tratamento de erros no servidor
server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});

// Iniciar o servidor na porta 5000
server.listen(5000, '0.0.0.0', () => {
  console.log('Servidor rodando na porta 5000');
});

// Registro de processo
console.log('PID do servidor:', process.pid);
console.log('PID da aplicação principal:', appProcess.pid);

// Tratar encerramento
process.on('SIGINT', () => {
  console.log('Encerrando servidor...');
  server.close();
  
  if (appProcess) {
    console.log('Encerrando aplicação principal...');
    appProcess.kill();
  }
  
  process.exit(0);
});