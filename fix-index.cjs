/**
 * Solução temporária para iniciar o servidor em modo ESM
 * Este arquivo usa require() para rodar o servidor em modo CommonJS
 */
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cria um script temporário que inicia o servidor usando tsx
const startScript = `
#!/usr/bin/env node

// Usando tsx para executar o servidor TypeScript com suporte a ESM
const { exec } = require('child_process');
const serverProcess = exec('npx tsx server/index.ts', { env: { ...process.env, PORT: '3000' } });

serverProcess.stdout.on('data', (data) => {
  console.log(data.toString().trim());
});

serverProcess.stderr.on('data', (data) => {
  console.error(data.toString().trim());
});

serverProcess.on('close', (code) => {
  console.log(\`Server process exited with code \${code}\`);
});

console.log('Server process started with tsx');
`;

const tempScriptPath = path.join(__dirname, '..', 'temp-start-server.cjs');
fs.writeFileSync(tempScriptPath, startScript, 'utf8');
fs.chmodSync(tempScriptPath, '755');

console.log('Starting server with tsx...');

try {
  execSync(`node ${tempScriptPath}`, { stdio: 'inherit' });
} catch (error) {
  console.error('Failed to start server:', error);
  process.exit(1);
}