import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from '../shared/schema.js';
// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;
console.log("[Database] Initializing database configuration...");
// Configure connection pool
const poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
};
console.log("[Database] Configuring pool with parameters:", {
    ...poolConfig,
    connectionString: '[REDACTED]'
});
const pool = new Pool(poolConfig);
// Create Drizzle instance
console.log("[Database] Initializing Drizzle ORM...");
export const db = drizzle(pool, { schema });
// Verify database connection
export const checkDatabaseConnection = async () => {
    console.log("[Database] Verifying database connection...");
    let client;
    let retries = 3;
    let lastError;
    while (retries > 0) {
        try {
            client = await pool.connect();
            console.log("[Database] Connection established successfully");
            // Check database version and timestamp
            const versionResult = await client.query('SELECT version(), current_timestamp');
            console.log('[Database] Server information:', versionResult.rows[0]);
            // Check if tables exist
            const tablesResult = await client.query(`
        SELECT table_name, table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name;
      `);
            if (tablesResult.rows.length === 0) {
                console.warn('[Database] No tables found in public schema');
            }
            else {
                console.log('[Database] Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));
            }
            return true;
        }
        catch (error) {
            lastError = error;
            console.error('[Database] Connection attempt failed:', {
                attempt: 4 - retries,
                code: error.code,
                message: error.message,
                detail: error.detail,
                hint: error.hint
            });
            // Log specific error messages based on error code
            switch (error.code) {
                case 'ECONNREFUSED':
                    console.error('[Database] Could not connect to PostgreSQL server. Please verify server is running and accessible.');
                    break;
                case '28P01':
                    console.error('[Database] Invalid credentials. Check username and password.');
                    break;
                case '3D000':
                    console.error('[Database] Database does not exist.');
                    break;
                case '08004':
                    console.error('[Database] Server rejected connection.');
                    break;
                case '08001':
                    console.error('[Database] Client could not establish connection.');
                    break;
                default:
                    console.error('[Database] Uncategorized error:', error.stack);
            }
            retries--;
            if (retries > 0) {
                console.log(`[Database] Retrying connection in 5 seconds... (${retries} attempts remaining)`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
        finally {
            if (client) {
                console.log("[Database] Releasing connection to pool");
                client.release();
            }
        }
    }
    console.error('[Database] All connection attempts failed:', lastError);
    throw lastError;
};
// Handle clean pool shutdown
const closePool = async () => {
    console.log('[Database] Closing connection pool...');
    try {
        await pool.end();
        console.log('[Database] Pool closed successfully');
    }
    catch (error) {
        console.error('[Database] Error closing pool:', error);
    }
};
// Register shutdown handlers
process.on('SIGTERM', closePool);
process.on('SIGINT', closePool);
// Export pool for use in other modules
export { pool };
//# sourceMappingURL=db.js.map