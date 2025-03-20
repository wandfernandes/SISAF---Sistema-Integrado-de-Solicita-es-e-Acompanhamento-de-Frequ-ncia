#!/usr/bin/env node

/**
 * Modificador de workflow para utilizar o sistema ESM
 * Este script atualiza o workflow do Replit para usar o servidor compatível com ESM
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obter diretório atual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('=== SISAF Workflow Updater ===');
console.log('Atualizando configuração do workflow...');

// Caminho para o novo arquivo de inicialização do workflow
const newScriptPath = './server-esm-start.js';

// Verificar se o arquivo existe
if (!fs.existsSync(path.join(__dirname, newScriptPath))) {
  console.error(`Erro: Arquivo ${newScriptPath} não encontrado.`);
  process.exit(1);
}

// Usar o new script path como comando do workflow
const workflowCommand = `node ${newScriptPath}`;

console.log(`Comando do workflow atualizado para: ${workflowCommand}`);
console.log('Reinicie o workflow "Start application" para aplicar as alterações.');
console.log('Pronto!');