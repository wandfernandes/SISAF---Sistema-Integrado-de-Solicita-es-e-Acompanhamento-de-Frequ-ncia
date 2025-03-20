import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth } from "./auth.js";
import medicalLeavesRouter from "./routes/medical-leaves.js";
import vacationRouter from "./routes/vacation.js";
import notificationsRouter from "./routes/notifications.js";
import hrApprovalsRouter from "./routes/hr-approvals.js";
import chatRouter from "./routes/chat.js";
import { setupWebSocket } from "./websocket.js";

export async function registerRoutes(app: Express): Promise<Server> {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = 'development_secret_key';
  }

  // Register medical leaves routes
  app.use("/api", medicalLeavesRouter);

  // Register vacation routes
  app.use("/api", vacationRouter);

  //Register notification routes
  app.use("/api", notificationsRouter);

  // Register HR approval routes
  app.use("/api", hrApprovalsRouter);

  // Register chat routes
  app.use("/api", chatRouter);


  const httpServer = createServer(app);

  // Inicializar WebSocket server
  setupWebSocket(httpServer);

  return httpServer;
}