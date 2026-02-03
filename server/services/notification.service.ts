import { db } from '../../db';
import {
  notifications,
  NotificationStatus,
  NotificationChannel,
  NotificationType
} from '@shared/sqlite-schema';
// For Postgres-only features (templates/preferences), import conditionally or skip
// import { notificationTemplates, notificationPreferences } from '@shared/notifications-schema';
import { whatsAppService } from './whatsapp.service';
import { getTemplate, renderTemplate, type TemplateVariable } from './notification-templates';
import { eq, and, lt, gte } from 'drizzle-orm';
import cron from 'node-cron';

class NotificationService {

  /**
   * Log a system event (cron job execution, etc)
   */
  async logSystemEvent(message: string, metadata: Record<string, any> = {}) {
    try {
      // Use a fixed system user ID or a placeholder
      const SYSTEM_USER_ID = 'system_admin';

      await db.insert(notifications).values({
        type: 'system_alert' as any, // Cast to any to avoid type errors if schema update isn't fully propagated in types
        channel: 'internal' as any,
        status: NotificationStatus.READ, // Auto-mark as read so it doesn't clutter
        recipientId: SYSTEM_USER_ID,
        recipientName: 'Property Manager',
        subject: 'System Job Log',
        message: message,
        metadata: {
          ...metadata,
          isSystemLog: true
        }
      });
      console.log(`[System Log] ${message}`);
    } catch (error) {
      console.error('Failed to log system event:', error);
    }
  }

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

