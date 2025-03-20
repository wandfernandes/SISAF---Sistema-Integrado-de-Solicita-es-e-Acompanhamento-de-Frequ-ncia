/**
 * Servidor simples para o workflow do Replit
 * Esta versão simplificada é focada em garantir que o servidor esteja 
 * acessível através da interface do Replit
 */

const http = require('http');
const { spawn } = require('child_process');

// Definir porta para o servidor - usando a porta 8080 que é a padrão do Replit
const PORT = 8080;
const HOST = '0.0.0.0';

console.log(`Iniciando servidor simples na porta ${PORT}...`);

// Criar um servidor HTTP simples
const server = http.createServer((req, res) => {
  console.log(`Requisição recebida: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema em Funcionamento</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #0066cc; }
        .status { color: green; font-weight: bold; }
        .info { background-color: #f0f0f0; padding: 20px; border-radius: 5px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>SISAF - Sistema de Gestão de Pessoal</h1>
      <p>Status do servidor: <span class="status">Online</span></p>
      
      <div class="info">
        <p>Esta é uma página de verificação de funcionamento do servidor.</p>
        <p>O servidor está rodando na porta ${PORT}.</p>
        <p>Horário atual do servidor: ${new Date().toLocaleTimeString()}</p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar o servidor
server.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
  
  // Iniciar o servidor real em segundo plano (opcional)
  // Se quiser apenas verificar a acessibilidade do servidor simples,
  // comente o código abaixo.
  /*
  const realServer = spawn('node', ['server-start.js'], {
    stdio: 'inherit',
    detached: true
  });
  
  realServer.on('error', (err) => {
    console.error('Erro ao iniciar o servidor real:', err);
  });
  */
});

// Tratamento de erros
server.on('error', (err) => {
  console.error('Erro no servidor:', err);
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado com sucesso');
    process.exit(0);
  });
});