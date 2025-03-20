/**
 * Script simples para fornecer uma resposta na porta 5000 para o health check do Replit
 * enquanto o servidor principal executa na porta 4000
 */

import http from 'http';

const PORT = 5000;

const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Healthy! (Servidor principal na porta 4000)');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de health check rodando na porta ${PORT}`);
});

// Tratamento de erros e encerramento gracioso
process.on('SIGINT', () => {
  console.log('Encerrando o servidor de health check...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando o servidor de health check...');
  server.close();
  process.exit(0);
});