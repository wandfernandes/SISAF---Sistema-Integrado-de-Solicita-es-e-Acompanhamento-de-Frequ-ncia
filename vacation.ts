import { Router } from "express";
import { storage } from "../storage";
import { insertVacationPeriodSchema } from "../../shared/schema";
import { getVacationAnalytics } from "../services/analytics";
import { eq } from "drizzle-orm";
import { createNotification } from "../services/notifications";
import db from "../db.js"; // Corrected import statement
import { vacationPeriods, users } from "../../shared/schema";

const router = Router();

// Get vacation analytics - RESTRINGIR APENAS PARA ADMIN/HR
router.get("/vacation/analytics", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  // Verificação adicional - apenas admin/HR pode acessar analytics
  if (req.user!.role !== "admin" && req.user!.role !== "hr") {
    console.log("Acesso não autorizado a analytics por:", req.user!.username);
    return res.sendStatus(403);
  }

  try {
    const analytics = await getVacationAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error("Error getting vacation analytics:", error);
    res.status(500).json({ error: "Erro ao buscar estatísticas de férias" });
  }
});

// Get pending vacation periods for approval
router.get("/vacation-periods/pending", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  if (!["admin", "hr"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Permissão negada" });
  }

  try {
    const periods = await storage.getVacationPeriodsByStatus("pending");
    res.json(periods);
  } catch (error) {
    console.error("Error getting pending vacation periods:", error);
    res.status(500).json({ error: "Erro ao buscar períodos de férias pendentes" });
  }
});

// Create new vacation period
router.post("/vacation-periods", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    console.log("Recebendo payload:", req.body);

    const parsedData = insertVacationPeriodSchema.safeParse(req.body);

    if (!parsedData.success) {
      return res.status(400).json({
        error: "Dados inválidos",
        details: parsedData.error.errors
      });
    }

    const data = parsedData.data;

    if (!["admin", "hr"].includes(req.user!.role) && data.userId !== req.user!.id) {
      return res.status(403).json({ error: "Permissão negada" });
    }

    // Criar período de férias com todos os campos esperados
    const period = await storage.createVacationPeriod({
      userId: data.userId,
      acquisitionPeriod: data.acquisitionPeriod,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      returnDate: new Date(data.returnDate),
      totalDays: data.totalDays,
      remainingDays: data.remainingDays || 30,
      daysUsed: data.daysUsed || 0,
      status: data.status || "pending",
      observation: data.observation || null,
      seiNumber: data.seiNumber || null,
      reviewedBy: data.reviewedBy || null,
      reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : null
    });

    // Notificar o usuário que sua solicitação foi recebida
    await createNotification({
      userId: data.userId,
      type: "info",
      title: "Solicitação de férias recebida",
      message: `Sua solicitação de férias de ${data.totalDays} dias, com início em ${new Date(data.startDate).toLocaleDateString('pt-BR')} foi recebida e está pendente de aprovação.`
    });

    // Notificar HR/admin sobre a nova solicitação
    const hrUsers = await storage.getUsersByRole(["admin", "hr"]);
    for (const hrUser of hrUsers) {
      // Não enviar notificação para o próprio usuário se ele for HR/admin
      if (hrUser.id !== data.userId) {
        await createNotification({
          userId: hrUser.id,
          type: "reminder",
          title: "Nova solicitação de férias",
          message: `${req.user!.fullName} solicitou ${data.totalDays} dias de férias com início em ${new Date(data.startDate).toLocaleDateString('pt-BR')}.`
        });
      }
    }

    res.status(201).json(period);
  } catch (error: any) {
    console.error("Error creating vacation period:", error);
    res.status(400).json({
      error: error instanceof Error ? error.message : "Erro ao criar período de férias"
    });
  }
});

