import { Router } from "express";
import { storage } from "../storage.js";
const router = Router();
// Obter todas as solicitações com filtros
router.get("/api/requests", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== "hr" && req.user.role !== "admin")) {
        return res.status(401).json({
            error: true,
            message: "Usuário não autenticado ou sem permissão"
        });
    }
    try {
        console.log("Recebendo requisição para listar solicitações:", {
            filtros: req.query,
            usuário: req.user?.id
        });
        const requests = await storage.getAllRequests({
            status: req.query.status,
        });
        console.log(`Encontradas ${requests.length} solicitações`);
        res.json(requests);
    }
    catch (error) {
        console.error("Error getting requests:", error);
        res.status(500).json({ error: error.message });
    }
});
// Atualizar status de uma solicitação
router.patch("/api/requests/:id", async (req, res) => {
    if (!req.isAuthenticated() || (req.user.role !== "hr" && req.user.role !== "admin")) {
        return res.status(401).json({
            error: true,
            message: "Usuário não autenticado ou sem permissão"
        });
    }
    const requestId = parseInt(req.params.id);
    if (isNaN(requestId)) {
        return res.status(400).json({ error: "ID de solicitação inválido" });
    }
    try {
        console.log("Atualizando solicitação:", {
            id: requestId,
            status: req.body.status,
            usuário: req.user?.id
        });
        const request = await storage.updateMedicalLeave(requestId, {
            status: req.body.status,
            reviewedAt: new Date(),
            reviewedBy: req.user?.id
        });
        // Enviar notificação para o usuário
        await storage.createNotification({
            userId: request.userId,
            type: req.body.status === "approved" ? "request_approved" : "request_rejected",
            title: req.body.status === "approved" ? "Solicitação Aprovada" : "Solicitação Rejeitada",
            message: req.body.status === "approved"
                ? "Sua solicitação foi aprovada pelo RH."
                : `Sua solicitação foi rejeitada. Motivo: ${req.body.rejectionReason}`,
            read: false,
            createdAt: new Date(),
        });
        res.json(request);
    }
    catch (error) {
        console.error("Error updating request:", error);
        res.status(500).json({ error: error.message });
    }
});
export default router;
//# sourceMappingURL=hr-approvals.js.map