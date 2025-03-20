/**
 * Proxy reverso para o SISAF
 * Este servidor atua como intermediário entre o cliente e o servidor principal
 */
const http = require('http');
const httpProxy = require('http-proxy');
const { exec } = require('child_process');

// Criar um proxy para redirecionar as requisições para a porta 5000
const proxy = httpProxy.createProxyServer({
  target: 'http://localhost:5000',
  ws: true // Suporte a WebSocket
});

// Porta para o servidor web (configurada pelo workflow do Replit)
const PORT = process.env.PORT || 8080;

// Criar um servidor HTTP que usa o proxy
const server = http.createServer((req, res) => {
  // Modificar o cabeçalho host para evitar o bloqueio
  req.headers.host = 'localhost:5000';
  
  // Encaminhar a requisição para o servidor na porta 5000
  proxy.web(req, res, {}, (err) => {
    if (err) {
      console.error('Erro no proxy:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Erro no proxy');
    }
  });
});

// Suporte a WebSocket
server.on('upgrade', (req, socket, head) => {
  req.headers.host = 'localhost:5000';
  proxy.ws(req, socket, head);
});

// Iniciar o servidor na porta especificada
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor proxy rodando em http://0.0.0.0:${PORT}`);
  console.log(`Redirecionando para a aplicação principal na porta 5000`);
  
  // Iniciar o servidor principal
  startMainServer();
});

// Função para iniciar o servidor principal
function startMainServer() {
  console.log('Iniciando o servidor SISAF principal...');
  
  // Definir a porta do servidor principal como 5000
  process.env.PORT = '5000';
  
  // Iniciar o servidor principal usando tsx
  const mainServer = exec('PORT=5000 npx tsx server/index.ts', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao iniciar o servidor principal: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no servidor principal: ${stderr}`);
    }
    console.log(`Saída do servidor principal: ${stdout}`);
  });

  // Capturar a saída padrão do servidor principal
  mainServer.stdout.on('data', (data) => {
    console.log(`servidor: ${data}`);
  });

  // Capturar os erros do servidor principal
  mainServer.stderr.on('data', (data) => {
    console.error(`erro: ${data}`);
  });

  // Lidar com o encerramento do servidor principal
  mainServer.on('close', (code) => {
    console.log(`O servidor principal encerrou com código ${code}`);
  });
}

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  process.exit(0);
});