// Get all vacation periods or user's vacation periods
router.get("/vacation-periods", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    let periods;

    if (req.user!.role === "admin" || req.user!.role === "hr") {
      // Para admin/HR, buscar todos os períodos com os nomes de usuário
      periods = await db
        .select({
          id: vacationPeriods.id,
          userId: vacationPeriods.userId,
          userName: users.fullName,
          userWorkUnit: users.workUnit,
          acquisitionPeriod: vacationPeriods.acquisitionPeriod,
          startDate: vacationPeriods.startDate,
          endDate: vacationPeriods.endDate,
          returnDate: vacationPeriods.returnDate,
          totalDays: vacationPeriods.totalDays,
          remainingDays: vacationPeriods.remainingDays,
          daysUsed: vacationPeriods.daysUsed,
          isTaken: vacationPeriods.isTaken,
          isExpired: vacationPeriods.isExpired,
          status: vacationPeriods.status,
          observation: vacationPeriods.observation,
          seiNumber: vacationPeriods.seiNumber,
          reviewedBy: vacationPeriods.reviewedBy,
          reviewedAt: vacationPeriods.reviewedAt,
          createdAt: vacationPeriods.createdAt,
          updatedAt: vacationPeriods.updatedAt
        })
        .from(vacationPeriods)
        .leftJoin(users, eq(vacationPeriods.userId, users.id))
        .orderBy(vacationPeriods.startDate);
    } else {
      // Para usuários normais, buscar apenas os próprios períodos
      periods = await db
        .select({
          id: vacationPeriods.id,
          userId: vacationPeriods.userId,
          userName: users.fullName,
          userWorkUnit: users.workUnit,
          acquisitionPeriod: vacationPeriods.acquisitionPeriod,
          startDate: vacationPeriods.startDate,
          endDate: vacationPeriods.endDate,
          returnDate: vacationPeriods.returnDate,
          totalDays: vacationPeriods.totalDays,
          remainingDays: vacationPeriods.remainingDays,
          daysUsed: vacationPeriods.daysUsed,
          isTaken: vacationPeriods.isTaken,
          isExpired: vacationPeriods.isExpired,
          status: vacationPeriods.status,
          observation: vacationPeriods.observation,
          seiNumber: vacationPeriods.seiNumber,
          reviewedBy: vacationPeriods.reviewedBy,
          reviewedAt: vacationPeriods.reviewedAt,
          createdAt: vacationPeriods.createdAt,
          updatedAt: vacationPeriods.updatedAt
        })
        .from(vacationPeriods)
        .leftJoin(users, eq(vacationPeriods.userId, users.id))
        .where(eq(vacationPeriods.userId, req.user!.id))
        .orderBy(vacationPeriods.startDate);
    }

    res.json(periods);
  } catch (error) {
    console.error("Error getting vacation periods:", error);
    res.status(500).json({ error: "Erro ao buscar períodos de férias" });
  }
});

// Rota para edição de períodos de férias (apenas usuário dono ou admin/HR)
router.patch("/vacation-periods/:id/edit", async (req, res) => {
  try {
    console.log("Edição de período de férias:", req.params.id);
    console.log("Usuário autenticado:", req.user);
    console.log("Dados recebidos:", req.body);

    const { id } = req.params;

    // Verificar autenticação do usuário
    if (!req.isAuthenticated()) {
      return res.status(401).json({
        error: true,
        message: "Usuário não autenticado"
      });
    }

    // Buscar o período de férias atual para verificar permissões
    const currentPeriod = await storage.getVacationPeriod(parseInt(id));

    if (!currentPeriod) {
      return res.status(404).json({
        error: true,
        message: "Período de férias não encontrado"
      });
    }

    // Verificar se o usuário tem permissão para editar
    // (apenas o dono do período ou admin/HR podem editar)
    const isAdmin = req.user!.role === "admin" || req.user!.role === "hr";
    if (currentPeriod.userId !== req.user!.id && !isAdmin) {
      return res.status(403).json({
        error: true,
        message: "Sem permissão para editar este período de férias"
      });
    }

    // Verificar se o período já está aprovado ou rejeitado
    if (currentPeriod.status !== "pending") {
      return res.status(400).json({
        error: true,
        message: "Não é possível editar um período de férias que já foi aprovado ou rejeitado"
      });
    }

    // Atualizar o período
    const updatedPeriod = await storage.updateVacationPeriod(parseInt(id), {
      acquisitionPeriod: req.body.acquisitionPeriod,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate),
      returnDate: new Date(req.body.returnDate),
      totalDays: req.body.totalDays,
      remainingDays: req.body.remainingDays || 30,
      daysUsed: req.body.daysUsed || 0,
      observation: req.body.observation || null,
      // Não atualizar status, seiNumber, reviewedBy ou reviewedAt
    });

    // Notificar o HR/admin sobre a atualização
    if (isAdmin && req.user!.id !== currentPeriod.userId) {
      // Buscar o nome do dono do período
      const periodOwner = await storage.getUser(currentPeriod.userId);

      await createNotification({
        userId: req.user!.id,
        type: "info",
        title: "Período de férias atualizado",
        message: `O período de férias de ${periodOwner?.fullName || "um usuário"} foi atualizado.`
      });
    }

    res.json(updatedPeriod);
  } catch (error) {
    console.error("Error updating vacation period:", error);
    res.status(500).json({
      error: true,
      message: error instanceof Error ? error.message : "Erro ao atualizar período de férias"
    });
  }
});

