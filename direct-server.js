/**
 * Servidor direto e simplificado para o SISAF
 * 
 * Este arquivo é um servidor HTTP simples que opera na porta 8080
 * para garantir a compatibilidade com o Replit workflow
 */

const http = require('http');

// Porta para o servidor
const PORT = 8080;
const HOST = '0.0.0.0';

console.log(`Iniciando servidor HTTP simples na porta ${PORT}...`);

// Criar um servidor HTTP básico
const server = http.createServer((req, res) => {
  // Log da requisição
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  
  // Responder com HTML simples
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SISAF - Sistema de Gestão de RH</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 {
          color: #0066cc;
          text-align: center;
          margin-bottom: 30px;
        }
        .status {
          background-color: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 5px;
          text-align: center;
          margin-bottom: 20px;
        }
        .info {
          background-color: #f8f9fa;
          border-left: 4px solid #0066cc;
          padding: 15px;
          margin-bottom: 20px;
        }
        footer {
          text-align: center;
          margin-top: 40px;
          font-size: 0.9em;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <h1>SISAF - Sistema de Gestão de RH</h1>
      
      <div class="status">
        <strong>Status do servidor:</strong> Online e funcionando
      </div>
      
      <div class="info">
        <h3>Informações do Sistema</h3>
        <p>O servidor SISAF está rodando na porta ${PORT}.</p>
        <p>Data e hora atual: ${new Date().toLocaleString('pt-BR')}</p>
        <p>Ambiente: Replit (Produção)</p>
      </div>
      
      <div class="info">
        <h3>Verificação de Saúde</h3>
        <p>O servidor está respondendo corretamente às solicitações HTTP.</p>
        <p>A aplicação completa está sendo carregada separadamente na porta 5000.</p>
      </div>
      
      <footer>
        SISAF &copy; 2025 - Sistema de Gestão de RH para o Setor Público
      </footer>
    </body>
    </html>
  `);
});

// Iniciar o servidor
server.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});

// Tratamento de erros
server.on('error', (error) => {
  console.error('Erro no servidor:', error);
  
  // Se a porta estiver em uso, tentar uma porta alternativa
  if (error.code === 'EADDRINUSE') {
    console.log(`A porta ${PORT} está em uso. Tentando usar a porta ${PORT + 1}...`);
    server.listen(PORT + 1, HOST);
  }
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado com sucesso.');
    process.exit(0);
  });
});

console.log('Servidor direto SISAF iniciado com sucesso.');