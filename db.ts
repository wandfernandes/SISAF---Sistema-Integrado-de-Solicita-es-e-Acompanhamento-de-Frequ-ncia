import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

console.log("[Database] Iniciando configuração do banco de dados...");

// Configurar pool de conexões
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
};

console.log("[Database] Configurando pool com os seguintes parâmetros:", {
  ...poolConfig,
  connectionString: '[REDACTED]'
});

const pool = new Pool(poolConfig);

// Criar instância do Drizzle
console.log("[Database] Inicializando Drizzle ORM...");
export const db = drizzle(pool, { schema });

// Verificar conexão com o banco
export const checkDatabaseConnection = async () => {
  console.log("[Database] Verificando conexão com o banco de dados...");
  let client;
  try {
    client = await pool.connect();
    console.log("[Database] Conexão estabelecida com sucesso");

    // Verificar versão do banco e timestamp
    const versionResult = await client.query('SELECT version(), current_timestamp');
    console.log('[Database] Informações do servidor:', versionResult.rows[0]);

    // Verificar se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    if (tablesResult.rows.length === 0) {
      console.warn('[Database] Nenhuma tabela encontrada no schema public');
    } else {
      console.log('[Database] Tabelas encontradas:', 
        tablesResult.rows.map(r => r.table_name).join(', ')
      );
    }

    return true;
  } catch (error: any) {
    console.error('[Database] Erro ao verificar conexão:', {
      code: error.code,
      message: error.message,
      detail: error.detail,
      hint: error.hint
    });

    // Logs específicos baseados no código de erro
    switch (error.code) {
      case 'ECONNREFUSED':
        console.error('[Database] Não foi possível conectar ao servidor PostgreSQL. Verifique se o servidor está rodando e acessível.');
        break;
      case '28P01':
        console.error('[Database] Credenciais inválidas. Verifique usuário e senha.');
        break;
      case '3D000':
        console.error('[Database] Banco de dados não existe.');
        break;
      case '08004':
        console.error('[Database] Conexão rejeitada pelo servidor.');
        break;
      case '08001':
        console.error('[Database] Cliente não conseguiu estabelecer conexão.');
        break;
      default:
        console.error('[Database] Erro não categorizado:', error.stack);
    }

    throw error;
  } finally {
    if (client) {
      console.log("[Database] Liberando conexão do pool");
      client.release();
    }
  }
};

// Função para gerenciar o encerramento limpo do pool
const closePool = async () => {
  console.log('[Database] Encerrando pool de conexões...');
  try {
    await pool.end();
    console.log('[Database] Pool encerrado com sucesso');
  } catch (error) {
    console.error('[Database] Erro ao encerrar pool:', error);
  }
};

// Registrar handlers para encerramento limpo
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);

// Exportar pool para uso em outros módulos
export { pool };