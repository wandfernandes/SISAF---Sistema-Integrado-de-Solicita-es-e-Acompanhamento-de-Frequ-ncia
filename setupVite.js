import express from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import viteConfig from "../vite.config.js";
const viteLogger = createLogger();
function log(message, source = "Vite") {
    const time = new Date().toLocaleTimeString();
    console.log(`[${time}] [${source}] ${message}`);
}
export async function setupVite(app, server) {
    log("Setting up Vite development server...");
    try {
        // Define server configuration
        const serverConfig = {
            middlewareMode: true,
            hmr: {
                server,
                port: Number(process.env.PORT) || 5000,
                host: '0.0.0.0',
            },
            watch: {
                usePolling: true,
                interval: 100,
            },
            host: '0.0.0.0',
            cors: true,
            strictPort: true,
            allowedHosts: ['all'],
            fs: {
                strict: false,
                allow: ['..']
            }
        };
        // Create Vite server
        const vite = await createViteServer({
            ...viteConfig,
            configFile: false,
            server: serverConfig,
            customLogger: viteLogger,
            appType: 'spa',
        });
        // Use Vite's middleware
        app.use(vite.middlewares);
        // Handle SPA routing
        app.use('*', async (req, res, next) => {
            const url = req.originalUrl;
            // Skip API routes
            if (url.startsWith('/api')) {
                return next();
            }
            try {
                // Read index.html
                const templatePath = path.resolve(__dirname, '..', 'client', 'index.html');
                if (!fs.existsSync(templatePath)) {
                    log(`ERROR: Template not found at ${templatePath}`, "Error");
                    return res.status(404).send("Application entry point not found");
                }
                // Read and transform index.html
                let template = await fs.promises.readFile(templatePath, 'utf-8');
                template = await vite.transformIndexHtml(url, template);
                res.status(200)
                    .set({ 'Content-Type': 'text/html' })
                    .end(template);
            }
            catch (e) {
                const error = e;
                log(`Error serving index.html: ${error.message}`, "Error");
                vite.ssrFixStacktrace(error);
                next(error);
            }
        });
        log("Vite setup completed successfully");
    }
    catch (error) {
        log(`Error during Vite setup: ${error.message}`, "Error");
        throw error;
    }
}
export function serveStatic(app) {
    const staticPath = path.resolve(__dirname, '..', 'dist', 'client');
    log(`Serving static files from: ${staticPath}`, "Static");
    app.use(express.static(staticPath));
    app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(staticPath, 'index.html'));
    });
}
//# sourceMappingURL=setupVite.js.map