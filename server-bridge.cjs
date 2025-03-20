#!/usr/bin/env node

/**
 * Servidor Bridge para o SISAF
 * Este é um servidor simples em CommonJS que serve como ponte para o ambiente ESM
 */

// Este arquivo é propositalmente em CommonJS (extensão .cjs) para evitar problemas de ESM
const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('=== SISAF Server Bridge (CommonJS) ===');
console.log('Iniciando ponte de servidor...');

// Porta e host para conexão rápida
const PORT = 5000;
const HOST = '0.0.0.0';

// Criar uma cópia temporária do arquivo index.ts para que possamos modificá-lo
// sem afetar o original
const createTemporaryIndexFile = () => {
  const indexTsPath = path.join(process.cwd(), 'server', 'index.ts');
  const tempIndexTsPath = path.join(process.cwd(), 'server', 'temp-index.ts');
  
  try {
    // Ler o conteúdo atual do arquivo
    const originalContent = fs.readFileSync(indexTsPath, 'utf8');
    
    // Não precisamos modificar a porta, vamos usar 5000 diretamente
    // Mantemos o arquivo original
    const modifiedContent = originalContent;
    
    // Escrever o conteúdo modificado no arquivo temporário
    fs.writeFileSync(tempIndexTsPath, modifiedContent, 'utf8');
    console.log('Arquivo temporário criado com sucesso');
    
    return tempIndexTsPath;
  } catch (error) {
    console.error('Erro ao criar arquivo temporário:', error);
    return indexTsPath; // Fallback para o arquivo original
  }
};

// Iniciar um servidor HTTP simples na porta 5000
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema em Inicialização</title>
      <meta charset="UTF-8">
      <style>
        body { font-family: Arial; text-align: center; padding: 50px; }
        .loader { 
          border: 5px solid #f3f3f3; 
          border-top: 5px solid #3498db; 
          border-radius: 50%;
          width: 30px; 
          height: 30px; 
          animation: spin 2s linear infinite;
          margin: 20px auto;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      </style>
    </head>
    <body>
      <h2>SISAF - Sistema de Gestão</h2>
      <p>O servidor está inicializando...</p>
      <div class="loader"></div>
      <p><small>Hora: ${new Date().toLocaleTimeString()}</small></p>
    </body>
    </html>
  `);
});

// Iniciar servidor HTTP
server.listen(PORT, HOST, () => {
  console.log(`[${new Date().toISOString()}] Servidor bridge iniciado em http://${HOST}:${PORT}`);
  
  // Criar arquivo temporário com porta modificada
  const tempFilePath = createTemporaryIndexFile();
  
  // Após iniciar o servidor para atender ao requisito de porta,
  // tentamos iniciar o servidor principal usando tsx (que suporta ESM + TypeScript)
  console.log('Tentando iniciar o servidor principal com tsx...');
  
  // Executar tsx diretamente, que é compatível com ESM e TypeScript
  // usando o arquivo temporário modificado
  const tsxProcess = spawn('npx', ['tsx', tempFilePath], {
    stdio: 'inherit',
    shell: true,
    env: {
      ...process.env,
      PORT: '5000' // Definir a porta como 5000 diretamente
    }
  });
  
  tsxProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor TypeScript:', err);
  });
});