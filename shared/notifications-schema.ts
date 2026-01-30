import { z } from "zod";
import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createId } from '@paralleldrive/cuid2';

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
} as const;

// Notifications table
export const notifications = pgTable('notifications', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  type: text('type', { enum: Object.values(NotificationType) as [string, ...string[]] }).notNull(),
  channel: text('channel', { enum: Object.values(NotificationChannel) as [string, ...string[]] }).notNull(),
  status: text('status', { enum: Object.values(NotificationStatus) as [string, ...string[]] }).notNull().default('pending'),

  // Recipient info
  recipientId: text('recipient_id').notNull(), // Reference to contact/user
  recipientPhone: text('recipient_phone'),
  recipientEmail: text('recipient_email'),
  recipientName: text('recipient_name'),

  // Message content
  subject: text('subject'),
  message: text('message').notNull(),
  templateId: text('template_id'),
  templateData: jsonb('template_data'), // Variables for template

  // Metadata
  metadata: jsonb('metadata'), // Additional data (contract_id, payment_id, etc.)
  scheduledFor: timestamp('scheduled_for'),
  sentAt: timestamp('sent_at'),
  deliveredAt: timestamp('delivered_at'),
  readAt: timestamp('read_at'),
  failedAt: timestamp('failed_at'),
  failureReason: text('failure_reason'),
  retryCount: integer('retry_count').default(0),

  // WhatsApp specific
  whatsappMessageId: text('whatsapp_message_id'),
  whatsappStatus: text('whatsapp_status'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification Templates
export const notificationTemplates = pgTable('notification_templates', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  name: text('name').notNull(),
  type: text('type', { enum: Object.values(NotificationType) as [string, ...string[]] }).notNull(),
  channel: text('channel', { enum: Object.values(NotificationChannel) as [string, ...string[]] }).notNull(),

  // Template content with variables like {{name}}, {{amount}}, etc.
  subject: text('subject'),
  bodyTemplate: text('body_template').notNull(),

  // Language support
  language: text('language').default('en'),

  // WhatsApp template ID (if using pre-approved templates)
  whatsappTemplateId: text('whatsapp_template_id'),
  whatsappTemplateName: text('whatsapp_template_name'),

  isActive: boolean('is_active').default(true),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Notification Preferences (per user/contact)
export const notificationPreferences = pgTable('notification_preferences', {
  id: text('id').primaryKey().$defaultFn(() => createId()),
  userId: text('user_id').notNull(), // Reference to contact/user

  // Channel preferences
  whatsappEnabled: boolean('whatsapp_enabled').default(true),
  emailEnabled: boolean('email_enabled').default(true),
  smsEnabled: boolean('sms_enabled').default(false),
  inAppEnabled: boolean('in_app_enabled').default(true),

  // Type preferences
  paymentReminders: boolean('payment_reminders').default(true),
  contractAlerts: boolean('contract_alerts').default(true),
  maintenanceUpdates: boolean('maintenance_updates').default(true),
  announcements: boolean('announcements').default(true),

  // Timing preferences
  quietHoursStart: text('quiet_hours_start'), // e.g., "22:00"
  quietHoursEnd: text('quiet_hours_end'), // e.g., "08:00"
  timezone: text('timezone').default('UTC'),

  // Language preference
  preferredLanguage: text('preferred_language').default('en'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Schemas for validation
export const createNotificationSchema = z.object({
  type: z.enum(Object.values(NotificationType) as [string, ...string[]]),
  channel: z.enum(Object.values(NotificationChannel) as [string, ...string[]]),
  recipientId: z.string(),
  recipientPhone: z.string().optional(),
  recipientEmail: z.string().email().optional(),
  recipientName: z.string().optional(),
  subject: z.string().optional(),
  message: z.string(),
  templateId: z.string().optional(),
  templateData: z.record(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
  scheduledFor: z.date().optional(),
});

export const updateNotificationStatusSchema = z.object({
  status: z.enum(Object.values(NotificationStatus) as [string, ...string[]]),
  whatsappMessageId: z.string().optional(),
  whatsappStatus: z.string().optional(),
  failureReason: z.string().optional(),
});

export const createTemplateSchema = z.object({
  name: z.string(),
  type: z.enum(Object.values(NotificationType) as [string, ...string[]]),
  channel: z.enum(Object.values(NotificationChannel) as [string, ...string[]]),
  subject: z.string().optional(),
  bodyTemplate: z.string(),
  language: z.string().default('en'),
  whatsappTemplateId: z.string().optional(),
  whatsappTemplateName: z.string().optional(),
});

export const updatePreferencesSchema = z.object({
  whatsappEnabled: z.boolean().optional(),
  emailEnabled: z.boolean().optional(),
  smsEnabled: z.boolean().optional(),
  inAppEnabled: z.boolean().optional(),
  paymentReminders: z.boolean().optional(),
  contractAlerts: z.boolean().optional(),
  maintenanceUpdates: z.boolean().optional(),
  announcements: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
  timezone: z.string().optional(),
  preferredLanguage: z.string().optional(),
});

// Types
export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NotificationPreference = typeof notificationPreferences.$inferSelect;