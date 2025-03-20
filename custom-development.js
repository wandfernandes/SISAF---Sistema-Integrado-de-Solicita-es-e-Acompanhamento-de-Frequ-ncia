/**
 * Script personalizado para iniciar o servidor de desenvolvimento
 * com as configurações adequadas para o ambiente Replit.
 */

// Configura as variáveis de ambiente para desenvolvimento
process.env.NODE_ENV = 'development';

// Porta fixa para o servidor
process.env.PORT = 5000;

// Inicia o servidor com os argumentos corretos
const { spawn } = require('child_process');
const server = spawn('tsx', ['server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Adiciona flags adicionais para depuração se necessário
    DEBUG: '*',
  }
});

server.on('error', (err) => {
  console.error('Erro ao iniciar o servidor:', err);
  process.exit(1);
});

console.log('Servidor de desenvolvimento iniciado. Aguarde o carregamento completo...');