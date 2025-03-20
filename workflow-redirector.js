/**
 * Script de redirecionamento simples para o ambiente Replit
 * Este script cria um servidor na porta 5000 que responde a solicitações
 * básicas para que o workflow do Replit possa detectar que o aplicativo está rodando
 */

import { createServer } from 'http';

// Criar um servidor simples na porta 5000
const server = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Redirecionamento</title>
        <meta http-equiv="refresh" content="0;url=https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev" />
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          .loader { border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; width: 50px; height: 50px; animation: spin 2s linear infinite; margin: 20px auto; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h1>SISAF - Sistema de Gestão de RH</h1>
        <p>Redirecionando para o aplicativo principal...</p>
        <div class="loader"></div>
        <p>Se você não for redirecionado automaticamente, <a href="https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev">clique aqui</a>.</p>
      </body>
    </html>
  `);
});

// Iniciar o servidor na porta 5000
const PORT = 5000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de redirecionamento rodando na porta ${PORT}`);
});

// Capturar sinais para encerramento adequado
process.on('SIGINT', () => {
  console.log('Encerrando servidor de redirecionamento...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor de redirecionamento...');
  server.close(() => process.exit(0));
});