/**
 * Servidor de health check para o SISAF
 * 
 * Este servidor responde na porta 8080 para garantir que o Replit possa
 * verificar que a aplicação está rodando corretamente
 */

const http = require('http');
const PORT = 8080;
const HOST = '0.0.0.0';

console.log(`Iniciando servidor de health check na porta ${PORT}...`);

// Criar um servidor HTTP simples
const server = http.createServer((req, res) => {
  // Adicionar headers para CORS
  res.writeHead(200, {
    'Content-Type': 'text/html',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  
  // Criar uma página HTML simples
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Sistema de Gestão</title>
        <meta charset="UTF-8">
        <meta http-equiv="refresh" content="5;url=https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev">
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
      </head>
      <body>
        <h2>SISAF - Sistema de Gestão</h2>
        <p>Redirecionando para o servidor principal...</p>
        <div class="loader"></div>
        <p><small>Se você não for redirecionado automaticamente, <a href="https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev">clique aqui</a>.</small></p>
        <hr>
        <p><small>Servidor de health check: Online</small></p>
        <p><small>Porta: ${PORT}</small></p>
        <p><small>Hora: ${new Date().toLocaleTimeString()}</small></p>
      </body>
    </html>
  `);
});

// Iniciar o servidor
server.listen(PORT, HOST, () => {
  console.log(`Health check server rodando em http://${HOST}:${PORT}`);
});

// Tratamento de erros
server.on('error', (err) => {
  console.error('Erro no servidor de health check:', err);
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Encerrando servidor de health check...');
  server.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor de health check...');
  server.close();
  process.exit(0);
});