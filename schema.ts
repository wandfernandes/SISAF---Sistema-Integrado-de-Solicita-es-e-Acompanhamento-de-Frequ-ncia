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
  contractType: text("contract_type", { enum: ["temporary", "permanent"] }),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Medical Leave table
export const medicalLeaves = pgTable("medical_leaves", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  reason: text("reason").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  doctorName: text("doctor_name"),
  cid: text("cid"),
  attachmentUrl: text("attachment_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type inference
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type MedicalLeave = typeof medicalLeaves.$inferSelect;
export type NewMedicalLeave = typeof medicalLeaves.$inferInsert;

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

// Medical Leave schema validation
export const insertMedicalLeaveSchema = createInsertSchema(medicalLeaves)
  .pick({
    userId: true,
    startDate: true,
    endDate: true,
    reason: true,
    doctorName: true,
    cid: true,
    attachmentUrl: true,
  })
  .extend({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    reason: z.string().min(1, "Motivo é obrigatório"),
    doctorName: z.string().optional(),
    cid: z.string().optional(),
    attachmentUrl: z.string().url().optional(),
  });

// Login validation schema
export const loginSchema = z.object({
  username: z.string().min(1, "Username é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  userId: serial("user_id").references(() => users.id),
  amount: text("amount").notNull(),
  description: text("description").notNull(),
  date: timestamp("date").notNull(),
  status: text("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Type inference for payments
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;

// Payment schema validation
export const insertPaymentSchema = createInsertSchema(payments)
  .pick({
    userId: true,
    amount: true,
    description: true,
    date: true,
  })
  .extend({
    date: z.coerce.date(),
    amount: z.string().min(1, "Valor é obrigatório"),
    description: z.string().min(1, "Descrição é obrigatória"),
  });

// Export types
export type LoginData = z.infer<typeof loginSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMedicalLeave = z.infer<typeof insertMedicalLeaveSchema>;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;