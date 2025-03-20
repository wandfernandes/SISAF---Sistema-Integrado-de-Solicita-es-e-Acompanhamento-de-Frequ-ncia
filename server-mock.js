// Servidor simples para inicialização rápida
const http = require('http');
const PORT = 5000;

// Criar servidor básico que responde em todas as rotas
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Servidor em Inicialização</title>
        <style>
          body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .loading { display: flex; align-items: center; justify-content: center; margin: 30px 0; }
          .spinner { border: 4px solid #f3f3f3; border-top: 4px solid #3498db; border-radius: 50%; width: 30px; height: 30px; animation: spin 2s linear infinite; margin-right: 15px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <h1>SISAF - Sistema de Gestão de Pessoal</h1>
        <div class="loading">
          <div class="spinner"></div>
          <p>O servidor completo está sendo inicializado em segundo plano...</p>
        </div>
        <p>Este é um servidor temporário enquanto o aplicativo principal está sendo carregado.</p>
        <p>Data/hora atual: ${new Date().toLocaleString('pt-BR')}</p>
      </body>
    </html>
  `);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor temporário iniciado na porta ${PORT}`);
  
  // Possibilidade de iniciar o servidor real em um processo separado
  // Por enquanto, apenas mantemos o servidor temporário respondendo
});