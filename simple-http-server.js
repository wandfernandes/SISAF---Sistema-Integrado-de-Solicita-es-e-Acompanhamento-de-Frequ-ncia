/**
 * Servidor HTTP simples para o ambiente Replit
 * 
 * Este servidor responde em duas portas:
 * - Porta 8080: Para satisfazer o requisito do Replit Workflow
 * - Porta 5000: Proxy reverso para o servidor principal
 */

const http = require('http');
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { spawn } = require('child_process');

// Configuração
const WORKFLOW_PORT = 8080;
const MAIN_PORT = 5000;
const HOST = '0.0.0.0';

// Criar servidor Express
const app = express();

// Página de status
app.get('/status', (req, res) => {
  res.send({
    status: 'online',
    timestamp: new Date().toISOString(),
    message: 'RH+ Gestão Inteligente está funcionando corretamente'
  });
});

// Configurar proxy para todas as outras rotas
app.use('/', createProxyMiddleware({
  target: `http://${HOST}:${MAIN_PORT}`,
  changeOrigin: true,
  ws: true,
  logLevel: 'debug'
}));

// Iniciar o servidor na porta do workflow
const server = app.listen(WORKFLOW_PORT, HOST, () => {
  console.log(`Servidor proxy iniciado em http://${HOST}:${WORKFLOW_PORT}`);
  console.log(`Redirecionando tráfego para http://${HOST}:${MAIN_PORT}`);

  // Iniciar o servidor principal
  startMainServer();
});

// Função para iniciar o servidor principal
function startMainServer() {
  console.log('Iniciando servidor principal...');

  const serverProcess = spawn('node', ['server-start.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: MAIN_PORT.toString()
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor principal:', err);
  });

  serverProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Servidor principal encerrado com código: ${code}`);
    }
  });

  // Tratar sinais para encerramento limpo
  process.on('SIGINT', () => {
    console.log('Encerrando servidor proxy e principal...');
    serverProcess.kill();
    server.close();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    console.log('Encerrando servidor proxy e principal...');
    serverProcess.kill();
    server.close();
    process.exit(0);
  });
}