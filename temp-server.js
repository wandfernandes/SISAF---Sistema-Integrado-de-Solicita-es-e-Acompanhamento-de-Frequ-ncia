// Servidor temporário para responder na porta 5000 durante startup
// Este arquivo funciona em ambos modos: CommonJS e ESM

(function() {
  // Verifica se estamos em ambiente ESM ou CommonJS
  const isESM = typeof require === 'undefined';
  
  // Carrega o módulo http com base no ambiente
  let http;
  if (isESM) {
    import('http').then((httpModule) => {
      http = httpModule.default;
      startServer();
    });
  } else {
    http = require('http');
    startServer();
  }
  
  // Inicia o servidor HTTP simples
  function startServer() {
    const PORT = 5000;
    const HOST = '0.0.0.0';
    
    console.log('Iniciando servidor temporário...');
    
    const server = http.createServer((req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>SISAF - Servidor Temporário</title>
            <style>
              body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
              .container { background: #f8f9fa; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              h1 { color: #0056b3; }
              .spinner { display: inline-block; width: 25px; height: 25px; border: 3px solid rgba(0,0,0,.3); border-radius: 50%; border-top-color: #0056b3; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
              @keyframes spin { to { transform: rotate(360deg); } }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>SISAF - Sistema de Gestão</h1>
              <p><span class="spinner"></span> O sistema principal está sendo carregado...</p>
              <p>Este é um servidor temporário para manter a porta 5000 ativa.</p>
              <p>Data/hora: ${new Date().toLocaleString('pt-BR')}</p>
            </div>
          </body>
        </html>
      `);
    });
    
    server.listen(PORT, HOST, () => {
      console.log(`[${new Date().toISOString()}] Servidor temporário rodando em http://${HOST}:${PORT}`);
    });
    
    // Tratamento de encerramento
    process.on('SIGINT', () => {
      server.close(() => {
        console.log('Servidor temporário encerrado');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      server.close(() => {
        console.log('Servidor temporário encerrado');
        process.exit(0);
      });
    });
  }
})();