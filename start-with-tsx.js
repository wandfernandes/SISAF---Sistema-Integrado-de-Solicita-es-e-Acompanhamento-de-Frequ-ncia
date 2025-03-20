#!/usr/bin/env node

/**
 * Este script é uma alternativa para iniciar o servidor TypeScript 
 * sem a necessidade de modificar o package.json
 * 
 * Ele substitui o comando "ts-node --project tsconfig.node.json" para usar
 * o comando tsx que é compatível com ESM
 */

const { execSync } = require('child_process');
const { spawn } = require('child_process');

console.log('SISAF Server Starter - Iniciando com tsx');

// Tenta iniciar o servidor com tsx
try {
  console.log('Iniciando servidor com tsx...');
  
  const tsxProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: process.env.PORT || '3000'
    }
  });
  
  tsxProcess.on('error', (err) => {
    console.error('Erro ao iniciar servidor com tsx:', err);
    fallbackToNode();
  });
  
  tsxProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`Servidor tsx saiu com código ${code}`);
      fallbackToNode();
    }
  });
} catch (error) {
  console.error('Falha ao iniciar com tsx:', error);
  fallbackToNode();
}

// Função de fallback para tentar com node diretamente
function fallbackToNode() {
  try {
    console.log('Fallback: Tentando iniciar com node --loader...');
    
    const nodeProcess = spawn('node', ['--loader', 'ts-node/esm', 'server/index.ts'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        PORT: process.env.PORT || '3000'
      }
    });
    
    nodeProcess.on('error', (err) => {
      console.error('Erro ao iniciar com node fallback:', err);
    });
  } catch (fallbackError) {
    console.error('Falha ao iniciar com node fallback:', fallbackError);
  }
}