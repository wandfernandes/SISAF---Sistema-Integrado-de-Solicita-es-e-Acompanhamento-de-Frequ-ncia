import express from "express";
import { db } from "../db.js";
import { medicalLeaves, users } from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { type MedicalLeave, type NewMedicalLeave } from "../../shared/schema.js";
import { addDays, addHours } from "date-fns";
import { getMedicalLeaveAnalytics } from "../services/analytics.js";

const router = express.Router();

// Middleware de autenticação
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({
      error: true,
      message: "Usuário não autenticado"
    });
  }
  next();
};

// Adicionar middleware em todas as rotas
router.use(requireAuth);

// Criar novo atestado médico
router.post("/", async (req: express.Request, res: express.Response) => {
  try {
    const { startDate, endDate, reason, doctorName, cid } = req.body;

    if (!req.user?.id) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado"
      });
    }

    const medicalLeave: NewMedicalLeave = {
      userId: req.user.id,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason,
      doctorName,
      cid,
      status: "pending"
    };

    const [createdLeave] = await db
      .insert(medicalLeaves)
      .values(medicalLeave)
      .returning();

    res.status(201).json(createdLeave);
  } catch (error) {
    console.error("Error creating medical leave:", error);
    res.status(500).json({ 
      error: true,
      message: "Erro ao criar atestado médico"
    });
  }
});

// Listar atestados médicos
router.get("/", async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado"
      });
    }

    // Verificar se é admin/RH
    const isAdmin = req.user.role === "admin" || req.user.role === "hr";

    let query = db
      .select({
        id: medicalLeaves.id,
        userId: medicalLeaves.userId,
        startDate: medicalLeaves.startDate,
        endDate: medicalLeaves.endDate,
        reason: medicalLeaves.reason,
        status: medicalLeaves.status,
        doctorName: medicalLeaves.doctorName,
        cid: medicalLeaves.cid,
        // Incluir dados do usuário
        userName: users.fullName,
        userUnit: users.workUnit
      })
      .from(medicalLeaves)
      .leftJoin(users, eq(medicalLeaves.userId, users.id))
      .orderBy(desc(medicalLeaves.createdAt));

    // Se não for admin, mostrar apenas os próprios atestados
    if (!isAdmin) {
      query = query.where(eq(medicalLeaves.userId, req.user.id));
    }

    const leaves = await query;
    res.json(leaves);
  } catch (error) {
    console.error("Error fetching medical leaves:", error);
    res.status(500).json({ 
      error: true,
      message: "Erro ao buscar atestados médicos"
    });
  }
});

// Buscar atestado específico
router.get("/:id", async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado"
      });
    }

    const { id } = req.params;
    const [leave] = await db
      .select()
      .from(medicalLeaves)
      .where(eq(medicalLeaves.id, parseInt(id)));

    if (!leave) {
      return res.status(404).json({
        error: true,
        message: "Atestado médico não encontrado"
      });
    }

    // Verificar permissão (próprio usuário ou admin/RH)
    if (leave.userId !== req.user.id && req.user.role !== "admin" && req.user.role !== "hr") {
      return res.status(403).json({
        error: true,
        message: "Sem permissão para acessar este atestado"
      });
    }

    res.json(leave);
  } catch (error) {
    console.error("Error fetching medical leave:", error);
    res.status(500).json({ 
      error: true,
      message: "Erro ao buscar atestado médico"
    });
  }
});

// Atualizar status do atestado (apenas admin/RH)
router.patch("/:id/status", async (req: express.Request, res: express.Response) => {
  try {
    if (!req.user?.id || (req.user.role !== "admin" && req.user.role !== "hr")) {
      return res.status(403).json({
        error: true,
        message: "Sem permissão para atualizar status"
      });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({
        error: true,
        message: "Status inválido"
      });
    }

    const [updatedLeave] = await db
      .update(medicalLeaves)
      .set({ 
        status,
        updatedAt: new Date()
      })
      .where(eq(medicalLeaves.id, parseInt(id)))
      .returning();

    res.json(updatedLeave);
  } catch (error) {
    console.error("Error updating medical leave status:", error);
    res.status(500).json({ 
      error: true,
      message: "Erro ao atualizar status do atestado"
    });
  }
});


router.get("/medical-leaves/analytics", async (req, res) => {
  try {
    const analytics = await getMedicalLeaveAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Error fetching medical leave analytics:", error);
    res.status(500).json({ 
      error: true,
      message: "Erro ao buscar estatísticas de atestados médicos"
    });
  }
});

export default router;