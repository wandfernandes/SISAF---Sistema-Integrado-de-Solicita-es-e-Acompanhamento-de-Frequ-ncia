/**
 * Servidor simples para health check do Replit
 * Este servidor apenas responde com status 200 para verificações do Replit
 * enquanto o aplicativo principal roda em outra porta (3000)
 */

const http = require('http');

// Imprimir informações importantes de diagnóstico
console.log('Iniciando health-check.cjs para o Replit...');
console.log('Porta de destino: 5000');
console.log('Ambiente node:', process.version);
console.log('Diretório de trabalho:', process.cwd());

// Criar servidor simples apenas para responder ao health check
const server = http.createServer((req, res) => {
  console.log(`Health check recebido: ${req.method} ${req.url}`);
  res.writeHead(200, { 
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  });
  res.end('healthy\n');
});

// Iniciar na porta 5000 - específica para o Replit detectar
const PORT = 5000;

// Função com retry para o caso de erro ao iniciar
function startServer(retries = 3) {
  try {
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor de health check rodando na porta ${PORT}`);
    });

    server.on('error', (err) => {
      console.error(`Erro no servidor health check:`, err);
      if (err.code === 'EADDRINUSE' && retries > 0) {
        console.log(`Porta ${PORT} em uso, tentando novamente em 1 segundo...`);
        setTimeout(() => {
          server.close();
          startServer(retries - 1);
        }, 1000);
      }
    });
  } catch (err) {
    console.error('Erro crítico ao iniciar servidor de health check:', err);
    if (retries > 0) {
      console.log(`Tentando novamente em 1 segundo... (${retries} tentativas restantes)`);
      setTimeout(() => startServer(retries - 1), 1000);
    }
  }
}

// Iniciar o servidor com retry
startServer();

// Manter o servidor rodando
process.on('SIGINT', () => {
  console.log('Encerrando servidor de health check...');
  server.close(() => {
    console.log('Servidor de health check encerrado.');
    process.exit(0);
  });
});