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
   * Send payment reminders
   */
  async sendPaymentReminders() {
    // This would be implemented based on your payment schedule logic
    console.log('Sending payment reminders...');
    // TODO: Query upcoming payments and send reminders
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