import * as http from 'http';

// Configurações do servidor
const PORT = 5000;
const HOST = '0.0.0.0';

// Cria um servidor HTTP muito simples
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Servidor TypeScript</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .card { background: #f8f9fa; border-radius: 8px; padding: 20px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
          h1 { color: #0056b3; }
          .loader { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.2); 
                   border-radius: 50%; border-top-color: #0056b3; animation: spin 1s ease infinite; 
                   margin-right: 10px; vertical-align: middle; }
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>SISAF - Sistema de Gestão de Pessoal</h1>
          <p><span class="loader"></span> O sistema principal está iniciando...</p>
          <p>Este servidor TypeScript simples foi carregado para manter a porta 5000 ativa.</p>
          <p>Data/hora: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
      </body>
    </html>
  `);
});

// Inicia o servidor na porta especificada
server.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] Servidor TypeScript simples rodando em http://${HOST}:${PORT}`);
});