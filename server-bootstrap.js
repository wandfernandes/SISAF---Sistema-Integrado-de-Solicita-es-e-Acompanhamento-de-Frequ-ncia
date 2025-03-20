/**
 * SISAF Server Bootstrap
 * Este script é responsável por iniciar rapidamente um servidor temporário
 * enquanto o servidor principal TypeScript está sendo compilado.
 */

const http = require('http');
const { spawn } = require('child_process');

// Este arquivo deve ser executado com ESM, pois os módulos do projeto usam ESM

// Função para iniciar um servidor HTTP temporário na porta 5000
async function startTempServer() {
  const PORT = 5000;
  const HOST = '0.0.0.0';
  
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>SISAF - Inicializando</title>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .loader { 
            border: 5px solid #f3f3f3; 
            border-top: 5px solid #3498db; 
            border-radius: 50%;
            width: 40px; 
            height: 40px; 
            animation: spin 1.5s linear infinite;
            margin: 20px auto;
          }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
        <script>
          // Verificar o servidor principal a cada 2 segundos
          setTimeout(() => {
            window.location.reload();
          }, 3000);
        </script>
      </head>
      <body>
        <h2>SISAF - Sistema de Gestão</h2>
        <p>O servidor está inicializando, por favor aguarde...</p>
        <div class="loader"></div>
        <p><small>Inicialização em progresso. Isso pode levar alguns instantes.</small></p>
        <p><small>Horário do servidor: ${new Date().toLocaleTimeString()}</small></p>
      </body>
      </html>
    `);
  });
  
  return new Promise((resolve) => {
    server.listen(PORT, HOST, () => {
      console.log(`[${new Date().toISOString()}] Servidor temporário iniciado em http://${HOST}:${PORT}`);
      resolve(server);
    });
  });
}

// Função para iniciar o servidor real usando tsx
function startRealServer() {
  console.log('Iniciando servidor principal com tsx...');
  
  // Definir a porta 3000 para o servidor principal, enquanto o bridge permanece na 5000
  const env = { ...process.env, PORT: '3000' };
  
  const tsxProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true,
    env
  });
  
  tsxProcess.on('error', (err) => {
    console.error('Erro ao iniciar o servidor TypeScript:', err);
  });
  
  return tsxProcess;
}

// Função principal para gerenciar a inicialização coordenada dos servidores
async function bootstrap() {
  console.log('=== SISAF Server Bootstrap (ESM) ===');
  
  // Iniciar o servidor temporário primeiro
  const tempServer = await startTempServer();
  
  // Em seguida, iniciar o servidor real
  const realServer = startRealServer();
  
  // Configurar um proxy reverso quando o servidor real estiver pronto
  // Por enquanto, vamos manter o servidor temporário
}

// Iniciar o bootstrap
bootstrap().catch(err => {
  console.error('Erro no bootstrap:', err);
  process.exit(1);
});