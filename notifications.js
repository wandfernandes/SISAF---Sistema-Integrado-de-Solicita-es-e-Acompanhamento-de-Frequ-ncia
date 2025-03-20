import { db } from "../db";
import { notifications, users, vacationPeriods } from "@shared/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { addDays, format } from "date-fns";
export async function createNotification(data) {
    const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();
    return notification;
}
export async function getUnreadNotifications(userId) {
    return await db
        .select()
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
        .orderBy(notifications.createdAt);
}
export async function markNotificationAsRead(id) {
    const [notification] = await db
        .update(notifications)
        .set({ read: true, updatedAt: new Date() })
        .where(eq(notifications.id, id))
        .returning();
    return notification;
}
// Nova função para obter todas as notificações (para administradores)
export async function getAllNotifications() {
    const notificationsData = await db
        .select({
        notification: notifications,
        userName: users.fullName,
    })
        .from(notifications)
        .leftJoin(users, eq(notifications.userId, users.id))
        .orderBy(notifications.createdAt);
    return notificationsData.map(({ notification, userName }) => ({
        ...notification,
        userName: userName || "Usuário deletado",
    }));
}
// Nova função para enviar notificações para múltiplos usuários ou para todos
export async function sendNotifications(data) {
    const { type, title, message, userIds } = data;
    // Se userIds estiver vazio, envia para todos os usuários
    if (userIds.length === 0) {
        // Buscar todos os usuários
        const allUsers = await db.select({ id: users.id }).from(users);
        // Criar notificações para cada usuário
        const notificationPromises = allUsers.map((user) => createNotification({
            userId: user.id,
            type: type, // Conversão necessária devido à tipagem
            title,
            message,
        }));
        await Promise.all(notificationPromises);
        return { success: true, count: allUsers.length };
    }
    else {
        // Criar notificações para usuários específicos
        const notificationPromises = userIds.map((userId) => createNotification({
            userId,
            type: type, // Conversão necessária devido à tipagem
            title,
            message,
        }));
        await Promise.all(notificationPromises);
        return { success: true, count: userIds.length };
    }
}
export async function checkVacationDeadlines() {
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    // Buscar férias que vencem em 30 dias
    const deadlineVacations = await db
        .select({
        vacation: vacationPeriods,
        user: users,
    })
        .from(vacationPeriods)
        .innerJoin(users, eq(vacationPeriods.userId, users.id))
        .where(and(eq(vacationPeriods.status, "approved"), gte(vacationPeriods.deadlineDate, today), lte(vacationPeriods.deadlineDate, thirtyDaysFromNow)));
    // Criar notificações para cada período
    for (const { vacation, user } of deadlineVacations) {
        await createNotification({
            userId: user.id,
            type: "vacation_deadline",
            title: "Férias próximas do vencimento",
            message: `Suas férias vencem em ${format(vacation.deadlineDate, 'dd/MM/yyyy')}. Por favor, agende seu período de gozo.`,
        });
        // Notificar admin/RH
        const hrUsers = await db
            .select()
            .from(users)
            .where(eq(users.role, "hr"));
        for (const hrUser of hrUsers) {
            await createNotification({
                userId: hrUser.id,
                type: "vacation_deadline",
                title: "Férias de funcionário próximas do vencimento",
                message: `As férias de ${user.fullName} vencem em ${format(vacation.deadlineDate, 'dd/MM/yyyy')}.`,
            });
        }
    }
}
//# sourceMappingURL=notifications.js.map