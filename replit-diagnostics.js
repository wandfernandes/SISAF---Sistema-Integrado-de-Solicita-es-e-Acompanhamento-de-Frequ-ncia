/**
 * Script de diagnóstico específico para o ambiente Replit
 * Verificando conexões e configurações para o SISAF
 */

import http from 'http';
import net from 'net';
import os from 'os';
import { execSync } from 'child_process';

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

// Verificar processos em execução
function checkRunningProcesses() {
  console.log('\n=== Processos em Execução ===');
  try {
    const processes = execSync('ps aux | grep node').toString();
    console.log(processes);
  } catch (error) {
    console.error('Erro ao verificar processos:', error.message);
  }
}

// Verificar portas em uso
function checkUsedPorts() {
  console.log('\n=== Portas em Uso ===');
  try {
    const ports = execSync('netstat -tunlp 2>/dev/null || ss -tunlp').toString();
    console.log(ports);
  } catch (error) {
    console.error('Erro ao verificar portas em uso:', error.message);
  }
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

// Testar conexão HTTP local
async function testLocalHttpConnections() {
  console.log('\n=== Teste de Conexões HTTP Locais ===');
  
  const portsToTest = [3000, 5000, 8080];
  
  for (const port of portsToTest) {
    try {
      const options = {
        hostname: 'localhost',
        port: port,
        path: '/',
        method: 'GET',
        timeout: 3000
      };
      
      await new Promise((resolve) => {
        const req = http.request(options, (res) => {
          console.log(`Porta ${port}: Conexão bem-sucedida (Status: ${res.statusCode})`);
          resolve();
        });
        
        req.on('error', (e) => {
          console.log(`Porta ${port}: Conexão falhou (${e.message})`);
          resolve();
        });
        
        req.on('timeout', () => {
          console.log(`Porta ${port}: Timeout na conexão`);
          req.destroy();
          resolve();
        });
        
        req.end();
      });
    } catch (error) {
      console.error(`Erro ao testar porta ${port}:`, error.message);
    }
  }
}

// Função principal
async function main() {
  console.log('=== Diagnóstico de Ambiente Replit para SISAF ===');
  showEnvironmentInfo();
  
  // Verificar portas comuns
  console.log('\n=== Verificação de Portas ===');
  await checkPort(3000);
  await checkPort(5000);
  await checkPort(8080);
  
  // Verificar processos e portas usadas
  checkRunningProcesses();
  checkUsedPorts();
  
  // Testar conexões HTTP
  await testLocalHttpConnections();
  
  console.log('\n=== URL de Acesso ===');
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`URL Replit: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
    console.log('Para testar, copie este URL e cole no navegador');
  } else {
    console.log('Ambiente Replit não detectado');
  }
  
  console.log('\n=== Diagnóstico Concluído ===');
}

main().catch(err => {
  console.error('Erro no diagnóstico:', err);
});