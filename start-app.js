#!/usr/bin/env node

/**
 * Inicializador da aplicação para SISAF
 * Este script inicia o servidor e o frontend
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('=== SISAF Application Starter ===');
console.log('Iniciando SISAF com server-bridge...');

// Caminho para o arquivo server-bridge.cjs
const bridgePath = path.resolve(__dirname, 'server-bridge.cjs');

// Função para iniciar o servidor
async function startServer() {
  try {
    // Iniciar o processo server-bridge.cjs
    const serverProcess = spawn('node', [bridgePath], {
      stdio: 'inherit',
      shell: true
    });

    // Lidar com eventos do processo
    serverProcess.on('error', (error) => {
      console.error('Erro ao iniciar o servidor:', error);
      process.exit(1);
    });

    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`O servidor encerrou com código: ${code}`);
        process.exit(code);
      }
    });

    // Configurar handlers para sinais do processo principal
    process.on('SIGINT', () => {
      console.log('Recebido SIGINT. Encerrando servidor...');
      serverProcess.kill('SIGINT');
    });

    process.on('SIGTERM', () => {
      console.log('Recebido SIGTERM. Encerrando servidor...');
      serverProcess.kill('SIGTERM');
    });

    // Manter o processo principal vivo
    await new Promise(() => {}); // Promessa que nunca resolve
  } catch (error) {
    console.error('Erro não tratado:', error);
    process.exit(1);
  }
}

// Iniciar o servidor
startServer().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});