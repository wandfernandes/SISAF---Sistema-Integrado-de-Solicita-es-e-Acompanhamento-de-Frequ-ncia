import { pgTable, text, serial, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
// Users table
export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    username: text("username").notNull().unique(),
    password: text("password").notNull(),
    email: text("email").notNull().unique(),
    fullName: text("full_name").notNull(),
    cpf: text("cpf").unique(),
    workUnit: text("work_unit"),
    role: text("role", { enum: ["user", "hr", "admin"] }).notNull().default("user"),
    active: boolean("active").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
    id: serial("id").primaryKey(),
    senderId: serial("sender_id").references(() => users.id),
    receiverId: serial("receiver_id").references(() => users.id),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Licenses table
export const licenses = pgTable("licenses", {
    id: serial("id").primaryKey(),
    userId: serial("user_id").references(() => users.id),
    serverName: text("server_name").notNull(),
    workUnit: text("work_unit").notNull(),
    seiNumber: text("sei_number").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    returnDate: timestamp("return_date").notNull(),
    reason: text("reason").notNull(),
    status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
    observation: text("observation"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Notifications table
export const notifications = pgTable("notifications", {
    id: serial("id").primaryKey(),
    userId: serial("user_id").references(() => users.id),
    type: text("type", {
        enum: ["request_approved", "request_rejected", "general"]
    }).notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    read: boolean("read").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// CID Categories table
export const cidCategories = pgTable("cid_categories", {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    description: text("description").notNull(),
    category: text("category").notNull(),
    isRestricted: boolean("is_restricted").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Medical Leave table
export const medicalLeaves = pgTable("medical_leaves", {
    id: serial("id").primaryKey(),
    userId: serial("user_id").references(() => users.id),
    issueDate: timestamp("issue_date").notNull(),
    leaveType: text("leave_type", { enum: ["days", "hours"] }).notNull(),
    leaveDuration: text("leave_duration").notNull(),
    period: text("period", { enum: ["morning", "afternoon", "full"] }).notNull(),
    isCompanion: boolean("is_companion").notNull().default(false),
    companionName: text("companion_name"),
    companionRelationship: text("companion_relationship"),
    documentUrl: text("document_url"),
    companionDocumentUrl: text("companion_document_url"),
    cidCode: text("cid_code"),
    cidDescription: text("cid_description"),
    cidRestricted: boolean("cid_restricted").notNull().default(false),
    status: text("status", { enum: ["pending", "approved", "rejected", "medical_board_required"] }).notNull().default("pending"),
    reviewedAt: timestamp("reviewed_at"),
    reviewedBy: serial("reviewed_by").references(() => users.id),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
// Schema validation
export const insertUserSchema = createInsertSchema(users)
    .pick({
    username: true,
    password: true,
    email: true,
    fullName: true,
    cpf: true,
    workUnit: true,
})
    .extend({
    username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    email: z.string().email("Email inválido"),
    fullName: z.string().min(1, "Nome completo é obrigatório"),
    cpf: z.string().length(11, "CPF deve ter 11 dígitos").optional(),
    workUnit: z.string().optional(),
});
// Notification schema validation
export const insertNotificationSchema = createInsertSchema(notifications)
    .pick({
    userId: true,
    type: true,
    title: true,
    message: true,
    read: true,
})
    .extend({
    type: z.enum(["request_approved", "request_rejected", "general"]),
    title: z.string().min(1, "Título é obrigatório"),
    message: z.string().min(1, "Mensagem é obrigatória"),
    read: z.boolean().default(false),
});
// Chat Message schema validation
export const insertChatMessageSchema = createInsertSchema(chatMessages)
    .pick({
    senderId: true,
    receiverId: true,
    message: true,
    read: true,
})
    .extend({
    message: z.string().min(1, "Message cannot be empty"),
});
// License schema validation
export const insertLicenseSchema = createInsertSchema(licenses)
    .pick({
    userId: true,
    serverName: true,
    workUnit: true,
    seiNumber: true,
    startDate: true,
    endDate: true,
    returnDate: true,
    reason: true,
    observation: true,
})
    .extend({
    serverName: z.string().min(1, "Server name is required"),
    workUnit: z.string().min(1, "Work unit is required"),
    seiNumber: z.string().min(1, "SEI number is required"),
    reason: z.string().min(1, "Reason is required"),
});
// CID Category schema validation
export const insertCIDCategorySchema = createInsertSchema(cidCategories)
    .pick({
    code: true,
    description: true,
    category: true,
    isRestricted: true,
})
    .extend({
    code: z.string().min(1, "Código CID é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
    category: z.string().min(1, "Categoria é obrigatória"),
    isRestricted: z.boolean().default(false),
});
// Medical Leave schema validation
export const insertMedicalLeaveSchema = createInsertSchema(medicalLeaves);
// Login validation schema
export const loginSchema = z.object({
    username: z.string().min(1, "Username é obrigatório"),
    password: z.string().min(1, "Senha é obrigatória"),
});
//# sourceMappingURL=schema.js.map