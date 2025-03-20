import express from 'express';
import { setupAuth } from './auth.js';
import { checkDatabaseConnection } from './db.js';
import { setupVite } from './setupVite.js';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
class SISAFServer {
    app;
    port;
    server;
    isDatabaseConnected = false;
    constructor() {
        console.log("[Server] Initializing SISAF server...");
        this.app = express();
        this.port = parseInt(process.env.PORT || '5000', 10);
        this.setupMiddleware();
    }
    setupMiddleware() {
        // Basic middleware
        this.app.use(cors());
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, _res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
            next();
        });
        // Health check endpoint
        this.app.get('/ping', (_req, res) => {
            res.json({
                status: 'ok',
                time: new Date().toISOString(),
                server: 'SISAF'
            });
        });
        // Setup static file serving
        const clientDir = path.resolve(__dirname, '..', 'client');
        if (fs.existsSync(clientDir)) {
            console.log(`[Static] Serving files from: ${clientDir}`);
            this.app.use(express.static(clientDir));
            // SPA fallback
            this.app.get('*', (req, res, next) => {
                if (req.path.startsWith('/api')) {
                    return next();
                }
                const indexPath = path.join(clientDir, 'index.html');
                if (fs.existsSync(indexPath)) {
                    console.log(`[Static] Serving index.html for: ${req.path}`);
                    res.sendFile(indexPath);
                }
                else {
                    console.error(`[Static] index.html not found at ${indexPath}`);
                    res.status(404).send('Application entry point not found');
                }
            });
        }
        else {
            console.error(`[Static] Client directory not found at ${clientDir}`);
        }
        // Error handler
        this.app.use((err, _req, res, _next) => {
            console.error('[Error]', err);
            res.status(500).json({ error: 'Internal Server Error' });
        });
    }
    async start() {
        try {
            // Start HTTP server first
            this.server = await new Promise((resolve, reject) => {
                const server = this.app.listen(this.port, '0.0.0.0', () => {
                    console.log(`[Server] Server is running at http://0.0.0.0:${this.port}`);
                    resolve(server);
                });
                server.on('error', (error) => {
                    console.error('[Server] Failed to start server:', error);
                    reject(error);
                });
            });
            // Initialize database
            try {
                console.log("[Database] Starting initialization...");
                await checkDatabaseConnection();
                this.isDatabaseConnected = true;
                console.log("[Database] Connection successful");
            }
            catch (error) {
                console.error("[Database] Connection failed:", error);
            }
            // Setup authentication if database is connected
            if (this.isDatabaseConnected) {
                console.log("[Auth] Setting up authentication...");
                setupAuth(this.app);
            }
            // Setup Vite in development mode
            if (process.env.NODE_ENV !== 'production') {
                console.log("[Frontend] Setting up Vite development server...");
                try {
                    await setupVite(this.app, this.server);
                    console.log("[Frontend] Vite setup completed");
                }
                catch (error) {
                    console.error("[Frontend] Vite setup failed:", error);
                    throw error;
                }
            }
            console.log("[Server] Startup complete");
        }
        catch (error) {
            console.error('[Server] Startup error:', error);
            throw error;
        }
    }
    async stop() {
        if (this.server) {
            await new Promise((resolve) => {
                this.server.close(() => {
                    console.log('[Server] Server stopped');
                    resolve();
                });
            });
        }
    }
}
// Create and start server instance
const server = new SISAFServer();
server.start().catch(error => {
    console.error('[Fatal] Server failed to start:', error);
    process.exit(1);
});
// Handle shutdown gracefully
process.on('SIGTERM', async () => {
    console.log('\n[Process] Received SIGTERM signal');
    await server.stop();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('\n[Process] Received SIGINT signal');
    await server.stop();
    process.exit(0);
});
export default server;
//# sourceMappingURL=server-start.js.map