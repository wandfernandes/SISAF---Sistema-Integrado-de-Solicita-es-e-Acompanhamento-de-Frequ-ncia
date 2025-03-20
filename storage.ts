import { db } from "./db.js";
import { users, medicalLeaves } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import session from "express-session";
import { Pool } from "pg";
import PgSession from "connect-pg-simple";
import { type User, type NewUser, type MedicalLeave, type NewMedicalLeave } from "../shared/schema.js";

const PgStore = PgSession(session);

export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    try {
      console.log("[Storage] Inicializando DatabaseStorage...");
      const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
          rejectUnauthorized: false
        }
      });

      this.sessionStore = new PgStore({
        pool,
        tableName: 'session',
        createTableIfMissing: true
      });

      console.log("[Storage] Configuração do DatabaseStorage concluída");
    } catch (error) {
      console.error("[Storage] Erro ao inicializar PgStore:", error);
      console.log("[Storage] Fallback para MemoryStore...");
      const MemoryStore = session.MemoryStore;
      this.sessionStore = new MemoryStore();
    }
  }

  async getUser(id: number): Promise<User | null> {
    try {
      console.log(`[Storage] Buscando usuário com ID: ${id}`);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      if (user) {
        console.log(`[Storage] Usuário encontrado: ${user.username}`);
      } else {
        console.log(`[Storage] Usuário não encontrado para ID: ${id}`);
      }

      return user || null;
    } catch (error) {
      console.error("[Storage] Erro ao buscar usuário:", error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    try {
      console.log(`[Storage] Buscando usuário por username: ${username}`);
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, username));

      if (user) {
        console.log(`[Storage] Usuário encontrado: ${user.username}`);
      } else {
        console.log(`[Storage] Usuário não encontrado para username: ${username}`);
      }

      return user || null;
    } catch (error) {
      console.error("[Storage] Erro ao buscar usuário por username:", error);
      return null;
    }
  }

  async createUser(userData: NewUser): Promise<User> {
    try {
      console.log("[Storage] Criando novo usuário:", { ...userData, password: '[REDACTED]' });
      const [user] = await db
        .insert(users)
        .values(userData)
        .returning();

      console.log(`[Storage] Usuário criado com sucesso: ${user.username}`);
      return user;
    } catch (error) {
      console.error("[Storage] Erro ao criar usuário:", error);
      throw new Error("Erro ao criar usuário");
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    try {
      console.log(`[Storage] Atualizando usuário ${id}:`, { ...updates, password: updates.password ? '[REDACTED]' : undefined });
      const [user] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, id))
        .returning();

      if (user) {
        console.log(`[Storage] Usuário atualizado com sucesso: ${user.username}`);
      } else {
        console.log(`[Storage] Nenhum usuário encontrado para atualização com ID: ${id}`);
      }

      return user || null;
    } catch (error) {
      console.error("[Storage] Erro ao atualizar usuário:", error);
      return null;
    }
  }

  async listUsers(filter?: { role?: string; status?: string }): Promise<User[]> {
    try {
      console.log("[Storage] Listando usuários com filtro:", filter);
      let query = db.select().from(users);

      if (filter?.role) {
        query = query.where(eq(users.role, filter.role));
      }
      if (filter?.status) {
        query = query.where(eq(users.status, filter.status));
      }

      const userList = await query;
      console.log(`[Storage] ${userList.length} usuários encontrados`);
      return userList;
    } catch (error) {
      console.error("[Storage] Erro ao listar usuários:", error);
      return [];
    }
  }

  async createMedicalLeave(leaveData: NewMedicalLeave): Promise<MedicalLeave> {
    try {
      console.log("[Storage] Criando nova licença médica:", leaveData);
      const [leave] = await db
        .insert(medicalLeaves)
        .values(leaveData)
        .returning();

      console.log(`[Storage] Licença médica criada com sucesso para usuário: ${leave.userId}`);
      return leave;
    } catch (error) {
      console.error("[Storage] Erro ao criar licença médica:", error);
      throw new Error("Erro ao criar licença médica");
    }
  }
}

export const storage = new DatabaseStorage();