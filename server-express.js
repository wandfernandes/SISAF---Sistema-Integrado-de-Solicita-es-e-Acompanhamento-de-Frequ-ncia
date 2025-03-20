const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware básico
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Rota para verificação do servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverTime: new Date().toISOString(),
    message: 'Servidor está funcionando'
  });
});

// Rota para status do CID
app.get('/api/cid-status', (req, res) => {
  res.json({
    status: 'ok',
    feature: 'cid',
    active: true,
    availableFields: ['cidCode', 'cidDescription', 'cidRestricted'],
    validationRules: {
      format: 'A00.0',
      minLength: 3,
      maxLength: 10,
      restricted: 'boolean'
    },
    lastUpdated: new Date().toISOString()
  });
});

// Rota para informações gerais
app.get('/api/info', (req, res) => {
  res.json({
    serverTime: new Date().toISOString(),
    appName: 'SISAF',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      cidControl: true,
      vacation: true,
      payments: true,
      notifications: true
    },
    activeRoutes: [
      '/api/health',
      '/api/cid-status',
      '/api/info'
    ]
  });
});

// Rota para a página inicial (serve arquivos estáticos)
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>SISAF - Sistema de Gestão</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          color: #333;
        }
        h1 { color: #1a73e8; }
        h2 { color: #174ea6; margin-top: 30px; }
        .card {
          border: 1px solid #dadce0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        .status {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
        }
        .status.success { background: #e6f4ea; color: #137333; }
        pre {
          background: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
        }
        .feature {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
        }
        .feature-icon {
          width: 24px;
          height: 24px;
          margin-right: 10px;
          background: #1a73e8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>SISAF - Sistema de Gestão</h1>
      
      <div class="card">
        <h2>Status do Servidor</h2>
        <p><span class="status success">ATIVO</span> Servidor está respondendo na porta ${PORT}</p>
        <p>Data e hora: ${new Date().toLocaleString('pt-BR')}</p>
      </div>

      <div class="card">
        <h2>Recursos Disponíveis</h2>
        
        <div class="feature">
          <div class="feature-icon">✓</div>
          <div>
            <strong>Controle de CID</strong>
            <p>Suporte completo para CID (Classificação Internacional de Doenças) com opção de confidencialidade</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">✓</div>
          <div>
            <strong>Férias</strong>
            <p>Gerenciamento de períodos aquisitivos e solicitação de férias</p>
          </div>
        </div>

        <div class="feature">
          <div class="feature-icon">✓</div>
          <div>
            <strong>Licenças Médicas</strong>
            <p>Controle de atestados e licenças com visibilidade baseada em perfil</p>
          </div>
        </div>
      </div>

      <div class="card">
        <h2>API</h2>
        <p>Endpoints disponíveis para teste:</p>
        <ul>
          <li><a href="/api/health">/api/health</a> - Verificação de saúde do servidor</li>
          <li><a href="/api/cid-status">/api/cid-status</a> - Status do recurso de CID</li>
          <li><a href="/api/info">/api/info</a> - Informações gerais do sistema</li>
        </ul>
      </div>
    </body>
    </html>
  `);
});

// Iniciar o servidor HTTP
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado em http://0.0.0.0:${PORT}`);
  console.log(`Data/Hora de início: ${new Date().toISOString()}`);
});