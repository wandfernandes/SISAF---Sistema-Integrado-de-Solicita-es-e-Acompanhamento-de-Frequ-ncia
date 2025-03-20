export declare function createNotification(data: {
    userId: number;
    type: "vacation_scheduled" | "vacation_deadline" | "vacation_approved" | "vacation_rejected" | "info" | "warning" | "urgent" | "reminder";
    title: string;
    message: string;
}): Promise<any>;
export declare function getUnreadNotifications(userId: number): Promise<any>;
export declare function markNotificationAsRead(id: number): Promise<any>;
export declare function getAllNotifications(): Promise<any>;
export declare function sendNotifications(data: {
    type: string;
    title: string;
    message: string;
    userIds: number[];
}): Promise<{
    success: boolean;
    count: any;
}>;
export declare function checkVacationDeadlines(): Promise<void>;
//# sourceMappingURL=notifications.d.ts.map