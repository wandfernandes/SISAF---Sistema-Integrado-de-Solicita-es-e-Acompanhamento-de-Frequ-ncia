import express, { type Express } from "express";
import fs from "fs";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer, createLogger } from "vite";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { type Server } from "http";

// Configuração básica do Vite
const viteConfig = {
  plugins: [],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "..", "client", "src"),
      "@shared": path.resolve(__dirname, "..", "shared"),
    },
  },
  root: path.resolve(__dirname, "..", "client"),
  build: {
    outDir: path.resolve(__dirname, "..", "dist/public"),
    emptyOutDir: true,
  },
};

const viteLogger = createLogger();

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

export async function setupVite(app: Express, server: Server) {
  console.log("Configurando servidor Vite...");
  
  const serverOptions = {
    middlewareMode: true as const,
    hmr: { server },
    allowedHosts: ['localhost', '0.0.0.0'],
  };

  try {
    const vite = await createViteServer({
      ...viteConfig,
      configFile: false,
      customLogger: {
        ...viteLogger,
        error: (msg, options) => {
          viteLogger.error(msg, options);
          console.error("Erro no Vite:", msg);
        },
      },
      server: serverOptions,
      appType: "custom",
    });

    console.log("Middleware Vite configurado com sucesso");
    
    app.use(vite.middlewares);
    
    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      
      if (url.startsWith("/api")) {
        return next();
      }

      try {
        console.log(`Processando requisição para: ${url}`);
        const clientTemplate = path.resolve(
          __dirname,
          "..",
          "client",
          "index.html",
        );

        // always reload the index.html file from disk incase it changes
        let template = await fs.promises.readFile(clientTemplate, "utf-8");
        template = template.replace(
          `src="/src/main.tsx"`,
          `src="/src/main.tsx?v=${Date.now()}"`,
        );
        
        console.log("Template carregado, transformando com Vite...");
        const page = await vite.transformIndexHtml(url, template);
        
        console.log("Enviando resposta HTML...");
        res.status(200).set({ "Content-Type": "text/html" }).end(page);
      } catch (e) {
        console.error("Erro ao processar HTML:", e);
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } catch (error) {
    console.error("Erro ao configurar Vite:", error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  console.log("Usando build de produção");
  const staticPath = path.resolve("./dist/public");
  console.log("Servindo arquivos estáticos de:", staticPath);
  app.use(express.static(staticPath));

  // Serve index.html for SPA routes
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    res.sendFile(path.resolve("./dist/public/index.html"));
  });
}