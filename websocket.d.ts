import { Server } from "http";
import { User } from "../shared/schema.js";
declare class NotificationServer {
    private wss;
    private clients;
    constructor(server: Server);
    private addClient;
    private removeClient;
    private handleChatMessage;
    private markMessageAsRead;
    sendToUser(userId: number, data: any): void;
    sendNotification(userId: number, notification: any): void;
    broadcastToRole(role: User["role"], notification: any): void;
}
export declare function setupWebSocket(server: Server): NotificationServer;
export declare function getNotificationServer(): NotificationServer;
export {};
//# sourceMappingURL=websocket.d.ts.map