// Update vacation period status
router.patch("/vacation-periods/:id", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  if (!["admin", "hr"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Permissão negada" });
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // Obter o período de férias atual
    const currentPeriod = await storage.getVacationPeriod(id);
    if (!currentPeriod) {
      return res.status(404).json({ error: "Período de férias não encontrado" });
    }

    // Atualizar o período
    const period = await storage.updateVacationPeriod(id, {
      ...req.body,
      reviewedBy: req.user!.id,
      reviewedAt: new Date(),
    });

    // Enviar notificação ao usuário sobre a atualização do status
    const statusText = req.body.status === "approved" ? "aprovado" : "rejeitado";
    const notificationType = req.body.status === "approved" ? "vacation_approved" : "vacation_rejected";

    await createNotification({
      userId: currentPeriod.userId,
      type: notificationType as any,
      title: `Solicitação de férias ${statusText}`,
      message: `Sua solicitação de férias com início em ${new Date(currentPeriod.startDate).toLocaleDateString('pt-BR')} foi ${statusText}${req.body.observation ? `. Observação: ${req.body.observation}` : ''}.`
    });

    res.json(period);
  } catch (error) {
    console.error("Error updating vacation period:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao atualizar período de férias"
    });
  }
});

// Nova rota para marcar férias como "gozadas"
router.patch("/vacation-periods/:id/mark-taken", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  if (!["admin", "hr"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Permissão negada" });
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // Buscar o período atual para enviar notificação
    const currentPeriod = await storage.getVacationPeriod(id);
    if (!currentPeriod) {
      return res.status(404).json({ error: "Período de férias não encontrado" });
    }

    // Marcar como gozadas
    const period = await storage.markVacationAsTaken(id);

    // Enviar notificação ao usuário
    await createNotification({
      userId: currentPeriod.userId,
      type: "info",
      title: "Férias marcadas como gozadas",
      message: `Seu período de férias com início em ${new Date(currentPeriod.startDate).toLocaleDateString('pt-BR')} foi marcado como gozado.`
    });

    res.json(period);
  } catch (error) {
    console.error("Error marking vacation as taken:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao marcar férias como gozadas"
    });
  }
});

// Nova rota para marcar férias como "vencidas"
router.patch("/vacation-periods/:id/mark-expired", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  if (!["admin", "hr"].includes(req.user!.role)) {
    return res.status(403).json({ error: "Permissão negada" });
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "ID inválido" });
  }

  try {
    // Buscar o período atual para enviar notificação
    const currentPeriod = await storage.getVacationPeriod(id);
    if (!currentPeriod) {
      return res.status(404).json({ error: "Período de férias não encontrado" });
    }

    // Marcar como vencido
    const period = await storage.markVacationAsExpired(id);

    // Enviar notificação ao usuário
    await createNotification({
      userId: currentPeriod.userId,
      type: "warning",
      title: "Férias marcadas como vencidas",
      message: `Seu período de férias com início em ${new Date(currentPeriod.startDate).toLocaleDateString('pt-BR')} foi marcado como vencido. Entre em contato com o RH para mais informações.`
    });

    res.json(period);
  } catch (error) {
    console.error("Error marking vacation as expired:", error);
    res.status(500).json({
      error: error instanceof Error ? error.message : "Erro ao marcar férias como vencidas"
    });
  }
});

// Nova rota para obter férias vencidas
router.get("/vacation-periods/expired", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    // Para usuários comuns, retornar apenas suas próprias férias vencidas
    // Para admin/HR, retornar todas as férias vencidas
    const userId = !["admin", "hr"].includes(req.user!.role) ? req.user!.id : undefined;

    // Obter férias vencidas (implementar na storage)
    const expiredPeriods = await storage.getExpiredVacationPeriods(userId);

    res.json(expiredPeriods);
  } catch (error) {
    console.error("Error getting expired vacation periods:", error);
    res.status(500).json({ error: "Erro ao buscar períodos de férias vencidas" });
  }
});

export default router;