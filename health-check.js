/**
 * Servidor simples para health check do Replit
 * Este servidor apenas responde com status 200 para verificações do Replit
 * enquanto o aplicativo principal roda em outra porta (5000)
 */
import http from 'http';

const PORT = process.env.PORT || 8080;

function startServer(retries = 3) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SISAF - Health Check</title>
          <meta http-equiv="refresh" content="0;url=http://localhost:5000">
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          </style>
        </head>
        <body>
          <h2>SISAF está rodando na porta 5000</h2>
          <p>Redirecionando...</p>
          <script>
            window.location.href = "https://612bd855-c53d-4af8-8e72-ca5fbb756b8a-00-1zemyy3zklgc8.spock.replit.dev";
          </script>
        </body>
      </html>
    `);
  });

  server.on('error', (err) => {
    console.error(`Erro ao iniciar o servidor: ${err.message}`);
    if (err.code === 'EADDRINUSE' && retries > 0) {
      console.log(`Porta ${PORT} em uso, tentando novamente em 1 segundo...`);
      setTimeout(() => {
        server.close();
        startServer(retries - 1);
      }, 1000);
    }
  });

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor health check rodando em http://0.0.0.0:${PORT}`);
    console.log(`Redirecionando para a aplicação principal na porta 5000`);
  });
}

// Iniciar o servidor
startServer();

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  process.exit(0);
});