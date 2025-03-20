import { db } from "./db.js";
import { users, medicalLeaves, notifications } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import session from "express-session";
import pkg from 'pg';
const { Pool } = pkg;
import PgSession from "connect-pg-simple";
const PgStore = PgSession(session);
export class DatabaseStorage {
    sessionStore;
    constructor() {
        try {
            console.log("[Storage] Initializing DatabaseStorage...");
            const pool = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: { rejectUnauthorized: false }
            });
            this.sessionStore = new PgStore({
                pool,
                tableName: 'session',
                createTableIfMissing: true
            });
            console.log("[Storage] DatabaseStorage setup completed");
        }
        catch (error) {
            console.error("[Storage] Error initializing PgStore:", error);
            console.log("[Storage] Fallback to MemoryStore...");
            const MemoryStore = session.MemoryStore;
            this.sessionStore = new MemoryStore();
        }
    }
    async getUser(id) {
        try {
            const [user] = await db.select().from(users).where(eq(users.id, id));
            return user || null;
        }
        catch (error) {
            console.error("[Storage] Error fetching user:", error);
            return null;
        }
    }
    async getUserByUsername(username) {
        try {
            const [user] = await db.select().from(users).where(eq(users.username, username));
            return user || null;
        }
        catch (error) {
            console.error("[Storage] Error fetching user by username:", error);
            return null;
        }
    }
    async createUser(userData) {
        try {
            const [user] = await db.insert(users).values(userData).returning();
            return user;
        }
        catch (error) {
            console.error("[Storage] Error creating user:", error);
            throw new Error("Failed to create user");
        }
    }
    async updateUser(id, updates) {
        try {
            const [user] = await db.update(users).set(updates).where(eq(users.id, id)).returning();
            return user || null;
        }
        catch (error) {
            console.error("[Storage] Error updating user:", error);
            return null;
        }
    }
    async listUsers(filter) {
        try {
            let query = db.select().from(users);
            if (filter?.role) {
                query = query.where(eq(users.role, filter.role));
            }
            return await query;
        }
        catch (error) {
            console.error("[Storage] Error listing users:", error);
            return [];
        }
    }
    async getAllUsers() {
        try {
            return await db.select().from(users);
        }
        catch (error) {
            console.error("[Storage] Error fetching all users:", error);
            return [];
        }
    }
    async createMedicalLeave(leaveData) {
        try {
            const [leave] = await db.insert(medicalLeaves).values(leaveData).returning();
            return leave;
        }
        catch (error) {
            console.error("[Storage] Error creating medical leave:", error);
            throw new Error("Failed to create medical leave");
        }
    }
    async getAllRequests(filter) {
        try {
            let query = db.select().from(medicalLeaves);
            if (filter?.status) {
                query = query.where(eq(medicalLeaves.status, filter.status));
            }
            return await query;
        }
        catch (error) {
            console.error("[Storage] Error fetching medical leaves:", error);
            throw new Error("Failed to fetch medical leaves");
        }
    }
    async updateMedicalLeave(id, updates) {
        try {
            const [leave] = await db.update(medicalLeaves).set(updates).where(eq(medicalLeaves.id, id)).returning();
            if (!leave) {
                throw new Error("Medical leave not found");
            }
            return leave;
        }
        catch (error) {
            console.error("[Storage] Error updating medical leave:", error);
            throw new Error("Failed to update medical leave");
        }
    }
    async createNotification(notification) {
        try {
            const [newNotification] = await db.insert(notifications).values(notification).returning();
            return newNotification;
        }
        catch (error) {
            console.error("[Storage] Error creating notification:", error);
            throw new Error("Failed to create notification");
        }
    }
}
export const storage = new DatabaseStorage();
//# sourceMappingURL=storage.js.map