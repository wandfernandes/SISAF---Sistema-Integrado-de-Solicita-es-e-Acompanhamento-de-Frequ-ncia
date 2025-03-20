import { Router } from "express";
import { db } from "../db.js";
import { chatMessages, users, User } from "@shared/schema.js";
import { eq, and, or, sql } from "drizzle-orm";
import { getNotificationServer } from "../websocket.js";

const router = Router();

// Obter mensagens de chat entre dois usuários
router.get("/chat/:userId", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  try {
    // Acesso seguro às propriedades do usuário com verificação de tipo
    const currentUser = req.user as User;
    const currentUserId = currentUser.id;
    const otherUserId = parseInt(req.params.userId, 10);

    if (isNaN(otherUserId)) {
      return res.status(400).json({ error: "ID do usuário inválido" });
    }

    // Buscar mensagens entre os dois usuários
    const messages = await db
      .select({
        id: chatMessages.id,
        senderId: chatMessages.senderId,
        message: chatMessages.message,
        read: chatMessages.read,
        createdAt: chatMessages.createdAt,
      })
      .from(chatMessages)
      .where(
        or(
          and(
            eq(chatMessages.senderId, currentUserId),
            eq(chatMessages.receiverId, otherUserId)
          ),
          and(
            eq(chatMessages.senderId, otherUserId),
            eq(chatMessages.receiverId, currentUserId)
          )
        )
      )
      .orderBy(chatMessages.createdAt);

    // Buscar informações do outro usuário
    const [otherUser] = await db
      .select({
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, otherUserId));

    // Mapear mensagens com informações adicionais
    const formattedMessages = messages.map((message) => {
      const isSentByMe = message.senderId === currentUserId;
      const senderName = isSentByMe ? "Você" : otherUser?.fullName || "Usuário";

      return {
        ...message,
        isSentByMe,
        senderName,
      };
    });

    res.json(formattedMessages);
  } catch (error) {
    console.error("Error fetching chat messages:", error);
    res.status(500).json({ error: "Erro ao buscar mensagens" });
  }
});

// Obter lista de conversas do usuário
router.get("/chat", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const currentUserId = req.user!.id;

  try {
    // Buscar dados de todos os usuários com quem conversou
    const conversations = await db
      .select({
        userId: users.id,
        userName: users.fullName,
        unreadCount: sql`COUNT(CASE WHEN ${chatMessages.read} = false AND ${chatMessages.receiverId} = ${currentUserId} THEN 1 END)`
      })
      .from(users)
      .innerJoin(
        chatMessages,
        or(
          and(
            eq(chatMessages.senderId, users.id),
            eq(chatMessages.receiverId, currentUserId)
          ),
          and(
            eq(chatMessages.receiverId, users.id),
            eq(chatMessages.senderId, currentUserId)
          )
        )
      )
      .groupBy(users.id);

    res.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    res.status(500).json({ error: "Erro ao buscar conversas" });
  }
});

// Enviar uma mensagem (via API HTTP, alternativa ao WebSocket)
router.post("/chat/:userId", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const senderId = req.user!.id;
  const receiverId = parseInt(req.params.userId, 10);
  const { message } = req.body;

  if (isNaN(receiverId)) {
    return res.status(400).json({ error: "ID do usuário inválido" });
  }

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Mensagem é obrigatória e não pode estar vazia" });
  }

  try {
    console.log(`Enviando mensagem de ${senderId} para ${receiverId}: ${message.substring(0, 20)}...`);

    // Salvar mensagem no banco de dados
    const [savedMessage] = await db
      .insert(chatMessages)
      .values({
        senderId,
        receiverId,
        message,
        read: false,
      })
      .returning();

    // Buscar informações do remetente
    const [sender] = await db
      .select({
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, senderId));

    // Enviar mensagem via WebSocket se disponível
    try {
      const notificationServer = getNotificationServer();
      notificationServer.sendToUser(receiverId, {
        type: "chat",
        messageId: savedMessage.id,
        senderId,
        senderName: sender?.fullName || "Usuário Desconhecido",
        message: savedMessage.message,
        createdAt: savedMessage.createdAt,
      });
    } catch (wsError) {
      console.error("WebSocket notification failed:", wsError);
      // Continua mesmo se o WebSocket falhar
    }

    res.status(201).json(savedMessage);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem" });
  }
});

// Enviar mensagem para todos os usuários (broadcast)
router.post("/chat/broadcast", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const senderId = req.user!.id;
  const { message } = req.body;

  // Verificar se a mensagem foi fornecida e não está vazia
  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: "Mensagem é obrigatória e não pode estar vazia" });
  }

  try {
    console.log(`Broadcast de mensagem de ${senderId}: ${message.substring(0, 20)}...`);

    // Buscar todos os usuários exceto o remetente
    const allUsers = await db
      .select()
      .from(users)
      .where(sql`${users.id} != ${senderId}`);

    if (allUsers.length === 0) {
      return res.status(200).json({ message: "Nenhum destinatário disponível" });
    }

    // Buscar informações do remetente
    const [sender] = await db
      .select({
        fullName: users.fullName,
      })
      .from(users)
      .where(eq(users.id, senderId));

    const senderName = sender?.fullName || "Usuário Desconhecido";
    const notificationServer = getNotificationServer();
    const insertPromises = [];

    // Criar mensagens para todos os usuários
    for (const user of allUsers) {
      // Inserir a mensagem no banco de dados
      const insertPromise = db
        .insert(chatMessages)
        .values({
          senderId,
          receiverId: user.id,
          message,
          read: false,
        })
        .returning()
        .then((result) => {
          const savedMessage = result[0];
          // Tentar enviar via WebSocket
          try {
            notificationServer.sendToUser(user.id, {
              type: "chat",
              messageId: savedMessage.id,
              senderId,
              senderName,
              message: savedMessage.message,
              createdAt: savedMessage.createdAt,
            });
          } catch (wsError) {
            console.error(`WebSocket notification failed for user ${user.id}:`, wsError);
            // Continua mesmo se o WebSocket falhar
          }
          return savedMessage;
        });

      insertPromises.push(insertPromise);
    }

    // Aguardar todas as inserções
    const results = await Promise.all(insertPromises);

    res.status(201).json({ 
      message: "Mensagem enviada a todos os usuários", 
      count: results.length 
    });
  } catch (error) {
    console.error("Error broadcasting message:", error);
    res.status(500).json({ error: "Erro ao enviar mensagem em massa" });
  }
});

// Marcar mensagens como lidas
router.patch("/chat/:userId/read", async (req, res) => {
  if (!req.isAuthenticated()) return res.sendStatus(401);

  const currentUserId = req.user!.id;
  const otherUserId = parseInt(req.params.userId, 10);

  if (isNaN(otherUserId)) {
    return res.status(400).json({ error: "ID do usuário inválido" });
  }

  try {
    // Marcar como lidas todas as mensagens recebidas do outro usuário
    const result = await db
      .update(chatMessages)
      .set({ read: true })
      .where(
        and(
          eq(chatMessages.senderId, otherUserId),
          eq(chatMessages.receiverId, currentUserId),
          eq(chatMessages.read, false)
        )
      );

    res.json({ updated: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    res.status(500).json({ error: "Erro ao marcar mensagens como lidas" });
  }
});

export default router;