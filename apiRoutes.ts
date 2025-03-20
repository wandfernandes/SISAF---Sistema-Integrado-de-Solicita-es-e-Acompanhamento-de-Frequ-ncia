import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { setupAuth, hashPassword } from "./auth.js"; // Adicionando import para hashPassword
import { getRequestAnalytics, getVacationAnalytics, getMedicalLeaveAnalytics, getManagementAnalytics } from "./services/analytics.js";
import medicalLeavesRouter from "./routes/medical-leaves.js";
import vacationRouter from "./routes/vacation.js";
import notificationsRouter from "./routes/notifications.js";
import hrApprovalsRouter from "./routes/hr-approvals.js"; // Adicionando import
import chatRouter from "./routes/chat.js"; // Importando router de chat
import licensesRouter from "./routes/licenses.js"; // Importando router de licenças
import { setupWebSocket } from "./websocket.js"; // Importando função de setup WebSocket
import { createNotification } from "./services/notifications.js"; // Importando função de criar notificação
import { db } from './db.js'; // Importação correta
import { licenses } from '@shared/schema.js'; // Importar tabelas do schema
import { eq, sql } from 'drizzle-orm'; // Importar funções do drizzle-orm


export async function registerRoutes(app: Express): Promise<Server> {
  if (!process.env.SESSION_SECRET) {
    process.env.SESSION_SECRET = 'development_secret_key';
  }

  // Auth setup is already handled in index.ts, don't call it again here
  // setupAuth(app);

  // Register medical leaves routes
  app.use("/api", medicalLeavesRouter);

  // Register vacation routes
  app.use("/api", vacationRouter);

  //Register notification routes
  app.use("/api", notificationsRouter);

  // Register HR approval routes
  app.use("/api", hrApprovalsRouter); // Adicionando router

  // Register chat routes
  app.use("/api", chatRouter); // Adicionando router de chat

  // Register licenses routes
  app.use("/api", licensesRouter); // Adicionando router de licenças

  // Analytics routes - Restritos por role
  app.get("/api/analytics/requests", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      // Apenas admin e RH podem ver todas as solicitações
      if (req.user!.role === 'admin' || req.user!.role === 'hr') {
        const analytics = await getRequestAnalytics(); // Admin/HR veem tudo
        res.json(analytics);
      } else {
        // Usuários regulares não devem acessar analytics
        console.log("Tentativa não autorizada de acesso a analytics por:", req.user!.username);
        return res.sendStatus(403);
      }
    } catch (error: any) {
      console.error("Error getting request analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/vacations", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (req.user!.role === 'admin' || req.user!.role === 'hr') {
        const analytics = await getVacationAnalytics();
        res.json(analytics);
      } else {
        console.log("Tentativa não autorizada de acesso a analytics de férias por:", req.user!.username);
        return res.sendStatus(403);
      }
    } catch (error: any) {
      console.error("Error getting vacation analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/medical-leaves", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (req.user!.role === 'admin' || req.user!.role === 'hr') {
        const analytics = await getMedicalLeaveAnalytics();
        res.json(analytics);
      } else {
        console.log("Tentativa não autorizada de acesso a analytics médicos por:", req.user!.username);
        return res.sendStatus(403);
      }
    } catch (error: any) {
      console.error("Error getting medical leave analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/analytics/management", async (req, res) => {
    if (!req.isAuthenticated() || (req.user!.role !== "admin" && req.user!.role !== "hr")) {
      console.log("Tentativa não autorizada de acesso a analytics de gestão");
      return res.sendStatus(403);
    }
    try {
      const analytics = await getManagementAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error("Error getting management analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Endpoint para analytics de licenças
  app.get("/api/analytics/licenses", async (req, res) => {
    if (!req.isAuthenticated() || (req.user!.role !== "admin" && req.user!.role !== "hr")) {
      console.log("Tentativa não autorizada de acesso a analytics de licenças");
      return res.sendStatus(403);
    }

    try {
      const result = await db
        .select({
          totalLicenses: sql<number>`count(*)`,
          approvalRate: sql<number>`
            (count(case when ${licenses.status} = 'approved' then 1 end)::float / 
            nullif(count(*), 0) * 100)
          `,
          averageProcessingTime: sql<number>`
            avg(case 
              when ${licenses.status} != 'pending' 
              then extract(epoch from (${licenses.updatedAt} - ${licenses.createdAt}))/86400.0 
              else null 
            end)
          `,
        })
        .from(licenses);

      const licensesByStatus = await db
        .select({
          status: licenses.status,
          count: sql<number>`count(*)`,
        })
        .from(licenses)
        .groupBy(licenses.status);

      const licensesByMonth = await db
        .select({
          month: sql<string>`to_char(${licenses.createdAt}, 'YYYY-MM')`,
          count: sql<number>`count(*)`,
        })
        .from(licenses)
        .groupBy(sql`to_char(${licenses.createdAt}, 'YYYY-MM')`)
        .orderBy(sql`to_char(${licenses.createdAt}, 'YYYY-MM')`);

      const licensesByReason = await db
        .select({
          reason: licenses.reason,
          count: sql<number>`count(*)`,
        })
        .from(licenses)
        .groupBy(licenses.reason);

      const licensesByUnit = await db
        .select({
          unit: licenses.workUnit,
          count: sql<number>`count(*)`,
        })
        .from(licenses)
        .groupBy(licenses.workUnit);

      const stats = result[0];

      const analytics = {
        totalLicenses: Number(stats.totalLicenses),
        approvalRate: Number(stats.approvalRate) || 0,
        averageProcessingTime: Number(stats.averageProcessingTime) || 0,
        licensesByStatus: licensesByStatus.map(r => ({
          status: r.status,
          count: Number(r.count)
        })),
        licensesByMonth: licensesByMonth.map(r => ({
          month: r.month,
          count: Number(r.count)
        })),
        licensesByReason: licensesByReason.map(r => ({
          reason: r.reason,
          count: Number(r.count)
        })),
        licensesByUnit: licensesByUnit.map(r => ({
          unit: r.unit,
          count: Number(r.count)
        })),
      };

      res.json(analytics);
    } catch (error: any) {
      console.error("Error getting license analytics:", error);
      res.status(500).json({ error: error.message });
    }
  });


  // User management routes
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      if (req.user!.role === 'admin' || req.user!.role === 'hr') {
        const users = await storage.getAllUsers();
        res.json(users);
      } else {
        const user = await storage.getUser(req.user!.id);
        res.json([user]); // Retorna apenas o próprio usuário
      }
    } catch (error: any) {
      console.error("Error getting users:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      let user;
      if (req.body.status === "approved") {
        user = await storage.approveUser(userId, req.user!.id);
      } else if (req.body.status === "rejected") {
        user = await storage.rejectUser(userId);
      } else {
        user = await storage.updateUser(userId, req.body);
      }
      res.json(user);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add this route after the existing user routes
  app.post("/api/users/:id/reset-password", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }

    const userId = parseInt(req.params.id);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    try {
      const newPassword = Math.random().toString(36).slice(-8); // Generate random 8 char password
      const hashedPassword = await hashPassword(newPassword);

      await storage.updateUser(userId, { password: hashedPassword });

      res.json({ newPassword });
    } catch (error: any) {
      console.error("Error resetting password:", error);
      res.status(500).json({ error: error.message });
    }
  });


  // Payment routes
  app.post("/api/payments", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }

    try {
      const payment = await storage.createPayment({
        ...req.body,
        userId: req.user!.id,
      });
      res.status(201).json(payment);
    } catch (error: any) {
      console.error("Error creating payment:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/payments", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    try {
      const payments = await storage.getAllPayments();
      res.json(payments);
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.patch("/api/payments/:id", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }

    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    try {
      // Capturar os dados a serem atualizados incluindo os novos campos
      const updateData = {
        ...req.body,
        // Garantindo que valores numéricos sejam tratados corretamente
        contractValue: req.body.contractValue !== undefined 
          ? parseFloat(req.body.contractValue) 
          : undefined,
        additiveValue: req.body.additiveValue !== undefined 
          ? parseFloat(req.body.additiveValue) 
          : undefined,
        invoiceValue: req.body.invoiceValue !== undefined 
          ? parseFloat(req.body.invoiceValue) 
          : undefined,
        // Os campos booleanos são tratados automaticamente
      };

      console.log("Atualizando pagamento com ID:", paymentId, "Dados:", updateData);

      const payment = await storage.updatePayment(paymentId, updateData);

      // Criar notificação sobre alterações importantes
      let notificationMessage = `O pagamento SEI ${payment.seiNumber} foi atualizado.`;

      if (updateData.attestation !== undefined) {
        notificationMessage += ` Atesto: ${updateData.attestation ? 'Realizado' : 'Pendente'}.`;
      }

      if (updateData.certFgts !== undefined || 
          updateData.certFederal !== undefined || 
          updateData.certMunicipal !== undefined || 
          updateData.certTrabalhista !== undefined || 
          updateData.certEstadual !== undefined) {
        notificationMessage += " Certidões atualizadas.";
      }

      await createNotification({
        userId: req.user!.id,
        type: "info",
        title: "Pagamento atualizado",
        message: notificationMessage
      });

      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Add after the existing payment routes
  app.patch("/api/payments/:id/priority", async (req, res) => {
    if (!req.isAuthenticated() || req.user!.role !== "admin") {
      return res.sendStatus(401);
    }

    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId)) {
      return res.status(400).json({ error: "Invalid payment ID" });
    }

    try {
      const payment = await storage.updatePaymentPriority(paymentId, req.body.isPriority);

      // Criar notificação sobre a alteração de prioridade
      await createNotification({
        userId: req.user!.id,
        type: "info",
        title: req.body.isPriority ? "Processo marcado como prioritário" : "Processo desmarcado como prioritário",
        message: `O processo SEI ${payment.seiNumber} foi ${req.body.isPriority ? "marcado" : "desmarcado"} como prioritário.`
      });

      res.json(payment);
    } catch (error: any) {
      console.error("Error updating payment priority:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Basic Vacation Period routes
  app.get("/api/vacation-periods", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      if (req.user!.role === "admin" || req.user!.role === "hr") {
        const periods = await storage.getAllVacationPeriods();
        res.json(periods);
      } else {
        const periods = await storage.getUserVacationPeriods(req.user!.id);
        res.json(periods);
      }
    } catch (error: any) {
      console.error("Error fetching vacation periods:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/vacation-periods", async (req, res) => {
    if (!req.isAuthenticated() || !["admin", "hr"].includes(req.user!.role)) {
      return res.sendStatus(401);
    }

    try {
      const period = await storage.createVacationPeriod({
        userId: req.body.userId,
        acquisitionPeriod: req.body.acquisitionPeriod,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        returnDate: new Date(req.body.returnDate),
        totalDays: req.body.totalDays,
        // Valores padrão para os campos obrigatórios que não são enviados pelo frontend
        remainingDays: req.body.totalDays,
        daysUsed: 0,
        status: "pending",
        observation: req.body.observation || null,
        seiNumber: req.body.seiNumber || null,
        reviewedBy: null,
        reviewedAt: null
      });
      res.status(201).json(period);
    } catch (error: any) {
      console.error("Error creating vacation period:", error);
      res.status(400).json({ error: error.message });
    }
  });

  // Add after the existing routes
  app.get("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(preferences || { dashboardLayout: [] });
    } catch (error: any) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/user/preferences", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const preferences = await storage.updateUserPreferences(req.user!.id, {
        dashboardLayout: req.body.dashboardLayout || [],
      });
      res.json(preferences);
    } catch (error: any) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  // Inicializar WebSocket server
  setupWebSocket(httpServer);

  return httpServer;
}
