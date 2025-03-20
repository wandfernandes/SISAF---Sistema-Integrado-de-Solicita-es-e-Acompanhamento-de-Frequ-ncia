import express, { Request, Response, NextFunction } from 'express';
import { setupAuth } from './auth.js';
import { checkDatabaseConnection } from './db.js';
import cors from 'cors';
import medicalLeaveRoutes from './routes/medical-leaves.js';

// Interface for environment configuration
interface ServerConfig {
  port: number;
  nodeEnv: string;
  isDatabaseRequired: boolean;
}

// Server state
interface ServerState {
  isDatabaseConnected: boolean;
  startTime: Date;
}

class SISAFServer {
  private app: express.Application;
  private config: ServerConfig;
  private state: ServerState;

  constructor() {
    // Initialize Express app
    this.app = express();

    // Load configuration
    this.config = {
      port: parseInt(process.env.PORT || '5000', 10),
      nodeEnv: process.env.NODE_ENV || 'development',
      isDatabaseRequired: false // Set to false to allow server to start without DB
    };

    // Initialize state
    this.state = {
      isDatabaseConnected: false,
      startTime: new Date()
    };

    // Setup basic middleware
    this.setupMiddleware();

    // Setup basic routes
    this.setupRoutes();

    // Setup error handling
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // CORS and body parsing
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
      if (req.body && Object.keys(req.body).length > 0) {
        const sanitizedBody = { ...req.body };
        if (sanitizedBody.password) sanitizedBody.password = '[REDACTED]';
        console.log('[Request Body]', sanitizedBody);
      }
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'online',
        uptime: Math.floor((new Date().getTime() - this.state.startTime.getTime()) / 1000),
        timestamp: new Date().toISOString(),
        environment: this.config.nodeEnv,
        database: {
          connected: this.state.isDatabaseConnected,
          required: this.config.isDatabaseRequired
        }
      });
    });

    // Root endpoint
    this.app.get('/', (req: Request, res: Response) => {
      res.json({
        status: 'online',
        message: 'Servidor SISAF funcionando',
        features: {
          database: this.state.isDatabaseConnected ? 'disponível' : 'indisponível'
        }
      });
    });

    // Test endpoint
    this.app.get('/api/test', (req: Request, res: Response) => {
      res.json({ status: 'API is working' });
    });

    // Medical leave routes
    this.app.use('/api/medical-leaves', medicalLeaveRoutes);
  }

  private setupErrorHandling(): void {
    // 404 handler
    this.app.use((req: Request, res: Response) => {
      console.log(`[404] Route not found: ${req.method} ${req.path}`);
      res.status(404).json({ message: 'Route not found' });
    });

    // Error handler
    this.app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      console.error('[Error]', err);
      res.status(500).json({
        error: true,
        message: this.config.nodeEnv === 'development' ? err.message : 'Internal server error'
      });
    });
  }

  private async initializeDatabase(): Promise<void> {
    try {
      if (!process.env.DATABASE_URL) {
        console.warn("[Database] DATABASE_URL não está definida");
        if (this.config.isDatabaseRequired) {
          throw new Error("DATABASE_URL é obrigatória quando isDatabaseRequired=true");
        }
        return;
      }

      console.log("[Startup] Verificando conexão com o banco de dados...");
      await checkDatabaseConnection();
      this.state.isDatabaseConnected = true;
      console.log("[Startup] Conexão com banco de dados estabelecida");
    } catch (error) {
      console.error("[Database] Erro ao conectar com banco de dados:", error);
      if (this.config.isDatabaseRequired) {
        throw error;
      } else {
        console.log("[Database] Continuando com funcionalidades limitadas");
        this.state.isDatabaseConnected = false;
      }
    }
  }

  public async start(): Promise<void> {
    try {
      console.log(`[Startup] Iniciando servidor SISAF em modo ${this.config.nodeEnv}`);
      console.log(`[Startup] Database obrigatório: ${this.config.isDatabaseRequired}`);

      // Initialize database
      await this.initializeDatabase();

      // Setup authentication only if database is connected
      if (this.state.isDatabaseConnected) {
        console.log('[Auth] Configurando autenticação...');
        setupAuth(this.app);
        console.log('[Auth] Autenticação configurada');
      } else {
        console.log('[Auth] Autenticação desabilitada - banco de dados não disponível');
      }

      // Start HTTP server
      const server = this.app.listen(this.config.port, '0.0.0.0', () => {
        console.log(`[Server] SISAF rodando em http://0.0.0.0:${this.config.port}`);
        console.log(`[Server] Status do banco de dados: ${this.state.isDatabaseConnected ? 'Conectado' : 'Desconectado'}`);
        console.log(`[Server] Ambiente: ${this.config.nodeEnv}`);
        this.logAvailableRoutes();
      });

      // Graceful shutdown handling
      const shutdown = (signal: string) => {
        console.log(`\n[Server] Recebido ${signal}, iniciando encerramento gracioso...`);
        server.close(() => {
          console.log('[Server] Conexões HTTP fechadas');
          process.exit(0);
        });

        // Force shutdown after timeout
        setTimeout(() => {
          console.error('[Server] Não foi possível encerrar graciosamente, forçando saída');
          process.exit(1);
        }, 10000);
      };

      process.on('SIGTERM', () => shutdown('SIGTERM'));
      process.on('SIGINT', () => shutdown('SIGINT'));

    } catch (error) {
      console.error('[Fatal] Erro na inicialização do servidor:', error);
      throw error;
    }
  }

  private logAvailableRoutes(): void {
    console.log('\nRotas disponíveis:');
    console.log('  GET /');
    console.log('  GET /health');
    console.log('  GET /api/test');
    if (this.state.isDatabaseConnected) {
      console.log('  POST /api/auth/register');
      console.log('  POST /api/auth/login');
    }
    console.log('  GET /api/medical-leaves'); //Added this line
  }
}

// Initialize and start server
console.log('[Startup] Iniciando servidor SISAF...');
const server = new SISAFServer();
server.start().catch(error => {
  console.error('[Fatal] Erro não tratado:', error);
  process.exit(1);
});

export default server;