import { db } from '../../db';
import {
  notifications,
  notificationTemplates,
  notificationPreferences,
  type NewNotification,
  NotificationStatus,
  NotificationChannel,
  NotificationType
} from '@shared/notifications-schema';
import { whatsAppService } from './whatsapp.service';
import { getTemplate, renderTemplate, type TemplateVariable } from './notification-templates';
import { eq, and, lt, gte } from 'drizzle-orm';
import cron from 'node-cron';

class NotificationService {
  constructor() {
    // Initialize scheduled tasks
    this.initializeScheduledTasks();
  }

  /**
   * Send a notification
   */
  async sendNotification(params: {
    type: string;
    recipientId: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientName?: string;
    templateData?: TemplateVariable;
    metadata?: Record<string, any>;
    scheduledFor?: Date;
    channel?: string;
    language?: string;
  }): Promise<string | null> {
    try {
      // Get recipient preferences
      const preferences = await this.getRecipientPreferences(params.recipientId);

      // Check if notifications are enabled for this type
      if (!this.isNotificationEnabled(params.type, preferences)) {
        console.log(`Notifications disabled for type ${params.type} for recipient ${params.recipientId}`);
        return null;
      }

      // Determine channel (WhatsApp by default if enabled)
      const channel = params.channel ||
        (preferences?.whatsappEnabled ? NotificationChannel.WHATSAPP : NotificationChannel.IN_APP);

      // Get template
      const language = params.language || preferences?.preferredLanguage || 'en';
      const template = getTemplate(params.type, language);

      if (!template) {
        throw new Error(`Template not found for type: ${params.type}`);
      }

      // Render template with data
      const subject = template.subject ? renderTemplate(template.subject, params.templateData || {}) : undefined;
      const message = renderTemplate(template.body, params.templateData || {});

      // Create notification record
      const [notification] = await db.insert(notifications).values({
        type: params.type as any,
        channel: channel as any,
        status: NotificationStatus.PENDING,
        recipientId: params.recipientId,
        recipientPhone: params.recipientPhone,
        recipientEmail: params.recipientEmail,
        recipientName: params.recipientName,
        subject,
        message,
        templateData: params.templateData as any,
        metadata: params.metadata as any,
        scheduledFor: params.scheduledFor,
      }).returning();

      // If not scheduled, send immediately
      if (!params.scheduledFor) {
        await this.processNotification(notification.id);
      }

      return notification.id;
    } catch (error) {
      console.error('Send notification error:', error);
      return null;
    }
  }

  /**
   * Process and send a notification
   */
  async processNotification(notificationId: string): Promise<boolean> {
    try {
      const [notification] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notificationId));

      if (!notification) {
        throw new Error('Notification not found');
      }

      let success = false;
      let messageId: string | undefined;
      let error: string | undefined;

      // Send based on channel
      switch (notification.channel) {
        case NotificationChannel.WHATSAPP:
          if (notification.recipientPhone) {
            const result = await whatsAppService.sendMessage({
              to: notification.recipientPhone,
              message: notification.message,
            });
            success = result.success;
            messageId = result.messageId;
            error = result.error;
          }
          break;

        case NotificationChannel.EMAIL:
          // TODO: Implement email sending
          console.log('Email notifications not yet implemented');
          break;

        case NotificationChannel.SMS:
          // TODO: Implement SMS sending
          console.log('SMS notifications not yet implemented');
          break;

        case NotificationChannel.IN_APP:
          // In-app notifications are already stored, just mark as delivered
          success = true;
          break;
      }

      // Update notification status
      await db.update(notifications)
        .set({
          status: success ? NotificationStatus.SENT : NotificationStatus.FAILED,
          sentAt: success ? new Date() : undefined,
          whatsappMessageId: messageId,
          failureReason: error,
          retryCount: notification.retryCount + 1,
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, notificationId));

