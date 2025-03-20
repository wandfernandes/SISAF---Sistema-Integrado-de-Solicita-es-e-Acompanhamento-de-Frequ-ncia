/**
 * Script para verificação direta da acessibilidade do servidor no ambiente Replit
 */

const http = require('http');
const fs = require('fs');

// Criar uma página HTML simples para teste
const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>SISAF - Teste de Conectividade</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
    h1 { color: #2c3e50; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
    .info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    .success { color: #28a745; }
    .error { color: #dc3545; }
  </style>
</head>
<body>
  <div class="container">
    <h1>SISAF - Teste de Conectividade</h1>
    <div class="info">
      <p><strong>Status do Servidor:</strong> <span class="success">Online</span></p>
      <p><strong>Porta:</strong> 5000</p>
      <p><strong>Data e Hora:</strong> ${new Date().toLocaleString()}</p>
    </div>
    <div>
      <p>Este é um servidor de teste para verificar a conectividade no ambiente Replit.</p>
      <p>Se você está vendo esta página, significa que a configuração do servidor está funcionando corretamente.</p>
    </div>
  </div>
</body>
</html>
`;

// Criar um servidor HTTP na porta especificada pelo Replit
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(htmlContent);
});

// Usar a porta 5000, que é a porta padrão do Replit
const PORT = process.env.PORT || 5000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de teste rodando em http://0.0.0.0:${PORT}`);
  
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`URL de acesso: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }
  
  // Verificar as variáveis de ambiente do Replit
  console.log('\nVariáveis de ambiente Replit:');
  console.log('REPL_ID:', process.env.REPL_ID || 'não definido');
  console.log('REPL_SLUG:', process.env.REPL_SLUG || 'não definido');
  console.log('REPL_OWNER:', process.env.REPL_OWNER || 'não definido');
  console.log('REPLIT_DEV_DOMAIN:', process.env.REPLIT_DEV_DOMAIN || 'não definido');
  
  // Verificar as interfaces de rede disponíveis
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  
  console.log('\nInterfaces de rede:');
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4') {
        console.log(`${name}: ${net.address}`);
      }
    }
  }
});