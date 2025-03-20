const express = require('express');
const http = require('http');

const app = express();
const port = process.env.PORT || 5000;

// Basic middleware
app.use(express.json());

// Simple route that opens immediately
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>SISAF - Ambiente de Desenvolvimento</title>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: Arial, sans-serif; 
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
          }
          .card {
            border: 1px solid #ddd;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          h1 { color: #1a73e8; }
          h2 { color: #202124; margin-top: 30px; }
          pre { 
            background: #f5f5f5; 
            padding: 10px; 
            border-radius: 4px; 
            overflow-x: auto;
          }
          .status { 
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-weight: bold;
          }
          .status.success { background: #e6f4ea; color: #137333; }
          .status.pending { background: #fef7e0; color: #b06000; }
          .status.error { background: #fce8e6; color: #c5221f; }
        </style>
      </head>
      <body>
        <h1>SISAF - Sistema de Gestão</h1>
        
        <div class="card">
          <h2>Status do Servidor</h2>
          <p><span class="status success">ATIVO</span> Servidor está executando na porta ${port}</p>
          <p>Data e hora do servidor: ${new Date().toLocaleString()}</p>
        </div>

        <div class="card">
          <h2>Ambiente de Desenvolvimento</h2>
          <p>Esta é uma aplicação em React + Express que está em desenvolvimento.</p>
          <p>Para acessar a aplicação real, precisamos finalizar a configuração do ambiente.</p>
        </div>

        <div class="card">
          <h2>Próximos Passos</h2>
          <ol>
            <li>Resolver problemas de compatibilidade com ESM/TypeScript</li>
            <li>Configurar corretamente o ambiente para desenvolvimento</li>
            <li>Implementar recursos necessários para o sistema de licenças médicas</li>
          </ol>
        </div>
      </body>
    </html>
  `);
});

// Add a simple API endpoint for testing
app.get('/api/status', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    message: 'Servidor simples para fins de desenvolvimento'
  });
});

// Start the server
const server = http.createServer(app);
server.listen(port, '0.0.0.0', () => {
  console.log(`Servidor simples rodando em http://0.0.0.0:${port}`);
});