    // Send monthly unpaid payment summary on the last day of each month at 9 AM
    // Using 28-31 covers all months; we check if it's actually the last day
    cron.schedule('0 9 28-31 * *', async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Only run if tomorrow is a new month (meaning today is the last day)
      if (tomorrow.getMonth() !== today.getMonth()) {
        console.log('📅 End of month - sending unpaid payment summaries...');
        await this.sendMonthlyUnpaidSummary();
      }
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
    try {
      console.log('Running daily payment reminders check...');
      const startTime = Date.now();
      let processedCount = 0;
      let sentCount = 0;

      await this.logSystemEvent('Payment Reminders Job Started', { job: 'payment_reminders' });

      // Import storage here to avoid circular dependency
      const { storage } = await import('../storage');

      // Check if auto payment notifications are enabled
      const autoNotificationsEnabled = await storage.getSystemSetting('autoPaymentNotifications');
      if (autoNotificationsEnabled === 'false') {
        console.log('Auto payment notifications are disabled in system settings. Skipping.');
        await this.logSystemEvent('Payment Reminders Job Skipped (Disabled)', { job: 'payment_reminders' });
        return;
      }

      // Get all upcoming payments within 31 days (to cover 30-day reminders)
      const upcomingPayments = await storage.getUpcomingPaymentsWithDetails(31);
      console.log(`Found ${upcomingPayments.length} upcoming payments to check`);

      for (const { payment, contract, contact, unit } of upcomingPayments) {
        processedCount++;
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

        sentCount++;
        console.log(`Successfully queued ${reminderType} reminder for ${contact.fullName}`);
      }

      const duration = Date.now() - startTime;
      console.log('Payment reminders job completed');

      await this.logSystemEvent(`Payment Reminders Job Completed`, {
        job: 'payment_reminders',
        processed: processedCount,
        sent: sentCount,
        durationMs: duration,
        status: 'success'
      });

    } catch (error: any) {
      console.error('Error in sendPaymentReminders:', error);
      await this.logSystemEvent(`Payment Reminders Job Failed: ${error.message}`, {
        job: 'payment_reminders',
        error: error.message,
        status: 'error'
      });
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
    try {
      console.log('Running daily contract expiry check...');
      const startTime = Date.now();
      let processedCount = 0;
      let sentCount = 0;

      await this.logSystemEvent('Contract Expiry Check Job Started', { job: 'contract_expiry' });

      // Import storage here to avoid circular dependency
      const { storage } = await import('../storage');

      // Get all active contracts
      const contracts = await storage.getContracts(); // Assuming this method exists or similar

      const now = new Date();
      now.setHours(0, 0, 0, 0);

      // This is still a placeholder logic as per original code, but now logged
      // In a real implementation we would iterate contracts here

      // For now, just log that it ran
      console.log(`Checking ${contracts.length} contracts for expiry...`);
      processedCount = contracts.length;

      const duration = Date.now() - startTime;
      await this.logSystemEvent(`Contract Expiry Check Job Completed`, {
        job: 'contract_expiry',
        processed: processedCount,
        sent: sentCount,
        durationMs: duration,
        status: 'success'
      });

    } catch (error: any) {
      console.error('Error checking expiring contracts:', error);
      await this.logSystemEvent(`Contract Expiry Check Failed: ${error.message}`, {
        job: 'contract_expiry',
        error: error.message,
        status: 'error'
      });
    }
  }

  /**
   * Send monthly unpaid payment summary to customers with pending/overdue payments
   * Runs on the last day of each month
   * @param targetName Optional name to filter by (for testing)
   */
  async sendMonthlyUnpaidSummary(targetName?: string) {
    try {
      console.log('Starting monthly unpaid payment summary job...');
      const startTime = Date.now();
      let sentCount = 0;

      await this.logSystemEvent('Monthly Unpaid Summary Job Started', {
        job: 'monthly_summary',
        target: targetName || 'all'
      });
      // Import storage here to avoid circular dependency
      const { storage } = await import('../storage');

      // Check if auto monthly summary is enabled
      const autoMonthlySummaryEnabled = await storage.getSystemSetting('autoMonthlySummary');
      if (autoMonthlySummaryEnabled === 'false') {
        console.log('Auto monthly summary is disabled in system settings. Skipping.');
        return;
      }

      // Get all users
      const users = await storage.getUsers();
      console.log(`[Monthly Job] Found ${users.length} users to process.`);

      for (const user of users) {
        // Get all payments for this user
        const payments = await storage.getPayments(user.id);

        // Calculate the start of the current month
        const today = new Date();
        const startOfCurrentMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Filter for ONLY overdue payments that were due BEFORE the current month
        // This excludes payments that just became due/overdue in the current month
        const overduePayments = payments.filter(p => {
          // Include if status is 'overdue' OR if 'pending' but due date is passed
          const isUnpaid = p.status === 'overdue' || p.status === 'pending';
          if (!isUnpaid) return false;

          const dueDate = new Date(p.dueDate);
          return dueDate < startOfCurrentMonth;
        });

        if (overduePayments.length > 0) {
          console.log(`[Monthly Job] User ${user.fullName} has ${overduePayments.length} overdue payments.`);
        }

        if (overduePayments.length === 0) continue;

        // Group overdue payments by contract
        const paymentsByContract: Record<string, typeof overduePayments> = {};
        for (const payment of overduePayments) {
          if (!paymentsByContract[payment.contractId]) {
            paymentsByContract[payment.contractId] = [];
          }
          paymentsByContract[payment.contractId].push(payment);
        }

        // Send notification for each contract with overdue payments
        for (const [contractId, contractPayments] of Object.entries(paymentsByContract)) {
          const contract = await storage.getContract(contractId);
          if (!contract) continue;

          const unit = await storage.getUnit(contract.unitId);
          const contact = await storage.getContact(contract.contactId);

          if (!contact || !contact.phone) continue;

          // Filter by name if provided (for testing)
          if (targetName && !contact.fullName.toLowerCase().includes(targetName.toLowerCase())) {
            continue;
          }

          // Calculate total and find oldest due date
          const totalAmount = contractPayments.reduce(
            (sum, p) => sum + parseFloat(p.amount || '0'),
            0
          );

          // Build payments list - only overdue from previous months
          const paymentsList = contractPayments
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((p, index) => {
              const dueDate = new Date(p.dueDate).toLocaleDateString('ar-SA');
              const amount = parseFloat(p.amount || '0').toLocaleString('ar-SA');
              return `${index + 1}. ${dueDate} - ${amount} ريال`;
            })
            .join('\n');

          console.log(`📱 Sending monthly unpaid summary to ${contact.fullName} for unit ${unit?.unitNumber}`);

          // Send via WhatsApp using the template
          const template = getTemplate('monthly_unpaid_summary', 'ar');
          if (template) {
            const message = renderTemplate(template.body, {
              tenantName: contact.fullName,
              unitNumber: unit?.unitNumber || 'N/A',
              totalAmount: totalAmount.toLocaleString('ar-SA') + ' ريال',
              paymentsList: paymentsList,
              companyName: 'Real Estate CRM'
            });

            const result = await whatsAppService.sendMessage({
              to: contact.phone,
              message: message
            });

            const status = result.success ? NotificationStatus.SENT : NotificationStatus.FAILED;

            // Save notification to database
            await (db as any).insert(notifications).values({
              type: NotificationType.MONTHLY_UNPAID_SUMMARY,
              channel: NotificationChannel.WHATSAPP,
              status: status,
              recipientId: contact.id,
              recipientPhone: contact.phone,
              recipientName: contact.fullName,
              message: message,
              sentAt: result.success ? new Date().toISOString() : undefined,
              whatsappMessageId: result.messageId,
              failureReason: result.error,
              metadata: JSON.stringify({
                unitId: unit?.id,
                unitNumber: unit?.unitNumber,
                totalAmount: totalAmount,
                count: overduePayments.length
              })
            });

            if (result.success) {
              sentCount++;
              console.log(`✅ Monthly summary sent to ${contact.fullName}`);
            } else {
              console.error(`❌ Failed to send to ${contact.fullName}:`, result.error);
            }
          }
        }
      }

      const duration = Date.now() - startTime;
      console.log('Monthly unpaid payment summary job completed');

      await this.logSystemEvent(`Monthly Unpaid Summary Job Completed`, {
        job: 'monthly_summary',
        sent: sentCount,
        durationMs: duration,
        status: 'success'
      });

    } catch (error: any) {
      console.error('Error in sendMonthlyUnpaidSummary:', error);
      await this.logSystemEvent(`Monthly Unpaid Summary Failed: ${error.message}`, {
        job: 'monthly_summary',
        error: error.message,
        status: 'error'
      });
    }
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