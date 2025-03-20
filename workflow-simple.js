/**
 * Servidor HTTP ultra-simples para o ambiente Replit
 * 
 * Este arquivo cria um servidor web básico que responde na porta 8080
 * para garantir compatibilidade com o workflow do Replit.
 */

const http = require('http');
const { exec } = require('child_process');

// Porta para o servidor web (configurada pelo workflow do Replit)
const PORT = process.env.PORT || 8080;

// Criar um servidor HTTP simples
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Sistema de Gestão de RH</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px; 
            max-width: 800px;
            margin: 0 auto;
            line-height: 1.6;
          }
          h1 { color: #0066cc; }
          .status { 
            background-color: #e6f7ff; 
            border-left: 4px solid #0066cc;
            padding: 15px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 40px;
            color: #666;
            font-size: 0.9em;
            text-align: center;
            border-top: 1px solid #eee;
            padding-top: 20px;
          }
        </style>
      </head>
      <body>
        <h1>SISAF - Sistema de Gestão de RH</h1>
        <div class="status">
          <p><strong>Status:</strong> O sistema está funcionando.</p>
          <p>Data/hora atual: ${new Date().toLocaleString('pt-BR')}</p>
        </div>
        <p>
          O SISAF é um sistema avançado de gerenciamento de recursos humanos 
          para o setor público, especializado em:
        </p>
        <ul>
          <li>Gerenciamento de licenças médicas</li>
          <li>Controle de férias</li>
          <li>Notificações em tempo real</li>
          <li>Integração com sistema SEI</li>
        </ul>
        <div class="footer">
          SISAF v1.0.0 - Desenvolvido para o setor público brasileiro
        </div>
      </body>
    </html>
  `);
});

// Iniciar o servidor principal
function startMainServer() {
  console.log('Iniciando o servidor SISAF principal...');
  const mainServer = exec('node server-start.js', (error, stdout, stderr) => {
    if (error) {
      console.error(`Erro ao iniciar o servidor principal: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Erro no servidor principal: ${stderr}`);
      return;
    }
    console.log(`Saída do servidor principal: ${stdout}`);
  });

  mainServer.stdout.on('data', (data) => {
    console.log(`servidor: ${data}`);
  });

  mainServer.stderr.on('data', (data) => {
    console.error(`erro: ${data}`);
  });

  mainServer.on('close', (code) => {
    console.log(`O servidor principal encerrou com código ${code}`);
  });
}

// Iniciar o servidor na porta especificada
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor workflow rodando em http://0.0.0.0:${PORT}`);
  
  // Iniciar o servidor principal após iniciar o servidor de workflow
  startMainServer();
});

// Tratamento de erros do servidor
server.on('error', (err) => {
  console.error(`Erro no servidor: ${err.message}`);
  
  if (err.code === 'EADDRINUSE') {
    console.log(`A porta ${PORT} está em uso. Tentando porta alternativa...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1, '0.0.0.0');
    }, 1000);
  }
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Recebido SIGINT. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Recebido SIGTERM. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});