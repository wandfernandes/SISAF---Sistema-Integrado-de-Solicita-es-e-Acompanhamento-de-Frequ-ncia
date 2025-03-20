const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Lista de códigos CID (simplificada para teste)
const cidData = [
  { code: 'A00.0', description: 'Cólera devida a Vibrio cholerae 01, biótipo cholerae', restricted: false },
  { code: 'B20', description: 'Doença pelo vírus da imunodeficiência humana [HIV] resultando em doenças infecciosas e parasitárias', restricted: true },
  { code: 'F32.0', description: 'Episódio depressivo leve', restricted: false },
  { code: 'F32.1', description: 'Episódio depressivo moderado', restricted: false },
  { code: 'F41.0', description: 'Transtorno de pânico [ansiedade paroxística episódica]', restricted: false },
  { code: 'F41.1', description: 'Ansiedade generalizada', restricted: false },
  { code: 'H53.4', description: 'Defeitos do campo visual', restricted: false },
  { code: 'J11.0', description: 'Influenza [gripe] com pneumonia, devida a vírus não identificado', restricted: false },
  { code: 'K29.7', description: 'Gastrite não especificada', restricted: false },
  { code: 'M54.5', description: 'Dor lombar baixa', restricted: false },
  { code: 'Z73.0', description: 'Esgotamento', restricted: false },
];

// Categorias de CID
const cidCategories = [
  { id: 'A-B', name: 'Doenças infecciosas e parasitárias' },
  { id: 'C-D', name: 'Neoplasias' },
  { id: 'E', name: 'Doenças endócrinas, nutricionais e metabólicas' },
  { id: 'F', name: 'Transtornos mentais e comportamentais' },
  { id: 'G', name: 'Doenças do sistema nervoso' },
  { id: 'H', name: 'Doenças dos olhos e anexos e do ouvido' },
  { id: 'I', name: 'Doenças do aparelho circulatório' },
  { id: 'J', name: 'Doenças do aparelho respiratório' },
  { id: 'K', name: 'Doenças do aparelho digestivo' },
  { id: 'L', name: 'Doenças da pele e do tecido subcutâneo' },
  { id: 'M', name: 'Doenças do sistema osteomuscular e tecido conjuntivo' },
  { id: 'N', name: 'Doenças do aparelho geniturinário' },
  { id: 'O', name: 'Gravidez, parto e puerpério' },
  { id: 'P', name: 'Afecções do período perinatal' },
  { id: 'Q', name: 'Malformações congênitas e anomalias cromossômicas' },
  { id: 'R', name: 'Sintomas, sinais e achados anormais de exames' },
  { id: 'S-T', name: 'Lesões, envenenamentos e causas externas' },
  { id: 'V-Y', name: 'Causas externas de morbidade e mortalidade' },
  { id: 'Z', name: 'Fatores que influenciam o estado de saúde' },
];

// Rota para buscar categorias de CID
app.get('/api/cid/categories', (req, res) => {
  res.json(cidCategories);
});

// Rota para buscar CIDs por código ou descrição
app.get('/api/cid/search', (req, res) => {
  const { query, category, showRestricted } = req.query;
  
  if (!query || query.length < 2) {
    return res.json([]);
  }
  
  const showRestrictedBool = showRestricted === 'true';
  
  let filteredCids = cidData.filter(cid => {
    // Filtrar por texto na descrição ou código
    const matchesQuery = 
      cid.code.toLowerCase().includes(query.toLowerCase()) || 
      cid.description.toLowerCase().includes(query.toLowerCase());
    
    // Filtrar por categoria se especificada
    const matchesCategory = !category || 
      (category && cid.code.charAt(0) >= category.charAt(0) && 
       cid.code.charAt(0) <= (category.includes('-') ? category.split('-')[1].charAt(0) : category.charAt(0)));
    
    // Filtrar CIDs restritos se não autorizado
    const restrictionOk = showRestrictedBool || !cid.restricted;
    
    return matchesQuery && matchesCategory && restrictionOk;
  });
  
  // Limitar a 10 resultados
  filteredCids = filteredCids.slice(0, 10);
  
  res.json(filteredCids);
});

// Rota para saúde do servidor
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API CID está funcionando'
  });
});

// Rota para validar um código CID
app.post('/api/cid/validate', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({
      valid: false,
      message: 'Código CID não fornecido'
    });
  }
  
  // Expressão regular para validar o formato do CID (por exemplo, A00.0 ou F32)
  const cidRegex = /^[A-Z][0-9]{2}(\.[0-9])?$/;
  
  if (!cidRegex.test(code)) {
    return res.json({
      valid: false,
      message: 'Formato de código CID inválido. O formato deve ser como "A00.0" ou "F32"'
    });
  }
  
  // Verificar se o CID existe na nossa base
  const cidExists = cidData.some(cid => cid.code === code);
  
  res.json({
    valid: true,
    exists: cidExists,
    message: cidExists ? 'Código CID válido e encontrado' : 'Código CID válido, mas não encontrado na base'
  });
});

// Rota padrão
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>API de Controle de CID</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          h1 { color: #2c3e50; }
          h2 { color: #3498db; }
          .endpoint { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 15px; }
          code { background: #eee; padding: 2px 5px; }
        </style>
      </head>
      <body>
        <h1>API de Controle de CID</h1>
        <p>Esta API fornece funcionalidades para busca e validação de códigos CID (Classificação Internacional de Doenças).</p>
        
        <h2>Endpoints Disponíveis:</h2>
        
        <div class="endpoint">
          <h3>GET /api/cid/categories</h3>
          <p>Retorna todas as categorias de CID.</p>
          <p>Exemplo: <code>GET /api/cid/categories</code></p>
        </div>
        
        <div class="endpoint">
          <h3>GET /api/cid/search</h3>
          <p>Busca CIDs por texto no código ou descrição.</p>
          <p>Parâmetros:</p>
          <ul>
            <li><code>query</code>: Texto a ser pesquisado (obrigatório, mínimo 2 caracteres)</li>
            <li><code>category</code>: Categoria para filtrar (opcional)</li>
            <li><code>showRestricted</code>: Se deve incluir CIDs restritos (opcional, default: false)</li>
          </ul>
          <p>Exemplo: <code>GET /api/cid/search?query=depression&category=F</code></p>
        </div>
        
        <div class="endpoint">
          <h3>POST /api/cid/validate</h3>
          <p>Valida um código CID.</p>
          <p>Body: <code>{ "code": "F32.1" }</code></p>
        </div>
        
        <div class="endpoint">
          <h3>GET /api/health</h3>
          <p>Verifica o status da API.</p>
        </div>
        
        <h2>Exemplos de CIDs disponíveis:</h2>
        <ul>
          ${cidData.map(cid => `<li><strong>${cid.code}</strong>: ${cid.description} ${cid.restricted ? '(restrito)' : ''}</li>`).join('')}
        </ul>
      </body>
    </html>
  `);
});

// Iniciar o servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor CID rodando em http://0.0.0.0:${PORT}`);
  console.log('Data/hora de início:', new Date().toISOString());
});