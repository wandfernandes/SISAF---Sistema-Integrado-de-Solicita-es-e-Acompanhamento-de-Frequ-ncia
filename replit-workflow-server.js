/**
 * Servidor HTTP básico para o workflow do Replit
 * Este servidor responde apenas na porta 8080 para garantir
 * que o Replit possa detectar que a aplicação está rodando.
 */

const http = require('http');
const PORT = 8080;
const HOST = '0.0.0.0';

// Criar um servidor HTTP simples para responder na porta 8080
console.log(`Iniciando servidor HTTP na porta ${PORT}...`);

const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] Requisição recebida: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SISAF - Sistema Funcionando</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
          line-height: 1.6;
          margin: 0;
          padding: 40px;
          color: #333;
          background-color: #f8f9fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        h1 { 
          color: #0066cc; 
          margin-top: 0;
          font-size: 28px;
        }
        .status {
          background-color: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 5px;
          margin: 20px 0;
        }
        .info {
          background-color: #f8f9fa;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin-bottom: 20px;
        }
        .timestamp {
          font-size: 0.9em;
          color: #6c757d;
          text-align: right;
          margin-top: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SISAF - Sistema de Gestão de RH</h1>
        
        <div class="status">
          <strong>✅ Status do servidor:</strong> Online e funcionando
        </div>
        
        <div class="info">
          <h3>Informações do Servidor</h3>
          <p>O servidor SISAF está respondendo corretamente.</p>
          <p>Este é um servidor dedicado para o ambiente do Replit.</p>
        </div>
        
        <div class="timestamp">
          Última atualização: ${new Date().toLocaleString('pt-BR')}
        </div>
      </div>
    </body>
    </html>
  `);
});

// Iniciar o servidor na porta 8080
server.listen(PORT, HOST, () => {
  console.log(`Servidor workflow rodando em http://${HOST}:${PORT}`);
});

// Tratamento de erros do servidor
server.on('error', (err) => {
  console.error(`Erro no servidor: ${err.message}`);
  
  // Se a porta estiver em uso, tentar uma alternativa
  if (err.code === 'EADDRINUSE') {
    console.log(`A porta ${PORT} está em uso. Encerrando.`);
    process.exit(1);
  }
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  server.close(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(() => process.exit(0));
});