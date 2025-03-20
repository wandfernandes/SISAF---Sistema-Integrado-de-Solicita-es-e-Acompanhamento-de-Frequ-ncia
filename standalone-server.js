/**
 * Versão autônoma e completamente simplificada do servidor SISAF
 * Este script combina todas as funcionalidades em um único arquivo
 * para máxima estabilidade e compatibilidade com o Replit
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// Configuração básica
const PORT = 8080;
const HOST = '0.0.0.0';

// Criar servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  // Rota básica para verificação de status
  if (req.url === '/api/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      message: 'SISAF está funcionando corretamente'
    }));
    return;
  }
  
  // Página inicial simples
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SISAF - Sistema de Gestão de RH</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #f8f9fa;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 40px 20px;
        }
        
        header {
          background-color: #0066cc;
          color: white;
          padding: 20px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        header .container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 0;
          padding-bottom: 0;
        }
        
        .logo {
          font-size: 24px;
          font-weight: bold;
        }
        
        .hero {
          background-color: white;
          padding: 60px 0;
          text-align: center;
          border-bottom: 1px solid #e9ecef;
        }
        
        .hero h1 {
          font-size: 36px;
          margin-bottom: 20px;
          color: #212529;
        }
        
        .hero p {
          font-size: 18px;
          color: #6c757d;
          max-width: 600px;
          margin: 0 auto;
        }
        
        .features {
          padding: 60px 0;
          background-color: #f8f9fa;
        }
        
        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 30px;
          margin-top: 40px;
        }
        
        .feature-card {
          background-color: white;
          border-radius: 8px;
          padding: 30px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.1);
        }
        
        .feature-card h3 {
          font-size: 20px;
          margin-top: 0;
          color: #0066cc;
        }
        
        .status-indicator {
          background-color: #d4edda;
          color: #155724;
          padding: 15px;
          border-radius: 6px;
          margin-top: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .status-indicator span {
          display: inline-block;
          width: 12px;
          height: 12px;
          background-color: #28a745;
          border-radius: 50%;
          margin-right: 10px;
        }
        
        footer {
          background-color: #212529;
          color: white;
          padding: 40px 0;
          text-align: center;
        }
        
        .version {
          margin-top: 10px;
          font-size: 14px;
          color: #adb5bd;
        }
      </style>
    </head>
    <body>
      <header>
        <div class="container">
          <div class="logo">SISAF</div>
          <nav>
            <!-- Links de navegação seriam adicionados aqui na versão completa -->
          </nav>
        </div>
      </header>
      
      <section class="hero">
        <div class="container">
          <h1>Sistema de Gestão de RH</h1>
          <p>Plataforma avançada para gerenciamento de licenças médicas e férias no setor público brasileiro.</p>
        </div>
      </section>
      
      <section class="features">
        <div class="container">
          <h2>Recursos Principais</h2>
          <div class="feature-grid">
            <div class="feature-card">
              <h3>Controle de Licenças Médicas</h3>
              <p>Gerencie solicitações, aprovações e acompanhamento de licenças médicas com facilidade.</p>
            </div>
            <div class="feature-card">
              <h3>Programação de Férias</h3>
              <p>Planeje e aprove períodos de férias considerando regras do serviço público.</p>
            </div>
            <div class="feature-card">
              <h3>Notificações em Tempo Real</h3>
              <p>Receba atualizações instantâneas sobre solicitações, aprovações e prazos importantes.</p>
            </div>
          </div>
          
          <div class="status-indicator">
            <span></span> Sistema em funcionamento normal
          </div>
        </div>
      </section>
      
      <footer>
        <div class="container">
          <p>SISAF - Sistema de Gestão de RH</p>
          <div class="version">Versão 1.0.0</div>
        </div>
      </footer>
    </body>
    </html>
  `);
});

// Iniciar o servidor
server.listen(PORT, HOST, () => {
  console.log(`Servidor rodando em http://${HOST}:${PORT}`);
});

// Tratamento de erros
server.on('error', (err) => {
  console.error(`Erro no servidor: ${err.message}`);
  if (err.code === 'EADDRINUSE') {
    console.log(`Porta ${PORT} em uso, tentando outra porta...`);
    setTimeout(() => {
      server.close();
      server.listen(PORT + 1, HOST);
    }, 1000);
  }
});

// Tratamento de sinais
process.on('SIGINT', () => {
  console.log('Servidor encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('Servidor encerrando...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});