      return success;
    } catch (error: any) {
      console.error('Process notification error:', error);

      // Update notification with error
      await db.update(notifications)
        .set({
          status: NotificationStatus.FAILED,
          failureReason: error.message,
          failedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(notifications.id, notificationId));

      return false;
    }
  }

  /**
   * Send bulk notifications
   */
  async sendBulkNotifications(recipients: Array<{
    recipientId: string;
    recipientPhone?: string;
    recipientEmail?: string;
    recipientName?: string;
    templateData?: TemplateVariable;
  }>, type: string, metadata?: Record<string, any>): Promise<string[]> {
    const notificationIds: string[] = [];

    for (const recipient of recipients) {
      const id = await this.sendNotification({
        type,
        ...recipient,
        metadata,
      });

      if (id) {
        notificationIds.push(id);
      }
    }

    return notificationIds;
  }

  /**
   * Get recipient preferences
   */
  async getRecipientPreferences(recipientId: string) {
    const [preference] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, recipientId));

    return preference;
  }

  /**
   * Check if notification is enabled for type
   */
  private isNotificationEnabled(type: string, preferences: any): boolean {
    if (!preferences) return true; // Default to enabled if no preferences

    switch (type) {
      case NotificationType.PAYMENT_REMINDER:
      case NotificationType.PAYMENT_RECEIVED:
      case NotificationType.PAYMENT_OVERDUE:
        return preferences.paymentReminders;

      case NotificationType.CONTRACT_EXPIRING:
      case NotificationType.CONTRACT_EXPIRED:
      case NotificationType.CONTRACT_RENEWED:
        return preferences.contractAlerts;

      case NotificationType.MAINTENANCE_SCHEDULED:
      case NotificationType.MAINTENANCE_COMPLETED:
        return preferences.maintenanceUpdates;

      case NotificationType.ANNOUNCEMENT:
        return preferences.announcements;

      default:
        return true;
    }
  }

  /**
   * Initialize scheduled tasks
   */
  private initializeScheduledTasks() {
    // Process scheduled notifications every minute
    cron.schedule('* * * * *', async () => {
      await this.processScheduledNotifications();
    });

    // Retry failed notifications every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
      await this.retryFailedNotifications();
    });

    // Send payment reminders daily at 9 AM
    cron.schedule('0 9 * * *', async () => {
      await this.sendPaymentReminders();
    });

    // Check expiring contracts daily at 10 AM
    cron.schedule('0 10 * * *', async () => {
      await this.checkExpiringContracts();
    });
  }

  /**
   * Process scheduled notifications
   */
  async processScheduledNotifications() {
    try {
      const now = new Date();
      const pendingNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.status, NotificationStatus.PENDING),
            lt(notifications.scheduledFor!, now)
          )
        );

      for (const notification of pendingNotifications) {
        await this.processNotification(notification.id);
      }
    } catch (error) {
      console.error('Process scheduled notifications error:', error);
    }
  }

  /**
   * Retry failed notifications
   */
  async retryFailedNotifications() {
    try {
      const maxRetries = Number(process.env.NOTIFICATION_RETRY_ATTEMPTS) || 3;

      const failedNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.status, NotificationStatus.FAILED),
            lt(notifications.retryCount, maxRetries)
          )
        );

      for (const notification of failedNotifications) {
        await this.processNotification(notification.id);
      }
    } catch (error) {
      console.error('Retry failed notifications error:', error);
    }
  }

  /**
   * Send payment reminders based on payment frequency
   * - Monthly: 5 days before
   * - Quarterly, Semi-Annually, Yearly: 30, 15, 5 days before
   */
  async sendPaymentReminders() {
    console.log('Starting payment reminders job...');

    try {
      // Import storage here to avoid circular dependency
      const { storage } = await import('../storage');

      // Get all upcoming payments within 31 days (to cover 30-day reminders)
      const upcomingPayments = await storage.getUpcomingPaymentsWithDetails(31);
      console.log(`Found ${upcomingPayments.length} upcoming payments to check`);

      for (const { payment, contract, contact, unit } of upcomingPayments) {
        const dueDate = new Date(payment.dueDate);
        const now = new Date();
        const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Determine if we should send notification based on frequency
        const reminderType = this.shouldSendReminder(daysUntilDue, contract.paymentFrequency);

        if (!reminderType) {
          continue; // Not a notification day for this payment
        }

        // Check if we already sent this reminder for this payment
        const alreadySent = await this.checkIfReminderSent(payment.id, reminderType);
        if (alreadySent) {
          console.log(`Reminder ${reminderType} already sent for payment ${payment.id}, skipping`);
          continue;
        }

        console.log(`Sending ${reminderType} reminder for payment ${payment.id} (${contact.fullName}, ${unit.unitNumber})`);

        // Send the notification
        await this.sendNotification({
          type: 'payment_reminder',
          recipientId: contact.id,
          recipientPhone: contact.phone || undefined,
          recipientName: contact.fullName,
          templateData: {
            tenantName: contact.fullName,
            unitNumber: unit.unitNumber,
            amount: payment.amount,
            dueDate: dueDate.toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            daysUntilDue: daysUntilDue.toString(),
            companyName: 'Property Management'
          },
          metadata: {
            paymentId: payment.id,
            reminderType: reminderType,
            contractId: contract.id,
            unitId: unit.id
          },
          channel: contact.phone ? 'whatsapp' : 'in_app'
        });

        console.log(`Successfully queued ${reminderType} reminder for ${contact.fullName}`);
      }

      console.log('Payment reminders job completed');
    } catch (error) {
      console.error('Error in sendPaymentReminders:', error);
    }
  }

  /**
   * Determine if a reminder should be sent based on days until due and frequency
   * Returns reminder type ('30d', '15d', '5d') or null if not a reminder day
   */
  private shouldSendReminder(daysUntilDue: number, frequency: string): string | null {
    const freq = frequency?.toLowerCase() || 'monthly';

    if (freq === 'monthly') {
      // Monthly: only 5 days before
      if (daysUntilDue === 5) return '5d';
    } else {
      // Quarterly, Semi-Annually, Yearly: 30, 15, 5 days before
      if (daysUntilDue === 30) return '30d';
      if (daysUntilDue === 15) return '15d';
      if (daysUntilDue === 5) return '5d';
    }

    return null;
  }

  /**
   * Check if a specific reminder type was already sent for a payment
   */
  private async checkIfReminderSent(paymentId: string, reminderType: string): Promise<boolean> {
    try {
      const existingNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.type, 'payment_reminder' as any)
          )
        );

      // Check metadata for matching paymentId and reminderType
      for (const notification of existingNotifications) {
        const metadata = notification.metadata as any;
        if (metadata?.paymentId === paymentId && metadata?.reminderType === reminderType) {
          return true;
        }
      }

      return false;
    } catch (error) {
      console.error('Error checking reminder status:', error);
      return false;
    }
  }

  /**
   * Check expiring contracts
   */
  async checkExpiringContracts() {
    // This would be implemented based on your contract logic
    console.log('Checking expiring contracts...');
    // TODO: Query contracts expiring in next 30 days and send notifications
  }

  /**
   * Get notification history for a recipient
   */
  async getNotificationHistory(recipientId: string, limit: number = 50) {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.recipientId, recipientId))
      .orderBy(notifications.createdAt)
      .limit(limit);
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string) {
    await db.update(notifications)
      .set({
        status: NotificationStatus.READ,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(notifications.id, notificationId));
  }

  /**
   * Update recipient preferences
   */
  async updatePreferences(userId: string, preferences: any) {
    const existing = await this.getRecipientPreferences(userId);

    if (existing) {
      await db.update(notificationPreferences)
        .set({
          ...preferences,
          updatedAt: new Date(),
        })
        .where(eq(notificationPreferences.userId, userId));
    } else {
      await db.insert(notificationPreferences)
        .values({
          userId,
          ...preferences,
        });
    }
  }
}

export const notificationService = new NotificationService();