// Arquivo específico para o workflow do Replit
// Este script é responsável por iniciar o servidor para o workflow "Start application"

import http from 'http';
import express from 'express';
import { spawn } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Inicia o servidor para o workflow
 * @param {http.Server} http - O servidor HTTP
 */
function startServer(http) {
  try {
    console.log('=== Iniciando SISAF no Replit Workflow ===');
    console.log('Data/Hora:', new Date().toISOString());
    
    // Vamos usar o server-bridge.cjs para ter uma inicialização rápida
    // Este arquivo está em CommonJS e não tem problemas com ESM/TypeScript
    const serverProcess = spawn('node', ['server-bridge.cjs'], {
      stdio: 'inherit', 
      shell: true
    });
    
    serverProcess.on('error', (err) => {
      console.error('Erro ao iniciar o processo do servidor:', err);
    });
    
    serverProcess.on('exit', (code) => {
      if (code !== 0) {
        console.error(`O processo do servidor saiu com código: ${code}`);
      }
    });
    
    console.log('Servidor iniciado com sucesso!');
    
  } catch (error) {
    console.error('Erro ao iniciar o servidor no workflow:', error);
  }
}

export default startServer;