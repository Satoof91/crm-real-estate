import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomBytes } from "crypto";

// UUID generator function
function generateId() {
  return randomBytes(16).toString('hex');
}

export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default('user'),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const contacts = sqliteTable("contacts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  isWhatsAppEnabled: integer("is_whatsapp_enabled").notNull().default(1),
  email: text("email"),
  nationalId: text("national_id"),
  language: text("language").notNull().default('en'),
  status: text("status").notNull().default('prospect'),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const buildings = sqliteTable("buildings", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  totalUnits: integer("total_units").notNull().default(0),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const units = sqliteTable("units", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  buildingId: text("building_id").notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  unitNumber: text("unit_number").notNull(),
  type: text("type").notNull(),
  size: integer("size"),
  electricityNumber: text("electricity_number"),
  status: text("status").notNull().default('vacant'),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const contracts = sqliteTable("contracts", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  unitId: text("unit_id").notNull().references(() => units.id, { onDelete: 'cascade' }),
  contactId: text("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  rentAmount: text("rent_amount").notNull(),
  paymentFrequency: text("payment_frequency").notNull().default('monthly'),
  securityDeposit: text("security_deposit"),
  documentUrl: text("document_url"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const payments = sqliteTable("payments", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  contractId: text("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  dueDate: text("due_date").notNull(),
  amount: text("amount").notNull(),
  status: text("status").notNull().default('pending'),
  paidDate: text("paid_date"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// User-specific settings table
export const userSettings = sqliteTable("user_settings", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  key: text("key").notNull(),
  value: text("value").notNull(),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Notification Types
export const NotificationType = {
  PAYMENT_REMINDER: 'payment_reminder',
  PAYMENT_RECEIVED: 'payment_received',
  PAYMENT_OVERDUE: 'payment_overdue',
  MONTHLY_UNPAID_SUMMARY: 'monthly_unpaid_summary',
  CONTRACT_EXPIRING: 'contract_expiring',
  CONTRACT_EXPIRED: 'contract_expired',
  CONTRACT_RENEWED: 'contract_renewed',
  MAINTENANCE_SCHEDULED: 'maintenance_scheduled',
  MAINTENANCE_COMPLETED: 'maintenance_completed',
  ANNOUNCEMENT: 'announcement',
  WELCOME: 'welcome',
  SYSTEM_ALERT: 'system_alert',
} as const;

export const NotificationStatus = {
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
} as const;

export const NotificationChannel = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  SMS: 'sms',
  IN_APP: 'in_app',
  INTERNAL: 'internal',
} as const;

// Notifications table for SQLite
export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey().$defaultFn(() => generateId()),
  type: text("type").notNull(),
  channel: text("channel").notNull(),
  status: text("status").notNull().default('pending'),
  recipientId: text("recipient_id").notNull(),
  recipientPhone: text("recipient_phone"),
  recipientEmail: text("recipient_email"),
  recipientName: text("recipient_name"),
  subject: text("subject"),
  message: text("message").notNull(),
  templateId: text("template_id"),
  templateData: text("template_data"),
  metadata: text("metadata"),
  scheduledFor: text("scheduled_for"),
  sentAt: text("sent_at"),
  deliveredAt: text("delivered_at"),
  readAt: text("read_at"),
  failedAt: text("failed_at"),
  failureReason: text("failure_reason"),
  retryCount: integer("retry_count").default(0),
  whatsappMessageId: text("whatsapp_message_id"),
  whatsappStatus: text("whatsapp_status"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

// Schema types - keep the same as PostgreSQL for compatibility
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

export const insertContactSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(1),
  isWhatsAppEnabled: z.union([z.number().int().min(0).max(1), z.boolean()]).transform(val =>
    typeof val === 'boolean' ? (val ? 1 : 0) : val
  ).default(1),
  email: z.string().optional(),
  nationalId: z.string().optional(),
  language: z.string().default('en'),
  status: z.string().default('prospect'),
});

export const insertBuildingSchema = createInsertSchema(buildings).omit({ id: true, createdAt: true, userId: true });
export const insertUnitSchema = createInsertSchema(units).omit({ id: true, createdAt: true });

// Contract schema that handles dates properly
const baseContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertContractSchema = baseContractSchema.extend({
  startDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()).transform(date => date.toISOString()),
  endDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()).transform(date => date.toISOString()),
  rentAmount: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'string' ? val : val.toString()
  ),
  securityDeposit: z.union([z.string(), z.number()]).optional().transform(val =>
    val === undefined ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
});

// Payment schema that handles dates and amounts properly for SQLite
const basePaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });
export const insertPaymentSchema = basePaymentSchema.extend({
  dueDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()).transform(date => date.toISOString()),
  amount: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'string' ? val : val.toString()
  ),
  paidDate: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional()).transform(date => date ? date.toISOString() : undefined),
});

// Update schemas
export const updateContactSchema = insertContactSchema.partial();
export const updateBuildingSchema = insertBuildingSchema.partial();
export const updateUnitSchema = insertUnitSchema.partial();

// Special handling for updateContractSchema to ensure transformations work with partial fields
export const updateContractSchema = z.object({
  unitId: z.string().optional(),
  contactId: z.string().optional(),
  startDate: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional()).transform(date => date ? date.toISOString() : undefined),
  endDate: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional()).transform(date => date ? date.toISOString() : undefined),

  rentAmount: z.union([z.string(), z.number()]).optional().transform(val =>
    val === undefined ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
  securityDeposit: z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
    val === undefined || val === null ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
  paymentFrequency: z.string().optional(),
  documentUrl: z.string().optional(),
});

// Special handling for updatePaymentSchema to ensure transformations work with partial fields
export const updatePaymentSchema = z.object({
  contractId: z.string().optional(),
  dueDate: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional()).transform(date => date ? date.toISOString() : undefined),
  amount: z.union([z.string(), z.number()]).optional().transform(val =>
    val === undefined ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
  status: z.string().optional(),
  paidDate: z.preprocess((val) => {
    if (val === undefined || val === null) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional().nullable()).transform(date => date ? date.toISOString() : undefined),
});

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;
export type Building = typeof buildings.$inferSelect;
export type InsertBuilding = z.infer<typeof insertBuildingSchema>;
export type Unit = typeof units.$inferSelect;
export type InsertUnit = z.infer<typeof insertUnitSchema>;
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = z.infer<typeof insertContractSchema>;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;