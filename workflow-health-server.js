/**
 * Servidor de saúde para workflow do Replit (versão leve)
 * Usando HTTP nativo para garantir inicialização rápida na porta 5000
 */

import { createServer } from 'http';

const server = createServer((req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.writeHead(200);
  res.end('<h1>SISAF - Health Check Server</h1><p>Sistema ativo e funcionando.</p>');
});

try {
  const PORT = 5000;
  
  // Verifica se a porta já está em uso
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
      console.error(`Porta ${PORT} já está em uso.`);
    } else {
      console.error(`Erro ao iniciar servidor na porta ${PORT}:`, e);
    }
  });
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor de saúde (HTTP nativo) rodando na porta ${PORT}`);
  });
} catch (error) {
  console.error('Erro crítico ao tentar iniciar servidor de saúde:', error);
}