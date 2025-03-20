import express from "express";
import { db } from "../db.js";
import { medicalLeaves, users } from "@shared/schema.js";
import { eq, desc, and } from "drizzle-orm";
import { storage } from "../storage.js";
const router = express.Router();
// Middleware de autenticação
const requireAuth = (req, res, next) => {
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
// Criar novo atestado médico com validação aprimorada
router.post("/", async (req, res) => {
    try {
        const { issueDate, leaveType, leaveDuration, period, isCompanion, companionName, companionRelationship, cidCode, cidDescription, cidRestricted } = req.body;
        if (!req.user?.id) {
            return res.status(401).json({
                error: true,
                message: "Usuário não autenticado"
            });
        }
        // Criar novo atestado
        const medicalLeave = {
            userId: req.user.id,
            issueDate: new Date(issueDate),
            leaveType: leaveType,
            leaveDuration,
            period: period,
            isCompanion,
            companionName,
            companionRelationship,
            cidCode,
            cidDescription,
            cidRestricted,
            status: "pending",
            createdAt: new Date()
        };
        const createdLeave = await storage.createMedicalLeave(medicalLeave);
        // Criar notificação para o usuário
        await storage.createNotification({
            userId: req.user.id,
            type: "general",
            title: "Novo Atestado Médico Submetido",
            message: "Seu atestado médico foi registrado e está aguardando aprovação.",
            read: false,
            createdAt: new Date()
        });
        // Criar notificação para o RH
        const hrUsers = await db
            .select()
            .from(users)
            .where(eq(users.role, "hr"));
        // Notificar todos os usuários do RH
        for (const hrUser of hrUsers) {
            await storage.createNotification({
                userId: hrUser.id,
                type: "general",
                title: "Novo Atestado Médico para Análise",
                message: "Um novo atestado médico foi submetido para aprovação.",
                read: false,
                createdAt: new Date()
            });
        }
        res.status(201).json(createdLeave);
    }
    catch (error) {
        console.error("Error creating medical leave:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao criar atestado médico"
        });
    }
});
// Listar atestados médicos com filtros avançados
router.get("/", async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(401).json({
                error: true,
                message: "Usuário não autenticado"
            });
        }
        const { status, startDate, endDate, cidCode, isCompanion, period, leaveType } = req.query;
        const isAdmin = req.user.role === "admin" || req.user.role === "hr";
        // Construir condições de filtro
        const conditions = [];
        if (status) {
            conditions.push(eq(medicalLeaves.status, status));
        }
        if (startDate) {
            conditions.push(eq(medicalLeaves.issueDate, new Date(startDate)));
        }
        if (cidCode) {
            conditions.push(eq(medicalLeaves.cidCode, cidCode));
        }
        if (isCompanion !== undefined) {
            conditions.push(eq(medicalLeaves.isCompanion, isCompanion === 'true'));
        }
        if (period) {
            conditions.push(eq(medicalLeaves.period, period));
        }
        if (leaveType) {
            conditions.push(eq(medicalLeaves.leaveType, leaveType));
        }
        // Se não for admin, mostrar apenas os próprios atestados
        if (!isAdmin) {
            conditions.push(eq(medicalLeaves.userId, req.user.id));
        }
        // Construir query base com join para dados do usuário
        const query = db
            .select({
            id: medicalLeaves.id,
            userId: medicalLeaves.userId,
            issueDate: medicalLeaves.issueDate,
            leaveType: medicalLeaves.leaveType,
            leaveDuration: medicalLeaves.leaveDuration,
            period: medicalLeaves.period,
            isCompanion: medicalLeaves.isCompanion,
            companionName: medicalLeaves.companionName,
            companionRelationship: medicalLeaves.companionRelationship,
            documentUrl: medicalLeaves.documentUrl,
            cidCode: medicalLeaves.cidCode,
            cidDescription: medicalLeaves.cidDescription,
            cidRestricted: medicalLeaves.cidRestricted,
            status: medicalLeaves.status,
            reviewedAt: medicalLeaves.reviewedAt,
            reviewedBy: medicalLeaves.reviewedBy,
            createdAt: medicalLeaves.createdAt,
            // Dados do usuário
            userName: users.fullName,
            userWorkUnit: users.workUnit,
            userRole: users.role
        })
            .from(medicalLeaves)
            .leftJoin(users, eq(medicalLeaves.userId, users.id))
            .where(and(...conditions))
            .orderBy(desc(medicalLeaves.createdAt));
        const leaves = await query;
        console.log(`[Medical Leaves] Encontrados ${leaves.length} atestados médicos`);
        res.json(leaves);
    }
    catch (error) {
        console.error("Error fetching medical leaves:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao buscar atestados médicos"
        });
    }
});
// Atualizar status do atestado e enviar notificação
router.patch("/:id/status", async (req, res) => {
    try {
        if (!req.user?.id || (req.user.role !== "admin" && req.user.role !== "hr")) {
            return res.status(403).json({
                error: true,
                message: "Sem permissão para atualizar status"
            });
        }
        const { id } = req.params;
        const { status, rejectionReason } = req.body;
        if (!["pending", "approved", "rejected", "medical_board_required"].includes(status)) {
            return res.status(400).json({
                error: true,
                message: "Status inválido"
            });
        }
        // Atualizar o atestado médico com timestamp de revisão
        const leave = await storage.updateMedicalLeave(parseInt(id), {
            status: status,
            reviewedAt: new Date(),
            reviewedBy: req.user.id
        });
        // Criar notificação apropriada para o usuário
        const notification = {
            userId: leave.userId,
            type: status === "approved" ? "request_approved" : "request_rejected",
            title: status === "approved"
                ? "Atestado Médico Aprovado"
                : status === "medical_board_required"
                    ? "Perícia Médica Requerida"
                    : "Atestado Médico Rejeitado",
            message: status === "approved"
                ? "Seu atestado médico foi aprovado."
                : status === "medical_board_required"
                    ? "Seu atestado médico requer avaliação da perícia médica. Aguarde mais informações."
                    : `Seu atestado médico foi rejeitado. ${rejectionReason ? `Motivo: ${rejectionReason}` : ''}`,
            read: false,
            createdAt: new Date(),
        };
        await storage.createNotification(notification);
        res.json(leave);
    }
    catch (error) {
        console.error("Error updating medical leave status:", error);
        res.status(500).json({
            error: true,
            message: "Erro ao atualizar status do atestado"
        });
    }
});
export default router;
//# sourceMappingURL=medical-leaves.js.map