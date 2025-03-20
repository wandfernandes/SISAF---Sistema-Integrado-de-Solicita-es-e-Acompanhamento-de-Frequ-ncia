import { createServer } from "http";
import { storage } from "./storage.js";
import { getRequestAnalytics } from "./services/analytics.js";
import medicalLeavesRouter from "./routes/medical-leaves.js";
import vacationRouter from "./routes/vacation.js";
import notificationsRouter from "./routes/notifications.js";
import hrApprovalsRouter from "./routes/hr-approvals.js";
import chatRouter from "./routes/chat.js";
import licensesRouter from "./routes/licenses.js";
import { setupWebSocket } from "./websocket.js";
import { db } from './db.js';
import { users } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
export async function registerRoutes(app) {
    if (!process.env.SESSION_SECRET) {
        process.env.SESSION_SECRET = 'development_secret_key';
    }
    // Register API routes
    app.use("/api", medicalLeavesRouter);
    app.use("/api", vacationRouter);
    app.use("/api", notificationsRouter);
    app.use("/api", hrApprovalsRouter);
    app.use("/api", chatRouter);
    app.use("/api", licensesRouter);
    // Analytics routes - Restricted by role
    app.get("/api/analytics/requests", async (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        try {
            if (req.user.role === 'admin' || req.user.role === 'hr') {
                const analytics = await getRequestAnalytics();
                res.json(analytics);
            }
            else {
                console.log("Unauthorized analytics access attempt by:", req.user.username);
                return res.sendStatus(403);
            }
        }
        catch (error) {
            console.error("Error getting request analytics:", error);
            res.status(500).json({ error: error.message });
        }
    });
    // User management routes
    app.get("/api/users", async (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        try {
            if (req.user.role === 'admin' || req.user.role === 'hr') {
                const users = await storage.getAllUsers();
                res.json(users);
            }
            else {
                const user = await storage.getUser(req.user.id);
                res.json(user ? [user] : []);
            }
        }
        catch (error) {
            console.error("Error getting users:", error);
            res.status(500).json({ error: error.message });
        }
    });
    app.patch("/api/users/:id", async (req, res) => {
        if (!req.isAuthenticated() || req.user.role !== "admin") {
            return res.sendStatus(401);
        }
        const userId = parseInt(req.params.id);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        try {
            const user = await storage.updateUser(userId, req.body);
            res.json(user);
        }
        catch (error) {
            console.error("Error updating user:", error);
            res.status(500).json({ error: error.message });
        }
    });
    // Basic Vacation Period routes
    app.get("/api/vacation-periods", async (req, res) => {
        if (!req.isAuthenticated())
            return res.sendStatus(401);
        try {
            const periods = await db
                .select()
                .from(users)
                .where(eq(users.id, req.user.id));
            res.json(periods);
        }
        catch (error) {
            console.error("Error fetching vacation periods:", error);
            res.status(500).json({ error: error.message });
        }
    });
    const httpServer = createServer(app);
    setupWebSocket(httpServer);
    return httpServer;
}
//# sourceMappingURL=apiRoutes.js.map