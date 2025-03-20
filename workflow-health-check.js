/**
 * Servidor de health check para o workflow do Replit
 * Este servidor responde a requisições na porta 8080
 */

import http from 'http';

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`Request recebida: ${req.url}`);
  
  // Redirecionar para a porta 5000
  res.writeHead(302, {
    'Location': 'https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev'
  });
  res.end();
});

// Iniciar o servidor na porta 8080 (porta padrão do Replit)
server.listen(8080, '0.0.0.0', () => {
  console.log('Servidor de health check rodando na porta 8080');
});

// Tratamento de erros
server.on('error', (error) => {
  console.error('Erro no servidor de health check:', error);
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Encerrando o servidor de health check...');
  server.close(() => {
    console.log('Servidor de health check encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Encerrando o servidor de health check por SIGTERM...');
  server.close(() => {
    console.log('Servidor de health check encerrado');
    process.exit(0);
  });
});