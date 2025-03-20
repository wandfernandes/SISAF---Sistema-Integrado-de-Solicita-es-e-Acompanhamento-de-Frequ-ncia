/**
 * Script para diagnóstico de rede
 * Este script verifica a configuração de rede e as portas disponíveis no ambiente
 */

import http from 'http';
import net from 'net';
import os from 'os';

// Função para verificar se uma porta está em uso
function checkPort(port, hostname = '0.0.0.0') {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Porta ${port} já está em uso por outro processo`);
        resolve(false);
      } else {
        console.error(`Erro ao verificar porta ${port}:`, err);
        resolve(false);
      }
    });
    
    server.once('listening', () => {
      server.close();
      console.log(`Porta ${port} está disponível`);
      resolve(true);
    });
    
    server.listen(port, hostname);
  });
}

// Criar servidor básico para teste de conectividade
function createTestServer(port) {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Diagnóstico de rede OK');
  });
  
  server.on('error', (err) => {
    console.error(`Erro ao iniciar servidor de teste:`, err);
  });
  
  server.listen(port, '0.0.0.0', () => {
    const { address, port } = server.address();
    console.log(`Servidor de teste rodando em http://${address}:${port}`);
    console.log(`Para testar acesso externo, verifique se a URL do Replit está funcionando`);
    
    // Exibir informações de rede
    if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
      console.log(`URL Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    }
  });
  
  return server;
}

// Exibir informações do ambiente
function showEnvironmentInfo() {
  console.log('\n=== Informações do Ambiente ===');
  console.log(`Node.js: ${process.version}`);
  console.log(`Platform: ${process.platform}`);
  console.log(`PID: ${process.pid}`);
  
  // Variáveis de ambiente relevantes
  const envVars = ['PORT', 'NODE_ENV', 'REPL_SLUG', 'REPL_OWNER', 'REPL_ID', 'REPLIT_DEV_DOMAIN'];
  console.log('\n=== Variáveis de Ambiente ===');
  envVars.forEach(name => {
    console.log(`${name}: ${process.env[name] || 'não definido'}`);
  });
  
  // Interfaces de rede
  console.log('\n=== Interfaces de Rede ===');
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(iface => {
      if (iface.family === 'IPv4') {
        console.log(`${name}: ${iface.address}`);
      }
    });
  });
}

// Função principal
async function main() {
  console.log('=== Diagnóstico de Rede ===');
  showEnvironmentInfo();
  
  // Verificar portas comuns
  console.log('\n=== Verificação de Portas ===');
  await checkPort(3000);
  await checkPort(5000);
  await checkPort(8080);
  
  // Iniciar servidor de teste na porta 5000
  const testServer = createTestServer(5000);
  
  // Encerrar após 60 segundos
  setTimeout(() => {
    console.log('\nEncerrando diagnóstico...');
    testServer.close();
  }, 60000);
}

main().catch(err => {
  console.error('Erro no diagnóstico:', err);
});