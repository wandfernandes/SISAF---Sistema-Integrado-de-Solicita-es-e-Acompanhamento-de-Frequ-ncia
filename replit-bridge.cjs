/**
 * Ponte para integrações Replit
 * Este arquivo cria um servidor na porta 5000 (que o Replit espera) 
 * e proxy para o servidor principal na porta 3000
 */

const http = require('http');
const httpProxy = require('http-proxy');

// Criar proxy para redirecionar da porta 5000 para 3000
const proxy = httpProxy.createProxyServer({});

// Configurar porta para o Replit
const PORT = 5000;
const TARGET_PORT = 3000;

// Criar servidor de ponte
const server = http.createServer((req, res) => {
  // Para health checks, responde diretamente
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'ok', 
      bridge: true,
      timestamp: new Date().toISOString(),
      message: 'SISAF está rodando normalmente'
    }));
    return;
  }
  
  // Para todos os outros endpoints, faz proxy para a porta 3000
  proxy.web(req, res, { 
    target: `http://localhost:${TARGET_PORT}`,
    ws: true
  }, (err) => {
    console.error('Erro no proxy:', err);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy error', message: err.message }));
  });
});

// Também proxy WebSocket
server.on('upgrade', (req, socket, head) => {
  proxy.ws(req, socket, head, { 
    target: `http://localhost:${TARGET_PORT}`,
    ws: true
  }, (err) => {
    console.error('Erro no proxy WebSocket:', err);
    socket.end();
  });
});

// Iniciar o servidor
console.log(`Iniciando servidor de ponte na porta ${PORT} -> ${TARGET_PORT}...`);

// Iniciar servidor somente depois que o servidor principal estiver rodando
setTimeout(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de ponte rodando na porta ${PORT} -> ${TARGET_PORT}`);
  });
  
  server.on('error', (err) => {
    console.error('Erro ao iniciar o servidor de ponte:', err);
  });
}, 5000); // 5 segundos de delay para garantir que o servidor principal já esteja rodando