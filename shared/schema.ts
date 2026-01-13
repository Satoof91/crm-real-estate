import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { randomBytes } from "crypto";

// UUID generator function compatible with both SQLite and PostgreSQL
// Uses crypto only on server side via $defaultFn
// This function will only be called server-side during inserts
function generateId() {
  return randomBytes(16).toString('hex');
}

export const users = pgTable("users", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default('user'), // admin, manager, user
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const contacts = pgTable("contacts", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  isWhatsAppEnabled: integer("is_whatsapp_enabled").notNull().default(1), // 1 for true, 0 for false (SQLite compatible)
  email: text("email"),
  nationalId: text("national_id"),
  language: text("language").notNull().default('en'),
  status: text("status").notNull().default('prospect'),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const buildings = pgTable("buildings", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  totalUnits: integer("total_units").notNull().default(0),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const units = pgTable("units", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  buildingId: varchar("building_id").notNull().references(() => buildings.id, { onDelete: 'cascade' }),
  unitNumber: text("unit_number").notNull(),
  type: text("type").notNull(),
  size: integer("size"),
  electricityNumber: text("electricity_number"),
  status: text("status").notNull().default('vacant'),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  unitId: varchar("unit_id").notNull().references(() => units.id, { onDelete: 'cascade' }),
  contactId: varchar("contact_id").notNull().references(() => contacts.id, { onDelete: 'cascade' }),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rentAmount: decimal("rent_amount", { precision: 10, scale: 2 }).notNull(),
  paymentFrequency: text("payment_frequency").notNull().default('monthly'),
  securityDeposit: decimal("security_deposit", { precision: 10, scale: 2 }),
  documentUrl: text("document_url"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().$defaultFn(() => generateId()),
  contractId: varchar("contract_id").notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  dueDate: timestamp("due_date").notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default('pending'),
  paidDate: timestamp("paid_date"),
  createdAt: timestamp("created_at").notNull().$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });

// Manual contact schema for SQLite integer boolean compatibility
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

// Contract schema that accepts date strings or Date objects and handles number/string for amounts
const baseContractSchema = createInsertSchema(contracts).omit({ id: true, createdAt: true });
export const insertContractSchema = baseContractSchema.extend({
  startDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
  endDate: z.preprocess((val) => {
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date()),
  rentAmount: z.union([z.string(), z.number()]).transform(val =>
    typeof val === 'string' ? val : val.toString()
  ),
  securityDeposit: z.union([z.string(), z.number()]).optional().transform(val =>
    val === undefined ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true });

// Update schemas for PATCH operations (all fields optional)
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
  }, z.date().optional()),
  endDate: z.preprocess((val) => {
    if (val === undefined) return undefined;
    if (typeof val === 'string') return new Date(val);
    return val;
  }, z.date().optional()),
  rentAmount: z.union([z.string(), z.number()]).optional().transform(val =>
    val === undefined ? undefined : (typeof val === 'string' ? val : val.toString())
  ),

  securityDeposit: z.union([z.string(), z.number(), z.null()]).optional().transform(val =>
    val === undefined || val === null ? undefined : (typeof val === 'string' ? val : val.toString())
  ),
  paymentFrequency: z.string().optional(),
  documentUrl: z.string().optional(),
});

export const updatePaymentSchema = insertPaymentSchema.partial();

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
