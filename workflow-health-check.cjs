/**
 * Servidor de saúde leve para o workflow do Replit (CommonJS)
 */

const http = require('http');

// Cria um servidor HTTP simples que responde na porta 5000
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end('<h1>SISAF - Health Check</h1><p>Sistema operacional</p>');
});

// Porta exigida pelo workflow do Replit
const PORT = 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de saúde rodando na porta ${PORT}`);
});

// Manter o processo em execução
process.stdin.resume();

// Tratamento para encerramento limpo
process.on('SIGINT', () => {
  console.log('Encerrando servidor de saúde...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor de saúde...');
  server.close(() => process.exit(0));
});