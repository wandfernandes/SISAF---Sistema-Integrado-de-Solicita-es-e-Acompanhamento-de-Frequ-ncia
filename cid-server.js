/**
 * Servidor ultra-simplificado para testes do componente CID
 * Este servidor é projetado para iniciar rapidamente e fornecer apenas
 * a funcionalidade mínima necessária para testar o componente CID
 */

const http = require('http');
const url = require('url');

// Dados CID de exemplo
const cidData = [
  { code: 'A00.0', description: 'Cólera (Vibrio cholerae)', restricted: false },
  { code: 'B20', description: 'Doença pelo HIV', restricted: true },
  { code: 'F32.0', description: 'Episódio depressivo leve', restricted: false },
  { code: 'F32.1', description: 'Episódio depressivo moderado', restricted: false },
  { code: 'F41.0', description: 'Transtorno de pânico', restricted: false },
  { code: 'M54.5', description: 'Dor lombar baixa', restricted: false },
  { code: 'Z73.0', description: 'Esgotamento', restricted: false },
];

// Categorias CID simplificadas
const categories = [
  { id: 'A-B', name: 'Doenças infecciosas' },
  { id: 'F', name: 'Transtornos mentais' },
  { id: 'M', name: 'Sistema osteomuscular' },
  { id: 'Z', name: 'Fatores que influenciam o estado de saúde' },
];

// Função para enviar resposta JSON
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

// Função para obter o corpo da requisição
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data = body ? JSON.parse(body) : {};
        resolve(data);
      } catch (error) {
        reject(error);
      }
    });
    
    req.on('error', error => {
      reject(error);
    });
  });
}

// Função para analisar parâmetros da URL
function parseQueryParams(reqUrl) {
  const parsedUrl = url.parse(reqUrl, true);
  return parsedUrl.query;
}

// Manipulador de requisições HTTP
async function requestHandler(req, res) {
  // Adicionar cabeçalhos CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Lidar com requisições OPTIONS (pré-voo CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const reqPath = url.parse(req.url).pathname;

  try {
    // Rota para verificação de saúde
    if (reqPath === '/api/health' && req.method === 'GET') {
      sendJSON(res, {
        status: 'ok',
        timestamp: new Date().toISOString(),
        message: 'CID API está funcionando'
      });
      return;
    }
    
    // Rota para buscar categorias CID
    if (reqPath === '/api/cid/categories' && req.method === 'GET') {
      sendJSON(res, categories);
      return;
    }
    
    // Rota para buscar CIDs
    if (reqPath === '/api/cid/search' && req.method === 'GET') {
      const params = parseQueryParams(req.url);
      const { query, category, showRestricted } = params;
      
      if (!query || query.length < 2) {
        sendJSON(res, []);
        return;
      }
      
      const showRestrictedBool = showRestricted === 'true';
      
      let results = cidData.filter(cid => {
        // Filtrar por texto
        const matchesQuery = 
          cid.code.toLowerCase().includes(query.toLowerCase()) || 
          cid.description.toLowerCase().includes(query.toLowerCase());
        
        // Filtrar por categoria
        const matchesCategory = !category || 
          (category && cid.code.charAt(0) >= category.charAt(0) && 
           cid.code.charAt(0) <= (category.includes('-') ? 
                               category.split('-')[1].charAt(0) : 
                               category.charAt(0)));
        
        // Filtrar por restrição
        const restrictionOk = showRestrictedBool || !cid.restricted;
        
        return matchesQuery && matchesCategory && restrictionOk;
      }).slice(0, 10);
      
      sendJSON(res, results);
      return;
    }
    
    // Rota para validar CID
    if (reqPath === '/api/cid/validate' && req.method === 'POST') {
      const body = await getRequestBody(req);
      const { code } = body;
      
      if (!code) {
        sendJSON(res, {
          valid: false,
          message: 'Código CID não fornecido'
        }, 400);
        return;
      }
      
      const cidRegex = /^[A-Z][0-9]{2}(\.[0-9])?$/;
      
      if (!cidRegex.test(code)) {
        sendJSON(res, {
          valid: false,
          message: 'Formato de código CID inválido'
        });
        return;
      }
      
      const cidExists = cidData.some(cid => cid.code === code);
      
      sendJSON(res, {
        valid: true,
        exists: cidExists,
        message: cidExists ? 'Código CID válido e encontrado' : 'Código CID válido, mas não encontrado na base'
      });
      return;
    }
    
    // Página inicial
    if (reqPath === '/' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>API CID</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
            h1 { color: #2c5282; }
            .card { background: #f7fafc; border-radius: 8px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            a { color: #4299e1; text-decoration: none; }
            a:hover { text-decoration: underline; }
            code { background: #edf2f7; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
            .success { background: #c6f6d5; color: #276749; padding: 4px 8px; border-radius: 4px; font-weight: bold; display: inline-block; }
          </style>
        </head>
        <body>
          <h1>API CID - Classificação Internacional de Doenças</h1>
          
          <div class="card">
            <h2>Status</h2>
            <p><span class="success">ATIVO</span> Servidor iniciado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Versão: 1.0.0</p>
          </div>
          
          <div class="card">
            <h2>API Endpoints</h2>
            <ul>
              <li><a href="/api/health">/api/health</a> - Verificação de saúde</li>
              <li><a href="/api/cid/categories">/api/cid/categories</a> - Lista categorias</li>
              <li><a href="/api/cid/search?query=dep">/api/cid/search?query=dep</a> - Busca CIDs</li>
              <li><code>POST /api/cid/validate</code> - Valida código CID</li>
            </ul>
          </div>
          
          <div class="card">
            <h2>Exemplos de CIDs</h2>
            <ul>
              ${cidData.map(cid => `<li><strong>${cid.code}</strong>: ${cid.description} ${cid.restricted ? '(restrito)' : ''}</li>`).join('')}
            </ul>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    // Rota não encontrada
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Rota não encontrada' }));
    
  } catch (error) {
    console.error('Erro no processamento da requisição:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Erro interno do servidor' }));
  }
}

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
const server = http.createServer(requestHandler);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor CID iniciado em http://0.0.0.0:${PORT}`);
  console.log(`Horário de início: ${new Date().toISOString()}`);
  // Garantir que a saída seja visível no log
  console.log('Servidor pronto para receber requisições');
});

// Timeout reduzido para garantir inicialização rápida
setTimeout(() => {
  console.log(`Servidor está rodando há 10 segundos`);
}, 10000);

// Encerramento gracioso do servidor
process.on('SIGTERM', () => {
  console.log('Sinal SIGTERM recebido. Encerrando servidor...');
  server.close(() => {
    console.log('Servidor encerrado');
    process.exit(0);
  });
});