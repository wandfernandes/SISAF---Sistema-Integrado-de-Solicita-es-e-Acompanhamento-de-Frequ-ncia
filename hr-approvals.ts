import { Router } from "express";
import { storage } from "../storage.js";
import { Request as RequestModel } from "@shared/schema.js";

const router = Router();

// Obter todas as solicitações com filtros
router.get("/api/requests", async (req, res) => {
  if (!req.isAuthenticated() || (req.user!.role !== "hr" && req.user!.role !== "admin")) {
    return res.status(401).json({
      error: true,
      message: "Usuário não autenticado"
    });
  }

  try {
    console.log("Recebendo requisição para listar solicitações:", {
      filtros: req.query,
      usuário: req.user?.username
    });

    const requests = await storage.getAllRequests({
      type: req.query.type as string,
      status: req.query.status as string,
    });

    console.log(`Encontradas ${requests.length} solicitações`);
    res.json(requests);
  } catch (error: any) {
    console.error("Error getting requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// Atualizar status de uma solicitação
router.patch("/api/requests/:id", async (req, res) => {
  if (!req.isAuthenticated() || (req.user!.role !== "hr" && req.user!.role !== "admin")) {
    return res.status(401).json({
      error: true,
      message: "Usuário não autenticado"
    });
  }

  const requestId = parseInt(req.params.id);
  if (isNaN(requestId)) {
    return res.status(400).json({ error: "Invalid request ID" });
  }

  try {
    console.log("Atualizando solicitação:", {
      id: requestId,
      status: req.body.status,
      usuário: req.user?.username
    });

    const request = await storage.updateRequest(requestId, {
      status: req.body.status,
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
    });

    res.json(request);
  } catch (error: any) {
    console.error("Error updating request:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;