/**
 * Script para iniciar o servidor no ambiente Replit Workflow
 */
import { spawn } from 'child_process';
import { createServer } from 'http';

// Criar um pequeno servidor HTTP para manter a porta aberta enquanto TSX inicia
const tempServer = createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Iniciando servidor SISAF...');
});

tempServer.listen(5000, '0.0.0.0', () => {
  console.log('Servidor temporário iniciado na porta 5000');
  
  // Iniciar o servidor principal com tsx
  const serverProcess = spawn('npx', [
    'tsx',
    '--experimental-specifier-resolution=node',
    'server/index.ts'
  ], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '5000'
    }
  });

  serverProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor:', err);
    process.exit(1);
  });

  // Quando o servidor principal estiver pronto, fechar o servidor temporário
  setTimeout(() => {
    console.log('Fechando servidor temporário...');
    tempServer.close();
  }, 5000);
});