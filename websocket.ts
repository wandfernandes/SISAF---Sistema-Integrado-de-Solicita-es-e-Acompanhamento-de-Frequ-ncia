import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { User } from "../shared/schema.js"; 
import { db } from "./db.js";
import { chatMessages } from "../shared/schema.js";
import { eq } from "drizzle-orm";

interface AuthenticatedWebSocket extends WebSocket {
  userId?: number;
}

class NotificationServer {
  private wss: WebSocketServer;
  private clients: Map<number, AuthenticatedWebSocket[]>;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.clients = new Map();

    this.wss.on("connection", (ws: AuthenticatedWebSocket) => {
      console.log("Client connected to WebSocket");

      ws.on("message", async (message: string) => {
        try {
          const data = JSON.parse(message.toString());
          console.log("WebSocket message received:", JSON.stringify(data, null, 2));

          // Autenticação
          if (data.type === "auth" && data.userId) {
            ws.userId = data.userId;
            this.addClient(data.userId, ws);
            console.log(`Client authenticated with userId: ${data.userId}`);
          }

          // Mensagem de chat
          else if (data.type === "chat" && ws.userId) {
            await this.handleChatMessage(ws.userId, data);
          }

          // Marcar mensagem como lida
          else if (data.type === "mark_read" && data.messageId && ws.userId) {
            await this.markMessageAsRead(data.messageId);
          }
        } catch (error) {
          console.error("Error processing WebSocket message:", error);
        }
      });

      ws.on("close", () => {
        if (ws.userId) {
          this.removeClient(ws.userId, ws);
        }
      });
    });
  }

  private addClient(userId: number, ws: AuthenticatedWebSocket) {
    const existingClients = this.clients.get(userId) || [];
    this.clients.set(userId, [...existingClients, ws]);
  }

  private removeClient(userId: number, ws: AuthenticatedWebSocket) {
    const existingClients = this.clients.get(userId) || [];
    this.clients.set(
      userId,
      existingClients.filter((client) => client !== ws)
    );
  }

  // Método para lidar com mensagens de chat
  private async handleChatMessage(senderId: number, data: any) {
    try {
      // Verificar se tem destinatário e mensagem
      if (!data.receiverId || data.receiverId <= 0) {
        console.error("Chat message missing valid receiverId");
        return;
      }

      if (!data.message || typeof data.message !== 'string' || !data.message.trim()) {
        console.error("Chat message is empty or invalid");
        return;
      }

      const receiverId = Number(data.receiverId);
      const messageText = data.message.trim();

      console.log(`Processing chat message from ${senderId} to ${receiverId}: "${messageText.substring(0, 30)}${messageText.length > 30 ? '...' : ''}"`);

      // Salvar a mensagem no banco de dados
      const [message] = await db.insert(chatMessages)
        .values({
          senderId,
          receiverId: receiverId,
          message: messageText,
          read: false,
        })
        .returning();

      // Preparar a mensagem para envio
      const chatMessageData = {
        type: "chat",
        messageId: message.id,
        senderId: message.senderId,
        message: message.message,
        createdAt: message.createdAt,
      };

      console.log(`Sending message to user ${data.receiverId}`);

      // Enviar para o destinatário
      this.sendToUser(data.receiverId, chatMessageData);
    } catch (error) {
      console.error("Error handling chat message:", error);
    }
  }

  // Marcar mensagem como lida
  private async markMessageAsRead(messageId: number) {
    try {
      await db.update(chatMessages)
        .set({ read: true })
        .where(eq(chatMessages.id, messageId));
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  }

  // Enviar mensagem para um usuário específico
  public sendToUser(userId: number, data: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify(data);
      let sentCount = 0;

      userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          sentCount++;
        }
      });

      console.log(`Message sent to ${sentCount} connection(s) for user ${userId}`);
    } else {
      console.log(`No active connections for user ${userId}`);
    }
  }

  public sendNotification(userId: number, notification: any) {
    const userClients = this.clients.get(userId);
    if (userClients) {
      const message = JSON.stringify(notification);
      let sentCount = 0;

      userClients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          sentCount++;
        }
      });

      console.log(`Notification sent to ${sentCount} connection(s) for user ${userId}`);
    } else {
      console.log(`No active connections for user ${userId} to send notification`);
    }
  }

  public broadcastToRole(role: User["role"], notification: any) {
    let totalRecipients = 0;
    let sentCount = 0;

    this.clients.forEach((clients, userId) => {
      totalRecipients++;
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(notification));
          sentCount++;
        }
      });
    });

    console.log(`Broadcast to role ${role}: sent to ${sentCount} connections across ${totalRecipients} users`);
  }
}

let notificationServer: NotificationServer;

export function setupWebSocket(server: Server) {
  console.log("Setting up WebSocket server...");
  notificationServer = new NotificationServer(server);
  console.log("WebSocket server initialized successfully");
  return notificationServer;
}

export function getNotificationServer() {
  if (!notificationServer) {
    throw new Error("Notification server not initialized");
  }
  return notificationServer;
}