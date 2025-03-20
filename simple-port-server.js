/**
 * Servidor HTTP simplificado para o SISAF no ambiente Replit
 * Esta versão usa apenas Node.js nativo para máxima compatibilidade
 */

const http = require('http');
const { spawn } = require('child_process');
const PORT = 8080;

// Criar servidor HTTP simples na porta 8080
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema Online</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 0; 
          padding: 20px; 
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        h1 { color: #0066cc; }
        .status { 
          background-color: #d4edda; 
          color: #155724; 
          padding: 10px; 
          border-radius: 4px;
          margin: 15px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SISAF - Sistema de Gestão de RH</h1>
        <div class="status">
          ✅ Servidor em execução
        </div>
        <p>O SISAF está rodando em segundo plano.</p>
        <p>Para acessar o sistema, use <a href="/api/status" target="_blank">este link</a>.</p>
        <p>Data/hora atual: ${new Date().toLocaleString('pt-BR')}</p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar o servidor na porta especificada
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de compatibilidade rodando na porta ${PORT}`);
  
  // Iniciar o servidor principal em segundo plano
  console.log('Iniciando servidor SISAF em segundo plano...');
  
  // Usar um comando básico para iniciar o servidor principal
  const child = spawn('node', ['server/index.js'], {
    env: { ...process.env, PORT: '5000' },
    stdio: 'inherit'
  });
  
  child.on('error', (err) => {
    console.error(`Erro ao iniciar o servidor principal: ${err}`);
  });
  
  child.on('exit', (code) => {
    console.log(`O servidor principal encerrou com código: ${code}`);
  });
});

// Tratar erros do servidor
server.on('error', (err) => {
  console.error(`Erro no servidor: ${err}`);
  if (err.code === 'EADDRINUSE') {
    console.log(`A porta ${PORT} já está em uso. Tente usar outra porta.`);
    process.exit(1);
  }
});