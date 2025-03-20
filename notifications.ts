import { Router } from "express";
import { getUnreadNotifications, markNotificationAsRead, getAllNotifications, sendNotifications } from "../services/notifications.js";

const router = Router();

// Buscar notificações não lidas
router.get("/notifications", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    const notifications = await getUnreadNotifications(req.user!.id);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// Marcar notificação como lida
router.patch("/notifications/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    const notification = await markNotificationAsRead(id);
    res.json(notification);
  } catch (error) {
    console.error("Error updating notification:", error);
    res.status(500).json({ error: "Erro ao atualizar notificação" });
  }
});

// Nova rota - Buscar todas as notificações (para administradores)
router.get("/notifications/all", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  // Verificar se o usuário tem permissão (admin ou RH)
  if (req.user!.role !== "admin" && req.user!.role !== "hr") {
    return res.status(403).json({ error: "Acesso não autorizado" });
  }

  try {
    const notifications = await getAllNotifications();
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching all notifications:", error);
    res.status(500).json({ error: "Erro ao buscar todas as notificações" });
  }
});

// Nova rota - Enviar notificações
router.post("/notifications/send", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  // Verificar se o usuário tem permissão (admin ou RH)
  if (req.user!.role !== "admin" && req.user!.role !== "hr") {
    return res.status(403).json({ error: "Acesso não autorizado" });
  }

  try {
    const { type, title, message, userIds } = req.body;

    // Validação básica
    if (!type || !title || !message) {
      return res.status(400).json({ error: "Tipo, título e mensagem são obrigatórios" });
    }

    // Enviar notificações
    const result = await sendNotifications({
      type,
      title,
      message,
      userIds: userIds || [],
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error sending notifications:", error);
    res.status(500).json({ error: "Erro ao enviar notificações" });
  }
});

export default router;