/**
 * Servidor de teste simplificado para o SISAF no ambiente Replit
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware para logging básico
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos
app.use(express.static(path.join(__dirname, 'client/dist')));

// Rota principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>SISAF - Sistema de Gestão de Licenças</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        h1 { color: #2c3e50; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .info { background: #f8f9fa; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
        .success { color: #28a745; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>SISAF - Sistema de Gestão de Licenças Médicas</h1>
        <div class="info">
          <p><strong>Status do Servidor:</strong> <span class="success">Online</span></p>
          <p><strong>Porta:</strong> ${process.env.PORT || 3000}</p>
          <p><strong>Ambiente:</strong> ${process.env.NODE_ENV || 'Desenvolvimento'}</p>
          <p><strong>Data e Hora:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div>
          <p>Bem-vindo ao SISAF - sistema para gerenciamento de:</p>
          <ul>
            <li>Licenças médicas</li>
            <li>Férias</li>
            <li>Notificações</li>
            <li>Aprovações</li>
          </ul>
          <p>O aplicativo está funcionando corretamente.</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// API de status
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

// Rota de captura para SPA
app.get('*', (req, res) => {
  res.redirect('/');
});

// Inicia o servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de teste rodando em http://0.0.0.0:${PORT}`);
  
  if (process.env.REPL_SLUG && process.env.REPL_OWNER) {
    console.log(`URL de acesso: https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co`);
  }

  // Verificar variáveis de ambiente
  console.log('\nVariáveis de ambiente:');
  console.log('NODE_ENV:', process.env.NODE_ENV || 'não definido');
  console.log('PORT:', process.env.PORT || 'não definido (usando 3000)');
  console.log('REPL_ID:', process.env.REPL_ID || 'não definido');
  console.log('REPL_SLUG:', process.env.REPL_SLUG || 'não definido');
  console.log('REPL_OWNER:', process.env.REPL_OWNER || 'não definido');
});