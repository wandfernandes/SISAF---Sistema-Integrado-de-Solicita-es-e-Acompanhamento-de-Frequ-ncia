/**
 * Inicializador combinado para o workflow do Replit
 * Este arquivo inicia o servidor HTTP na porta 5000 e o servidor principal
 * 
 * Isso assegura que o Replit possa detectar que o aplicativo está rodando
 * enquanto o servidor principal roda em sua porta configurada
 */

import { createServer } from 'http';
import { exec } from 'child_process';

// Cria o servidor de saúde para o workflow
const healthServer = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end('<h1>SISAF - Health Check Server</h1><p>Sistema ativo e funcionando.</p>');
});

// Inicia o servidor de saúde
try {
  const PORT = 5000;
  
  healthServer.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Porta ${PORT} já está em uso.`);
    } else {
      console.error(`Erro ao iniciar servidor na porta ${PORT}:`, e);
    }
  });
  
  healthServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de saúde rodando na porta ${PORT}`);
    
    // Após iniciar o servidor de saúde, inicia o servidor principal
    startMainServer();
  });
} catch (error) {
  console.error('Erro crítico ao iniciar servidor de saúde:', error);
  process.exit(1);
}

// Função para iniciar o servidor principal
function startMainServer() {
  console.log('Iniciando o servidor principal...');
  
  const mainProcess = exec('nodemon --exec "tsx" server/index.ts');
  
  mainProcess.stdout.on('data', (data) => {
    console.log(`[SERVIDOR PRINCIPAL]: ${data}`);
  });
  
  mainProcess.stderr.on('data', (data) => {
    console.error(`[ERRO SERVIDOR PRINCIPAL]: ${data}`);
  });
  
  mainProcess.on('close', (code) => {
    console.log(`Servidor principal encerrado com código ${code}`);
    process.exit(code);
  });
}

// Captura sinais para encerrar adequadamente
process.on('SIGINT', () => {
  console.log('Encerrando servidores...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidores...');
  process.exit(0);
});